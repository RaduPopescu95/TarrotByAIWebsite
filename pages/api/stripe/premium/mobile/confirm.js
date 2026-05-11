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

  const paymentIntentId =
    typeof req.body?.paymentIntentId === "string" ? req.body.paymentIntentId.trim() : "";
  
  // Legacy support
  const setupIntentId =
    typeof req.body?.setupIntentId === "string" ? req.body.setupIntentId.trim() : "";
  const legacySubscriptionId =
    typeof req.body?.subscriptionId === "string" ? req.body.subscriptionId.trim() : "";

  const db = getAdminDb();

  // New flow: PaymentIntent based (shows correct amount in PaymentSheet)
  if (paymentIntentId) {
    try {
      console.log("[premium.mobile.confirm] Processing PaymentIntent", { paymentIntentId, uid: authUser.uid });
      
      // Retrieve the PaymentIntent
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      console.log("[premium.mobile.confirm] PaymentIntent retrieved", {
        id: paymentIntent.id,
        status: paymentIntent.status,
        paymentMethod: paymentIntent.payment_method ? "present" : "missing",
        customer: paymentIntent.customer,
        metadataUid: paymentIntent.metadata?.uid,
        metadataFlow: paymentIntent.metadata?.flow,
        metadataPriceId: paymentIntent.metadata?.priceId,
      });
      
      if (paymentIntent.status !== "succeeded") {
        console.warn("[premium.mobile.confirm] PaymentIntent not succeeded", { 
          status: paymentIntent.status 
        });
        return res.status(400).json({ 
          error: "Payment not complete",
          paymentIntentStatus: paymentIntent.status,
        });
      }

      // Verify ownership via metadata
      if (paymentIntent.metadata?.uid !== authUser.uid) {
        console.warn("[premium.mobile.confirm] UID mismatch", {
          metadataUid: paymentIntent.metadata?.uid,
          authUid: authUser.uid,
        });
        return res.status(403).json({ error: "Forbidden" });
      }

      const paymentMethodId = paymentIntent.payment_method;
      if (!paymentMethodId) {
        console.warn("[premium.mobile.confirm] No payment method on PaymentIntent");
        return res.status(400).json({ error: "No payment method on PaymentIntent" });
      }

      // Get the stored session data
      const sessionSnap = await db.collection(PREMIUM_MOBILE_SESSION_COLLECTION).doc(paymentIntentId).get();
      let sessionData = sessionSnap.exists ? sessionSnap.data() : null;

      // Fallback: if session not found, try to reconstruct from PaymentIntent metadata
      if (!sessionData) {
        console.warn("[premium.mobile.confirm] Session not found, reconstructing from PaymentIntent metadata", {
          paymentIntentId,
          metadataPriceId: paymentIntent.metadata?.priceId,
        });
        
        const customerId = typeof paymentIntent.customer === "string" 
          ? paymentIntent.customer 
          : paymentIntent.customer?.id;
          
        if (customerId && paymentIntent.metadata?.priceId) {
          sessionData = {
            uid: authUser.uid,
            stripeCustomerId: customerId,
            stripePaymentIntentId: paymentIntentId,
            pendingPriceId: paymentIntent.metadata.priceId,
            pendingMetadata: paymentIntent.metadata,
            reconstructedFromPaymentIntent: true,
          };
        } else {
          console.error("[premium.mobile.confirm] Cannot reconstruct session - missing customerId or priceId");
          return res.status(404).json({ error: "Session not found and cannot be reconstructed" });
        }
      }

      // Check if subscription already created (idempotency)
      if (sessionData.stripeSubscriptionId) {
        console.log("[premium.mobile.confirm] Subscription already exists", {
          subscriptionId: sessionData.stripeSubscriptionId,
        });
        const existingSub = await stripe.subscriptions.retrieve(sessionData.stripeSubscriptionId);
        const syncResult = await syncPremiumSubscription(existingSub);
        
        let premiumActive = syncResult.premiumActive === true;
        try {
          const userSnap = await db.collection("Users").doc(authUser.uid).get();
          const userData = userSnap.exists ? userSnap.data() || null : null;
          premiumActive = hasPremiumAccess(userData);
        } catch (_) {}

        return res.status(200).json({
          subscriptionId: existingSub.id,
          subscriptionStatus: syncResult.subscriptionStatus || existingSub.status || null,
          premiumActive,
        });
      }

      const customerId = sessionData.stripeCustomerId;
      const priceId = sessionData.pendingPriceId || resolvePremiumStripePriceId();
      const metadata = sessionData.pendingMetadata || { uid: authUser.uid, flow: PREMIUM_FLOW_METADATA };

      // Set the payment method as customer's default for future charges
      await stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: typeof paymentMethodId === "string" ? paymentMethodId : paymentMethodId.id,
        },
      });

      // Get the price to determine the billing interval
      const price = await stripe.prices.retrieve(priceId);
      const interval = price.recurring?.interval || "month";
      const intervalCount = price.recurring?.interval_count || 1;
      
      // Calculate trial_end: payment already covers the first period
      // So subscription starts billing after that period ends
      const now = Math.floor(Date.now() / 1000);
      let trialEndTimestamp = now;
      if (interval === "month") {
        trialEndTimestamp = now + (30 * 24 * 60 * 60 * intervalCount);
      } else if (interval === "year") {
        trialEndTimestamp = now + (365 * 24 * 60 * 60 * intervalCount);
      } else if (interval === "week") {
        trialEndTimestamp = now + (7 * 24 * 60 * 60 * intervalCount);
      } else if (interval === "day") {
        trialEndTimestamp = now + (24 * 60 * 60 * intervalCount);
      }

      const subscriptionMetadata = {
        ...metadata,
        firstPaymentIntentId: paymentIntentId,
        createdBy: "confirm_api",
      };

      console.log("[premium.mobile.confirm] Creating subscription with trial (first payment via PaymentIntent)", {
        customerId,
        priceId,
        paymentMethodId: typeof paymentMethodId === "string" ? paymentMethodId : paymentMethodId?.id,
        trialEnd: new Date(trialEndTimestamp * 1000).toISOString(),
        metadata: subscriptionMetadata,
      });

      // Create the subscription with trial_end to avoid double-charging
      // The first period is already paid via PaymentIntent
      let subscription;
      try {
        subscription = await stripe.subscriptions.create({
          customer: customerId,
          items: [{ price: priceId, quantity: 1 }],
          metadata: subscriptionMetadata,
          default_payment_method: typeof paymentMethodId === "string" ? paymentMethodId : paymentMethodId.id,
          trial_end: trialEndTimestamp,
          expand: ["latest_invoice"],
        });
      } catch (subCreateErr) {
        console.error("[premium.mobile.confirm] Failed to create subscription", {
          error: subCreateErr?.message,
          code: subCreateErr?.code,
          type: subCreateErr?.type,
          customerId,
          priceId,
        });
        throw subCreateErr;
      }

      console.log("[premium.mobile.confirm] Subscription created successfully", {
        subscriptionId: subscription.id,
        status: subscription.status,
        trialEnd: subscription.trial_end,
        metadataFlow: subscription.metadata?.flow,
        metadataUid: subscription.metadata?.uid,
      });

      // Sync and update Firestore
      console.log("[premium.mobile.confirm] Syncing subscription to user", {
        subscriptionId: subscription.id,
        subscriptionMetadata: subscription.metadata,
      });
      
      const syncResult = await syncPremiumSubscription(subscription);
      
      console.log("[premium.mobile.confirm] Sync result", {
        skipped: syncResult.skipped,
        reason: syncResult.reason,
        uid: syncResult.uid,
        premiumActive: syncResult.premiumActive,
        subscriptionStatus: syncResult.subscriptionStatus,
      });

      await db.collection(PREMIUM_MOBILE_SESSION_COLLECTION).doc(paymentIntentId).set(
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
        console.log("[premium.mobile.confirm] Final premium check from user doc", {
          uid: authUser.uid,
          userDataExists: userSnap.exists,
          subscriptionStatus: userData?.subscriptionStatus,
          premium: userData?.premium,
          stripeSubscriptionId: userData?.stripeSubscriptionId,
          premiumActive,
        });
      } catch (readErr) {
        console.warn("[premium.mobile.confirm] Failed to read user doc for final check", {
          error: readErr?.message,
        });
      }

      console.log("[premium.mobile.confirm] Returning success response", {
        subscriptionId: subscription.id,
        subscriptionStatus: syncResult.subscriptionStatus || subscription.status,
        premiumActive,
      });

      return res.status(200).json({
        subscriptionId: subscription.id,
        subscriptionStatus: syncResult.subscriptionStatus || subscription.status || null,
        premiumActive,
      });
    } catch (err) {
      console.error("[premium.mobile.confirm] PaymentIntent flow failed", {
        paymentIntentId,
        errorMessage: err?.message,
        errorCode: err?.code,
        errorType: err?.type,
        stack: err?.stack?.substring(0, 500),
      });
      return res.status(500).json({ error: "Could not create subscription" });
    }
  }

  // Legacy flow: SetupIntent based
  if (setupIntentId) {
    try {
      console.log("[premium.mobile.confirm] Processing SetupIntent (legacy)", { setupIntentId });
      
      const setupIntent = await stripe.setupIntents.retrieve(setupIntentId);
      
      if (setupIntent.status !== "succeeded") {
        return res.status(400).json({ 
          error: "Payment setup not complete",
          setupIntentStatus: setupIntent.status,
        });
      }

      if (setupIntent.metadata?.uid !== authUser.uid) {
        return res.status(403).json({ error: "Forbidden" });
      }

      const paymentMethodId = setupIntent.payment_method;
      if (!paymentMethodId) {
        return res.status(400).json({ error: "No payment method on SetupIntent" });
      }

      const sessionSnap = await db.collection(PREMIUM_MOBILE_SESSION_COLLECTION).doc(setupIntentId).get();
      const sessionData = sessionSnap.exists ? sessionSnap.data() : null;

      if (!sessionData) {
        return res.status(404).json({ error: "Session not found" });
      }

      const customerId = sessionData.stripeCustomerId;
      const priceId = sessionData.pendingPriceId || resolvePremiumStripePriceId();
      const metadata = sessionData.pendingMetadata || { uid: authUser.uid, flow: PREMIUM_FLOW_METADATA };

      await stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: typeof paymentMethodId === "string" ? paymentMethodId : paymentMethodId.id,
        },
      });

      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId, quantity: 1 }],
        metadata,
        default_payment_method: typeof paymentMethodId === "string" ? paymentMethodId : paymentMethodId.id,
        expand: ["latest_invoice.payment_intent"],
      });

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

  return res.status(400).json({ error: "Missing paymentIntentId, setupIntentId, or subscriptionId" });
}
