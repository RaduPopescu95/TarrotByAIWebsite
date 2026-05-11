import Stripe from "stripe";
import { buffer } from "micro";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "../../../../lib/firebaseAdmin";
import { PREMIUM_FLOW_METADATA } from "../../../../lib/premiumAccess";
import { emitPremiumSubscriptionOblioInvoice } from "../../../../lib/premiumSubscriptionOblio";
import { resolvePremiumAbonamentWebhookSecret } from "../../../../lib/stripePremiumEnv";
import {
  buildUserPremiumPayload,
  syncPremiumSubscriptionById,
  writePremiumToUser,
} from "../../../../lib/stripePremiumSubscriptionSync";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const WEBHOOK_EVENTS_COLLECTION = "stripePremiumWebhookEvents";
const PREMIUM_CHECKOUT_SESSION_COLLECTION = "premiumCheckoutSessions";

export const config = {
  api: {
    bodyParser: false,
  },
};

async function persistPremiumBillingFromCheckoutSession(db, session) {
  if (session.mode !== "subscription") return;
  if (session.metadata?.flow !== PREMIUM_FLOW_METADATA) return;
  const uid = session.client_reference_id || session.metadata?.uid;
  if (!uid || typeof uid !== "string") return;

  const snap = await db.collection(PREMIUM_CHECKOUT_SESSION_COLLECTION).doc(session.id).get();
  if (!snap.exists) {
    console.warn("[premium.webhook] checkout_session_snapshot_missing", { sessionId: session.id, uid });
    return;
  }
  const row = snap.data() || {};

  await db.collection("Users").doc(uid).set(
    {
      premiumBillingProfile: {
        billing: row.billing || null,
        rawFormValues: row.rawFormValues ?? null,
        normalizedBeforeCheckout: row.normalizedBeforeCheckout ?? null,
        stripeMetadataSnapshot: row.stripeMetadataSnapshot || session.metadata || {},
        invoiceDecision: row.invoiceDecision ?? null,
        updatedFromCheckoutSessionId: session.id,
        updatedAt: FieldValue.serverTimestamp(),
      },
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  await db
    .collection(PREMIUM_CHECKOUT_SESSION_COLLECTION)
    .doc(session.id)
    .set(
      {
        paymentStatus: session.payment_status || "unknown",
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
}

function resolvePremiumWebhookSecret() {
  return resolvePremiumAbonamentWebhookSecret();
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end("Method Not Allowed");
  }

  const webhookSecret = resolvePremiumWebhookSecret();
  if (!webhookSecret) {
    console.error(
      "[premium.webhook] missing signing secret: set STRIPE_WEBHOOK_SECRET_ABONAMENT_TEST (dev), or STRIPE_WEBHOOK_SECRET_ABONAMENT / STRIPE_WEBHOOK_SECRET",
    );
    return res.status(500).json({ error: "Webhook not configured" });
  }

  let event;
  try {
    const buf = await buffer(req);
    const sig = req.headers["stripe-signature"];
    if (!sig) {
      return res.status(400).send("Webhook Error: Missing stripe-signature header");
    }
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
  } catch (err) {
    console.error("[premium.webhook] signature_failed", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const db = getAdminDb();
  const eventRef = db.collection(WEBHOOK_EVENTS_COLLECTION).doc(event.id);
  const existing = await eventRef.get();
  if (existing.exists) {
    return res.status(200).json({ received: true, duplicate: true });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        if (session.mode !== "subscription") break;
        if (session.metadata?.flow !== PREMIUM_FLOW_METADATA) break;
        const uid = session.client_reference_id || session.metadata?.uid;
        if (!uid) {
          console.warn("[premium.webhook] checkout missing uid");
          break;
        }
        const subId =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription?.id;
        if (!subId) {
          console.warn("[premium.webhook] checkout missing subscription id");
          break;
        }
        await syncPremiumSubscriptionById(stripe, subId);
        await persistPremiumBillingFromCheckoutSession(db, session);
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object;
        if (sub.metadata?.flow !== PREMIUM_FLOW_METADATA) break;
        const uid = sub.metadata?.uid;
        if (!uid) break;
        const payload = buildUserPremiumPayload(sub);
        await writePremiumToUser(uid, payload);
        break;
      }
      case "invoice.payment_succeeded":
      case "invoice.payment_failed": {
        const invoice = event.data.object;
        const subId = invoice.subscription;
        if (!subId || typeof subId !== "string") break;
        await syncPremiumSubscriptionById(stripe, subId);
        if (event.type === "invoice.payment_succeeded") {
          const oblioResult = await emitPremiumSubscriptionOblioInvoice({
            db,
            stripe,
            invoice,
            premiumFlowMetadata: PREMIUM_FLOW_METADATA,
          });
          if (!oblioResult.skipped && oblioResult.status === "created") {
            console.info("[premium.webhook] oblio_ok", { invoiceId: oblioResult.invoiceId });
          } else if (!oblioResult.skipped && oblioResult.status === "error") {
            console.warn("[premium.webhook] oblio_error", oblioResult);
          }
        }
        break;
      }
      case "payment_intent.succeeded": {
        const pi = event.data.object;
        
        // Handle mobile payment sheet PaymentIntent - create subscription if client didn't
        if (pi.metadata?.platform === "expo" && pi.metadata?.priceId && pi.metadata?.uid) {
          const uid = pi.metadata.uid;
          const priceId = pi.metadata.priceId;
          const paymentMethodId = pi.payment_method;
          const customerId = typeof pi.customer === "string" ? pi.customer : pi.customer?.id;
          
          console.log("[premium.webhook] Mobile PaymentIntent succeeded", { 
            piId: pi.id, 
            uid, 
            priceId,
            customerId,
            paymentMethodId: paymentMethodId ? "present" : "missing",
            metadataFlow: pi.metadata?.flow,
          });
          
          // Check if subscription was already created by the client
          const sessionRef = db.collection("premiumMobilePaymentSheets").doc(pi.id);
          const sessionSnap = await sessionRef.get();
          const sessionData = sessionSnap.exists ? sessionSnap.data() : null;
          
          console.log("[premium.webhook] Session data lookup", {
            piId: pi.id,
            sessionExists: sessionSnap.exists,
            hasSubscriptionId: Boolean(sessionData?.stripeSubscriptionId),
          });
          
          if (sessionData?.stripeSubscriptionId) {
            console.log("[premium.webhook] Subscription already created", {
              subscriptionId: sessionData.stripeSubscriptionId,
              createdBy: sessionData.createdByWebhook ? "webhook" : "client",
            });
            // Just sync to ensure user access is up to date
            try {
              await syncPremiumSubscriptionById(stripe, sessionData.stripeSubscriptionId);
              console.log("[premium.webhook] Synced existing subscription successfully");
            } catch (syncErr) {
              console.error("[premium.webhook] Failed to sync existing subscription", {
                subscriptionId: sessionData.stripeSubscriptionId,
                error: syncErr?.message,
              });
            }
            break;
          }
          
          // Client didn't create subscription - create it now (user may have closed app)
          if (!customerId) {
            console.error("[premium.webhook] Cannot create subscription - missing customerId", { piId: pi.id });
            break;
          }
          
          if (!paymentMethodId) {
            console.error("[premium.webhook] Cannot create subscription - missing paymentMethodId", { piId: pi.id });
            break;
          }
          
          try {
            // Set payment method as customer's default
            console.log("[premium.webhook] Setting default payment method", { customerId, paymentMethodId });
            await stripe.customers.update(customerId, {
              invoice_settings: {
                default_payment_method: typeof paymentMethodId === "string" ? paymentMethodId : paymentMethodId.id,
              },
            });
            
            // Get price to determine billing interval
            const price = await stripe.prices.retrieve(priceId);
            const interval = price.recurring?.interval || "month";
            const intervalCount = price.recurring?.interval_count || 1;
            
            console.log("[premium.webhook] Price retrieved", {
              priceId,
              interval,
              intervalCount,
              unitAmount: price.unit_amount,
            });
            
            // Calculate trial_end (first period already paid via PaymentIntent)
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
            
            // Create the subscription with proper flow metadata
            const subscriptionMetadata = {
              uid,
              flow: pi.metadata.flow || PREMIUM_FLOW_METADATA,
              platform: "expo",
              firstPaymentIntentId: pi.id,
              createdByWebhook: "true",
            };
            
            console.log("[premium.webhook] Creating subscription via webhook", {
              customerId,
              priceId,
              trialEnd: new Date(trialEndTimestamp * 1000).toISOString(),
              metadata: subscriptionMetadata,
            });
            
            const subscription = await stripe.subscriptions.create({
              customer: customerId,
              items: [{ price: priceId, quantity: 1 }],
              metadata: subscriptionMetadata,
              default_payment_method: typeof paymentMethodId === "string" ? paymentMethodId : paymentMethodId.id,
              trial_end: trialEndTimestamp,
            });
            
            console.log("[premium.webhook] Subscription created via webhook successfully", {
              subscriptionId: subscription.id,
              status: subscription.status,
              trialEnd: subscription.trial_end,
            });
            
            // Update session data
            await sessionRef.set({
              stripeSubscriptionId: subscription.id,
              status: subscription.status,
              createdByWebhook: true,
              confirmedAt: FieldValue.serverTimestamp(),
              updatedAt: FieldValue.serverTimestamp(),
            }, { merge: true });
            
            // Sync premium access to user document
            const syncResult = await syncPremiumSubscriptionById(stripe, subscription.id);
            console.log("[premium.webhook] Synced premium access", {
              subscriptionId: subscription.id,
              syncResult: syncResult.skipped ? "skipped" : "synced",
              premiumActive: syncResult.premiumActive,
            });
            
          } catch (subErr) {
            console.error("[premium.webhook] Failed to create subscription from webhook", {
              piId: pi.id,
              uid,
              customerId,
              priceId,
              errorMessage: subErr?.message,
              errorCode: subErr?.code,
              errorType: subErr?.type,
            });
          }
          break;
        }
        
        // Legacy: Handle manual PaymentIntents for old fallback flow
        const invoiceId = pi.metadata?.invoice_id;
        const subscriptionId = pi.metadata?.subscription_id;
        if (invoiceId && subscriptionId && pi.metadata?.created_by === "mobile_payment_sheet_fallback") {
          console.log("[premium.webhook] Manual PI succeeded, paying invoice", { invoiceId, subscriptionId, piId: pi.id });
          try {
            if (pi.payment_method) {
              const invoice = await stripe.invoices.retrieve(invoiceId);
              if (invoice.status === "open") {
                await stripe.invoices.pay(invoiceId, {
                  payment_method: typeof pi.payment_method === "string" ? pi.payment_method : pi.payment_method.id,
                });
                console.log("[premium.webhook] Invoice paid via webhook");
              }
            }
            await syncPremiumSubscriptionById(stripe, subscriptionId);
          } catch (payErr) {
            console.error("[premium.webhook] Failed to pay invoice from PI webhook", payErr?.message);
          }
        }
        break;
      }
      default:
        break;
    }

    await eventRef.set(
      {
        type: event.type,
        processedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  } catch (err) {
    console.error("[premium.webhook] handler_error", {
      type: event.type,
      message: err?.message,
    });
    return res.status(500).json({ error: "Webhook handler failed" });
  }

  return res.status(200).json({ received: true });
}
