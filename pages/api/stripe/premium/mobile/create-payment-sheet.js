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

    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId, quantity: 1 }],
      metadata,
      payment_behavior: "default_incomplete",
      payment_settings: {
        payment_method_types: ["card"],
        save_default_payment_method: "on_subscription",
      },
      expand: ["latest_invoice.payment_intent"],
    });

    console.log("[premium.mobile.payment_sheet] Subscription created", {
      subscriptionId: subscription.id,
      status: subscription.status,
      latestInvoiceType: typeof subscription.latest_invoice,
      latestInvoiceId: typeof subscription.latest_invoice === "object" ? subscription.latest_invoice?.id : subscription.latest_invoice,
      paymentIntentType: typeof subscription.latest_invoice?.payment_intent,
      paymentIntentId: typeof subscription.latest_invoice?.payment_intent === "object" 
        ? subscription.latest_invoice?.payment_intent?.id 
        : subscription.latest_invoice?.payment_intent,
      hasClientSecret: !!subscription.latest_invoice?.payment_intent?.client_secret,
    });

    const { clientSecret, paymentIntentId } = await resolvePaymentIntentClientSecret(
      stripe,
      subscription
    );

    await db
      .collection(PREMIUM_MOBILE_SESSION_COLLECTION)
      .doc(subscription.id)
      .set(
        {
          uid,
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscription.id,
          stripePaymentIntentId: paymentIntentId,
          status: subscription.status || "unknown",
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
          paymentSheetPendingSubscriptionId: subscription.id,
          updatedAt: FieldValue.serverTimestamp(),
        },
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    if (!clientSecret) {
      console.warn("[premium.mobile.payment_sheet] missing_payment_intent_client_secret", {
        subscriptionId: subscription.id,
        latestInvoice: subscription.latest_invoice,
        status: subscription.status,
      });
      const syncResult = await syncPremiumSubscription(subscription);
      return res.status(200).json({
        subscriptionId: subscription.id,
        customerId,
        premiumActive: syncResult.premiumActive === true,
        subscriptionStatus: syncResult.subscriptionStatus || subscription.status || null,
      });
    }

    const ephemeralKey = await stripe.ephemeralKeys.create(
      { customer: customerId },
      { apiVersion: STRIPE_API_VERSION }
    );

    return res.status(200).json({
      paymentIntentClientSecret: clientSecret,
      customerEphemeralKeySecret: ephemeralKey.secret,
      customerId,
      subscriptionId: subscription.id,
    });
  } catch (err) {
    console.error("[premium.mobile.payment_sheet] stripe_error", { message: err?.message });
    return res.status(500).json({ error: "Could not start premium payment" });
  }
}
