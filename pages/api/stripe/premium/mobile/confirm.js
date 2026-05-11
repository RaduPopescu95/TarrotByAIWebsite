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
    let subscription = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ["latest_invoice.payment_intent", "latest_invoice"],
    });

    if (subscription.metadata?.flow !== PREMIUM_FLOW_METADATA) {
      return res.status(404).json({ error: "Subscription not found" });
    }
    if (subscription.metadata?.uid !== authUser.uid) {
      return res.status(403).json({ error: "Forbidden" });
    }

    // If subscription is incomplete and invoice is open, try to pay it with manual PaymentIntent
    const invoice = subscription.latest_invoice;
    if (
      subscription.status === "incomplete" &&
      invoice &&
      typeof invoice === "object" &&
      invoice.status === "open"
    ) {
      const manualPiId = invoice.metadata?.manual_payment_intent_id;
      if (manualPiId) {
        console.log("[premium.mobile.confirm] Found manual PI, attempting to pay invoice", {
          subscriptionId,
          invoiceId: invoice.id,
          manualPiId,
        });
        try {
          // Retrieve the PaymentIntent to get the payment method
          const pi = await stripe.paymentIntents.retrieve(manualPiId);
          if (pi.status === "succeeded" && pi.payment_method) {
            console.log("[premium.mobile.confirm] Manual PI succeeded, paying invoice with PM", pi.payment_method);
            // Pay the invoice with the payment method from the succeeded PaymentIntent
            await stripe.invoices.pay(invoice.id, {
              payment_method: typeof pi.payment_method === "string" ? pi.payment_method : pi.payment_method.id,
            });
            // Refresh subscription after payment
            subscription = await stripe.subscriptions.retrieve(subscriptionId, {
              expand: ["latest_invoice.payment_intent", "latest_invoice"],
            });
            console.log("[premium.mobile.confirm] Invoice paid, new subscription status:", subscription.status);
          } else {
            console.log("[premium.mobile.confirm] Manual PI not yet succeeded", { status: pi.status });
          }
        } catch (payErr) {
          console.warn("[premium.mobile.confirm] Failed to pay invoice with manual PI", payErr?.message);
        }
      } else {
        // Check if there's a stripePaymentIntentId in our Firestore record
        const db2 = getAdminDb();
        const sessionSnap = await db2.collection(PREMIUM_MOBILE_SESSION_COLLECTION).doc(subscriptionId).get();
        const sessionData = sessionSnap.exists ? sessionSnap.data() : null;
        const storedPiId = sessionData?.stripePaymentIntentId;
        if (storedPiId) {
          console.log("[premium.mobile.confirm] Found stored PI in Firestore", storedPiId);
          try {
            const pi = await stripe.paymentIntents.retrieve(storedPiId);
            if (pi.status === "succeeded" && pi.payment_method) {
              console.log("[premium.mobile.confirm] Stored PI succeeded, paying invoice with PM", pi.payment_method);
              await stripe.invoices.pay(invoice.id, {
                payment_method: typeof pi.payment_method === "string" ? pi.payment_method : pi.payment_method.id,
              });
              subscription = await stripe.subscriptions.retrieve(subscriptionId, {
                expand: ["latest_invoice.payment_intent", "latest_invoice"],
              });
              console.log("[premium.mobile.confirm] Invoice paid via stored PI, new status:", subscription.status);
            }
          } catch (payErr2) {
            console.warn("[premium.mobile.confirm] Failed to pay invoice with stored PI", payErr2?.message);
          }
        }
      }
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
