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
import { syncPremiumSubscription } from "../../../../../lib/stripePremiumSubscriptionSync";

const STRIPE_API_VERSION = "2026-02-25.clover";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: STRIPE_API_VERSION,
});
const PREMIUM_MOBILE_SESSION_COLLECTION = "premiumMobilePaymentSheets";

function getPaymentIntentFromSubscription(subscription) {
  const invoice = subscription?.latest_invoice;
  const paymentIntent = invoice?.payment_intent;
  if (paymentIntent && typeof paymentIntent === "object") {
    return paymentIntent;
  }
  return null;
}

/** payment_intent may be an id string even when expand is requested; invoice may be id-only. */
async function resolvePaymentIntentClientSecret(stripe, subscription) {
  console.log("[resolvePI] Starting", {
    subscriptionId: subscription?.id,
    status: subscription?.status,
    latestInvoiceType: typeof subscription?.latest_invoice,
    latestInvoiceId: typeof subscription?.latest_invoice === "object" ? subscription?.latest_invoice?.id : subscription?.latest_invoice,
  });

  let pi = getPaymentIntentFromSubscription(subscription);
  if (pi?.client_secret) {
    console.log("[resolvePI] Found client_secret directly from subscription");
    return { clientSecret: pi.client_secret, paymentIntentId: pi.id || null };
  }

  console.log("[resolvePI] No direct client_secret, pi type:", typeof pi, pi ? "has pi" : "no pi");

  const invoiceRef = subscription?.latest_invoice;
  let paymentIntentId =
    typeof invoiceRef === "object" && typeof invoiceRef?.payment_intent === "string"
      ? invoiceRef.payment_intent
      : null;

  console.log("[resolvePI] paymentIntentId from invoice:", paymentIntentId, "invoice.payment_intent type:", typeof invoiceRef?.payment_intent);

  if (paymentIntentId) {
    console.log("[resolvePI] Retrieving PI by ID:", paymentIntentId);
    const retrieved = await stripe.paymentIntents.retrieve(paymentIntentId);
    console.log("[resolvePI] Retrieved PI status:", retrieved?.status, "has client_secret:", !!retrieved?.client_secret);
    if (retrieved?.client_secret) {
      return { clientSecret: retrieved.client_secret, paymentIntentId: retrieved.id };
    }
  }

  const invoiceId = typeof invoiceRef === "string" ? invoiceRef : invoiceRef?.id;
  if (invoiceId) {
    console.log("[resolvePI] Retrieving invoice with expand:", invoiceId);
    const invoice = await stripe.invoices.retrieve(invoiceId, {
      expand: ["payment_intent"],
    });
    const pir = invoice.payment_intent;
    console.log("[resolvePI] Invoice PI type:", typeof pir, pir?.id || pir);
    if (pir && typeof pir === "object" && pir.client_secret) {
      return { clientSecret: pir.client_secret, paymentIntentId: pir.id };
    }
    if (typeof pir === "string") {
      console.log("[resolvePI] Retrieving PI from invoice ID string:", pir);
      const retrieved = await stripe.paymentIntents.retrieve(pir);
      if (retrieved?.client_secret) {
        return { clientSecret: retrieved.client_secret, paymentIntentId: retrieved.id };
      }
    }
  }

  console.log("[resolvePI] Refreshing subscription");
  const refreshed = await stripe.subscriptions.retrieve(subscription.id, {
    expand: ["latest_invoice.payment_intent"],
  });
  console.log("[resolvePI] Refreshed subscription status:", refreshed?.status);
  pi = getPaymentIntentFromSubscription(refreshed);
  if (pi?.client_secret) {
    console.log("[resolvePI] Found client_secret from refreshed subscription");
    return { clientSecret: pi.client_secret, paymentIntentId: pi.id || null };
  }
  const again = refreshed?.latest_invoice?.payment_intent;
  console.log("[resolvePI] Refreshed PI type:", typeof again, again?.id || again);
  if (typeof again === "string") {
    console.log("[resolvePI] Final attempt - retrieving PI:", again);
    const retrieved = await stripe.paymentIntents.retrieve(again);
    if (retrieved?.client_secret) {
      return { clientSecret: retrieved.client_secret, paymentIntentId: retrieved.id };
    }
  }

  // PaymentIntent doesn't exist on invoice - create one manually for mobile payment sheet
  const invoiceData = subscription?.latest_invoice;
  const invoiceForPayment = typeof invoiceData === "object" ? invoiceData : null;
  
  if (invoiceForPayment && invoiceForPayment.amount_due > 0 && invoiceForPayment.status === "open") {
    console.log("[resolvePI] Creating PaymentIntent manually for invoice", invoiceForPayment.id);
    try {
      const newPI = await stripe.paymentIntents.create({
        amount: invoiceForPayment.amount_due,
        currency: invoiceForPayment.currency,
        customer: typeof invoiceForPayment.customer === "string" ? invoiceForPayment.customer : invoiceForPayment.customer?.id,
        metadata: {
          invoice_id: invoiceForPayment.id,
          subscription_id: subscription.id,
          created_by: "mobile_payment_sheet_fallback",
        },
        automatic_payment_methods: {
          enabled: true,
          allow_redirects: "never",
        },
      });
      console.log("[resolvePI] Manually created PaymentIntent", newPI.id, "status:", newPI.status);
      
      // Attach the PaymentIntent to the invoice
      await stripe.invoices.update(invoiceForPayment.id, {
        default_payment_method: null, // Will be set after payment
        metadata: {
          ...invoiceForPayment.metadata,
          manual_payment_intent_id: newPI.id,
        },
      });
      
      if (newPI.client_secret) {
        return { clientSecret: newPI.client_secret, paymentIntentId: newPI.id };
      }
    } catch (createErr) {
      console.error("[resolvePI] Failed to create manual PaymentIntent:", createErr?.message);
    }
  }

  console.warn("[resolvePI] FAILED to resolve client_secret");
  return { clientSecret: null, paymentIntentId: null };
}

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

    const metadata = {
      uid,
      flow: PREMIUM_FLOW_METADATA,
      platform: "expo",
      checkoutSurface: "payment_sheet",
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

    // Use SetupIntent approach: collect payment method first, then create subscription
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ["card"],
      usage: "off_session",
      metadata: {
        ...metadata,
        pending_subscription: "true",
        price_id: priceId,
      },
    });

    console.log("[premium.mobile.payment_sheet] SetupIntent created", {
      setupIntentId: setupIntent.id,
      status: setupIntent.status,
      hasClientSecret: !!setupIntent.client_secret,
    });

    // Store pending subscription data - will create actual subscription after setup completes
    await db
      .collection(PREMIUM_MOBILE_SESSION_COLLECTION)
      .doc(setupIntent.id)
      .set(
        {
          uid,
          stripeCustomerId: customerId,
          stripeSetupIntentId: setupIntent.id,
          pendingPriceId: priceId,
          pendingMetadata: metadata,
          status: "pending_setup",
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
          paymentSheetPendingSetupIntentId: setupIntent.id,
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

    // Return SetupIntent client secret - subscription will be created after setup succeeds
    return res.status(200).json({
      setupIntentClientSecret: setupIntent.client_secret,
      customerEphemeralKeySecret: ephemeralKey.secret,
      customerId,
      setupIntentId: setupIntent.id,
    });
  } catch (err) {
    console.error("[premium.mobile.payment_sheet] stripe_error", { message: err?.message });
    return res.status(500).json({ error: "Could not start premium payment" });
  }
}
