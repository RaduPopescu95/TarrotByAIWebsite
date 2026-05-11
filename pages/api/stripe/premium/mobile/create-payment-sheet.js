import Stripe from "stripe";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "../../../../../lib/firebaseAdmin";
import { omitFirebaseIdTokenFromPayload, requireAuth } from "../../../../../lib/requireAuth";
import { PREMIUM_FLOW_METADATA } from "../../../../../lib/premiumAccess";
import {
  normalizeBillingDetails,
  buildBillingContextInput,
} from "../../../../../lib/stripeBillingDetails";
import {
  buildInvoiceDecision,
  logBillingAudit,
  normalizeBillingContext,
} from "../../../../../utils/billingAudit.mjs";
import {
  isStripePremiumUsingLocalOverrides,
  resolvePremiumStripePriceId,
} from "../../../../../lib/stripePremiumEnv";

const STRIPE_API_VERSION = "2026-02-25.clover";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: STRIPE_API_VERSION,
});
const PREMIUM_MOBILE_SESSION_COLLECTION = "premiumMobilePaymentSheets";

async function resolveOrCreateCustomer({ db, uid, email }) {
  const userRef = db.collection("Users").doc(uid);
  const snap = await userRef.get();
  const existing = snap.exists ? snap.data()?.stripeCustomerId : null;

  if (typeof existing === "string" && existing.trim()) {
    return existing.trim();
  }

  const customer = await stripe.customers.create({
    email: email || undefined,
    metadata: { uid, flow: PREMIUM_FLOW_METADATA },
  });

  await userRef.set(
    {
      stripeCustomerId: customer.id,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  return customer.id;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const priceId = resolvePremiumStripePriceId();
  if (!priceId) {
    console.error(
      "[premium.mobile.payment_sheet] missing price id: STRIPE_PREMIUM_PRICE_ID" +
        (process.env.NODE_ENV === "development" ? " or STRIPE_PREMIUM_PRICE_ID_TEST" : "")
    );
    return res.status(500).json({ error: "Premium billing is not configured" });
  }
  if (isStripePremiumUsingLocalOverrides() && process.env.STRIPE_PREMIUM_PRICE_ID_TEST) {
    console.info("[premium.mobile.payment_sheet] using STRIPE_PREMIUM_PRICE_ID_TEST for development");
  }

  let authUser;
  try {
    authUser = await requireAuth(req);
  } catch (err) {
    const code = err.statusCode || 401;
    return res.status(code).json({ error: err.message || "Unauthorized" });
  }

  const { billingDetails: rawBillingDetails } = req.body || {};
  let billingDetails = null;
  let billingAudit = null;
  let invoiceDecision = null;

  try {
    billingDetails = normalizeBillingDetails(rawBillingDetails, authUser.email || "");
    billingAudit = normalizeBillingContext(
      buildBillingContextInput(billingDetails, rawBillingDetails, authUser.email || ""),
      { defaultCountry: "Romania", individualCnpOptional: true }
    );
    invoiceDecision = buildInvoiceDecision(billingAudit);
    logBillingAudit({
      flow: "premium_subscription_mobile",
      stage: "api_payment_sheet_received",
      raw: rawBillingDetails || {},
      normalized: billingAudit.normalizedClient,
      decision: invoiceDecision,
    });
    if (!billingAudit.validation.ok) {
      return res.status(400).json({
        error: billingAudit.validation.blockingErrors[0]?.message || "Invalid billing details",
        details: billingAudit.validation.blockingErrors,
      });
    }
  } catch (auditErr) {
    console.error("[premium.mobile.payment_sheet] billing_audit_error", auditErr?.message || auditErr);
    return res.status(400).json({ error: "Invalid billing payload" });
  }

  const uid = authUser.uid;
  const db = getAdminDb();

  try {
    const customerId = await resolveOrCreateCustomer({
      db,
      uid,
      email: authUser.email || billingDetails?.email || "",
    });

    // Cancel any existing incomplete subscriptions for this customer
    const existingSubs = await stripe.subscriptions.list({
      customer: customerId,
      status: "incomplete",
      limit: 10,
    });
    for (const sub of existingSubs.data) {
      console.log("[premium.mobile.payment_sheet] Canceling existing incomplete subscription:", sub.id);
      try {
        await stripe.subscriptions.cancel(sub.id);
      } catch (cancelErr) {
        console.warn("[premium.mobile.payment_sheet] Failed to cancel incomplete sub:", sub.id, cancelErr?.message);
      }
    }

    // Fetch the price to get the amount
    const price = await stripe.prices.retrieve(priceId);
    if (!price.unit_amount || !price.currency) {
      console.error("[premium.mobile.payment_sheet] Invalid price configuration", { priceId });
      return res.status(500).json({ error: "Invalid price configuration" });
    }

    const metadata = {
      uid,
      flow: PREMIUM_FLOW_METADATA,
      platform: "expo",
      checkoutSurface: "payment_sheet",
      priceId,
      invoiceSendEmail: String(billingDetails?.invoicePreferences?.sendEmail !== false),
      invoiceEInvoice: String(invoiceDecision.sendEInvoice),
      invoiceDeliveryInRomania: String(billingAudit.normalizedClient.deliveryInRomania),
      invoiceEligibleForEInvoice: String(billingAudit.normalizedClient.eligibleForEInvoice),
    };
    if (billingDetails?.billingType) {
      metadata.billingType = billingDetails.billingType;
    }
    if (
      billingDetails?.invoicePreferences?.dueDays !== null &&
      billingDetails?.invoicePreferences?.dueDays !== undefined
    ) {
      metadata.invoiceDueDays = String(billingDetails.invoicePreferences.dueDays);
    }

    // Create PaymentIntent with setup_future_usage to save the payment method
    // This shows the correct amount in PaymentSheet (e.g., 5 EUR)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: price.unit_amount,
      currency: price.currency,
      customer: customerId,
      setup_future_usage: "off_session",
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: "never",
      },
      metadata,
    });

    console.log("[premium.mobile.payment_sheet] PaymentIntent created", {
      paymentIntentId: paymentIntent.id,
      amount: price.unit_amount,
      currency: price.currency,
      status: paymentIntent.status,
      hasClientSecret: !!paymentIntent.client_secret,
    });

    // Store payment session data - will create subscription after payment succeeds
    await db
      .collection(PREMIUM_MOBILE_SESSION_COLLECTION)
      .doc(paymentIntent.id)
      .set(
        {
          uid,
          stripeCustomerId: customerId,
          stripePaymentIntentId: paymentIntent.id,
          pendingPriceId: priceId,
          pendingMetadata: metadata,
          amount: price.unit_amount,
          currency: price.currency,
          status: "pending_payment",
          flow: PREMIUM_FLOW_METADATA,
          billing: billingDetails,
          rawFormValues: rawBillingDetails || null,
          normalizedBeforeCheckout: billingAudit.normalizedClient,
          stripeMetadataSnapshot: metadata,
          invoiceDecision,
          checkoutRequestPayload: omitFirebaseIdTokenFromPayload(req.body) || {},
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

    await db.collection("Users").doc(uid).set(
      {
        premiumBillingProfile: {
          billing: billingDetails,
          rawFormValues: rawBillingDetails ?? null,
          normalizedBeforeCheckout: billingAudit.normalizedClient,
          stripeMetadataSnapshot: metadata,
          invoiceDecision,
          paymentSheetPendingPaymentIntentId: paymentIntent.id,
          updatedAt: FieldValue.serverTimestamp(),
        },
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    const ephemeralKey = await stripe.ephemeralKeys.create(
      { customer: customerId },
      { apiVersion: STRIPE_API_VERSION }
    );

    // Return PaymentIntent client secret - shows correct amount in PaymentSheet
    return res.status(200).json({
      paymentIntentClientSecret: paymentIntent.client_secret,
      customerEphemeralKeySecret: ephemeralKey.secret,
      customerId,
      paymentIntentId: paymentIntent.id,
    });
  } catch (err) {
    console.error("[premium.mobile.payment_sheet] stripe_error", { message: err?.message });
    return res.status(500).json({ error: "Could not start premium payment" });
  }
}
