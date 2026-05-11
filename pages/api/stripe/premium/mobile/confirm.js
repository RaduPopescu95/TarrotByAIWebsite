import Stripe from "stripe";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "../../../../../lib/firebaseAdmin";
import { requireAuth } from "../../../../../lib/requireAuth";
import { PREMIUM_FLOW_METADATA, hasPremiumAccess } from "../../../../../lib/premiumAccess";
import { syncPremiumSubscription } from "../../../../../lib/stripePremiumSubscriptionSync";
import { resolvePremiumStripePriceId } from "../../../../../lib/stripePremiumEnv";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2026-02-25.clover",
});
const PREMIUM_MOBILE_SESSION_COLLECTION = "premiumMobilePaymentSheets";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  let authUser;
  try {
    authUser = await requireAuth(req);
  } catch (err) {
    const code = err.statusCode || 401;
    return res.status(code).json({ error: err.message || "Unauthorized" });
  }

  const setupIntentId =
    typeof req.body?.setupIntentId === "string" ? req.body.setupIntentId.trim() : "";
  
  // Also support legacy subscriptionId for backwards compatibility
  const legacySubscriptionId =
    typeof req.body?.subscriptionId === "string" ? req.body.subscriptionId.trim() : "";

  const db = getAdminDb();

  // New flow: SetupIntent based
  if (setupIntentId) {
    try {
      console.log("[premium.mobile.confirm] Processing SetupIntent", { setupIntentId });
      
      // Retrieve the SetupIntent
      const setupIntent = await stripe.setupIntents.retrieve(setupIntentId);
      
      if (setupIntent.status !== "succeeded") {
        console.warn("[premium.mobile.confirm] SetupIntent not succeeded", { 
          status: setupIntent.status 
        });
        return res.status(400).json({ 
          error: "Payment setup not complete",
          setupIntentStatus: setupIntent.status,
        });
      }

      // Verify ownership via metadata
      if (setupIntent.metadata?.uid !== authUser.uid) {
        return res.status(403).json({ error: "Forbidden" });
      }

      const paymentMethodId = setupIntent.payment_method;
      if (!paymentMethodId) {
        return res.status(400).json({ error: "No payment method on SetupIntent" });
      }

      // Get the stored session data
      const sessionSnap = await db.collection(PREMIUM_MOBILE_SESSION_COLLECTION).doc(setupIntentId).get();
      const sessionData = sessionSnap.exists ? sessionSnap.data() : null;

      if (!sessionData) {
        return res.status(404).json({ error: "Session not found" });
      }

      const customerId = sessionData.stripeCustomerId;
      const priceId = sessionData.pendingPriceId || resolvePremiumStripePriceId();
      const metadata = sessionData.pendingMetadata || { uid: authUser.uid, flow: PREMIUM_FLOW_METADATA };

      // Set the payment method as customer's default
      await stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: typeof paymentMethodId === "string" ? paymentMethodId : paymentMethodId.id,
        },
      });

      console.log("[premium.mobile.confirm] Creating subscription with payment method", {
        customerId,
        priceId,
        paymentMethodId,
      });

      // Create the subscription - it should charge immediately with the default payment method
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId, quantity: 1 }],
        metadata,
        default_payment_method: typeof paymentMethodId === "string" ? paymentMethodId : paymentMethodId.id,
        expand: ["latest_invoice.payment_intent"],
      });

      console.log("[premium.mobile.confirm] Subscription created", {
        subscriptionId: subscription.id,
        status: subscription.status,
      });

      // Sync and update Firestore
      const syncResult = await syncPremiumSubscription(subscription);

      await db.collection(PREMIUM_MOBILE_SESSION_COLLECTION).doc(setupIntentId).set(
        {
          stripeSubscriptionId: subscription.id,
          status: subscription.status,
          confirmedAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      let premiumActive = syncResult.premiumActive === true;
      try {
        const userSnap = await db.collection("Users").doc(authUser.uid).get();
        const userData = userSnap.exists ? userSnap.data() || null : null;
        premiumActive = hasPremiumAccess(userData);
      } catch (_) {}

      return res.status(200).json({
        subscriptionId: subscription.id,
        subscriptionStatus: syncResult.subscriptionStatus || subscription.status || null,
        premiumActive,
      });
    } catch (err) {
      console.error("[premium.mobile.confirm] SetupIntent flow failed", {
        setupIntentId,
        message: err?.message,
      });
      return res.status(500).json({ error: "Could not create subscription" });
    }
  }

  // Legacy flow: subscriptionId based (for old sessions)
  if (legacySubscriptionId) {
    try {
      let subscription = await stripe.subscriptions.retrieve(legacySubscriptionId, {
        expand: ["latest_invoice.payment_intent", "latest_invoice"],
      });

      if (subscription.metadata?.flow !== PREMIUM_FLOW_METADATA) {
        return res.status(404).json({ error: "Subscription not found" });
      }
      if (subscription.metadata?.uid !== authUser.uid) {
        return res.status(403).json({ error: "Forbidden" });
      }

      const syncResult = await syncPremiumSubscription(subscription);

      await db
        .collection(PREMIUM_MOBILE_SESSION_COLLECTION)
        .doc(subscription.id)
        .set(
          {
            status: subscription.status || "unknown",
            confirmedAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );

      let premiumActive = syncResult.premiumActive === true;
      try {
        const userSnap = await db.collection("Users").doc(authUser.uid).get();
        const userData = userSnap.exists ? userSnap.data() || null : null;
        premiumActive = hasPremiumAccess(userData);
      } catch (_) {}

      return res.status(200).json({
        subscriptionId: subscription.id,
        subscriptionStatus: syncResult.subscriptionStatus || subscription.status || null,
        premiumActive,
      });
    } catch (err) {
      console.error("[premium.mobile.confirm] legacy flow failed", {
        subscriptionId: legacySubscriptionId,
        message: err?.message,
      });
      return res.status(500).json({ error: "Could not confirm subscription" });
    }
  }

  return res.status(400).json({ error: "Missing setupIntentId or subscriptionId" });
}
