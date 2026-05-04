import Stripe from "stripe";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "../../../../../lib/firebaseAdmin";
import { requireAuth } from "../../../../../lib/requireAuth";
import { PREMIUM_FLOW_METADATA, hasPremiumAccess } from "../../../../../lib/premiumAccess";
import { syncPremiumSubscription } from "../../../../../lib/stripePremiumSubscriptionSync";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2026-02-25.clover",
});
const PREMIUM_MOBILE_SESSION_COLLECTION = "premiumMobilePaymentSheets";

function getPaymentIntentStatus(subscription) {
  const invoice = subscription?.latest_invoice;
  const paymentIntent = invoice?.payment_intent;
  if (paymentIntent && typeof paymentIntent === "object") {
    return paymentIntent.status || null;
  }
  return null;
}

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

  const subscriptionId =
    typeof req.body?.subscriptionId === "string" ? req.body.subscriptionId.trim() : "";
  if (!subscriptionId) {
    return res.status(400).json({ error: "Missing subscriptionId" });
  }

  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ["latest_invoice.payment_intent"],
    });

    if (subscription.metadata?.flow !== PREMIUM_FLOW_METADATA) {
      return res.status(404).json({ error: "Subscription not found" });
    }
    if (subscription.metadata?.uid !== authUser.uid) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const syncResult = await syncPremiumSubscription(subscription);
    const db = getAdminDb();
    await db
      .collection(PREMIUM_MOBILE_SESSION_COLLECTION)
      .doc(subscription.id)
      .set(
        {
          status: subscription.status || "unknown",
          paymentIntentStatus: getPaymentIntentStatus(subscription),
          confirmedAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

    let premiumActive = syncResult.premiumActive === true;
    let userData = null;
    try {
      const userSnap = await db.collection("Users").doc(authUser.uid).get();
      userData = userSnap.exists ? userSnap.data() || null : null;
      premiumActive = hasPremiumAccess(userData);
    } catch (_) {}

    return res.status(200).json({
      subscriptionId: subscription.id,
      subscriptionStatus:
        syncResult.subscriptionStatus || userData?.subscriptionStatus || subscription.status || null,
      paymentIntentStatus: getPaymentIntentStatus(subscription),
      premiumActive,
    });
  } catch (err) {
    console.error("[premium.mobile.confirm] failed", {
      subscriptionId,
      message: err?.message,
    });
    return res.status(500).json({ error: "Could not confirm premium subscription" });
  }
}
