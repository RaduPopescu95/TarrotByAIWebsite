#!/usr/bin/env node
/* eslint-disable no-console */

/**
 * Reverses `migrate-premium-subscriptions-tax.cjs --schedule-cancel-unaccepted`
 * for subscribers who never answered the 5 EUR -> 6.05 EUR notice.
 *
 * Only touches subscriptions whose cancellation was scheduled by that operation
 * (`metadata.priceChangeCancelReason === "unaccepted_v1_6_05"`), so genuine
 * user-initiated cancellations are left alone. For each one it clears the
 * scheduled cancellation and records the same forced consent marker the earlier
 * ops migration used, keeping both cohorts consistent.
 *
 * Dry run:  node scripts/force-accept-premium-price-change.cjs --live
 * Apply:    node scripts/force-accept-premium-price-change.cjs --live --apply --confirm=FORCE_ACCEPT_UNACCEPTED_605
 */

const path = require("path");
const dotenv = require("dotenv");
const Stripe = require("stripe");
const admin = require("firebase-admin");

dotenv.config({ path: path.join(process.cwd(), ".env.local") });
dotenv.config({ path: path.join(process.cwd(), ".env") });

const LIVE = process.argv.includes("--live");
const APPLY = process.argv.includes("--apply");
const CONFIRMATION = "FORCE_ACCEPT_UNACCEPTED_605";
const confirmArg = process.argv.find((a) => a.startsWith("--confirm="));
const confirmation = confirmArg ? confirmArg.slice("--confirm=".length).trim() : "";

const PAYING_STATUSES = new Set(["active", "trialing", "past_due"]);
const CANCEL_REASON = "unaccepted_v1_6_05";
const CONSENT_VERSION = "v1_6_05";
const FORCED_SOURCE = "forced_ops_v1";
const OLD_TOTAL_CENTS = 500;
const NEW_TOTAL_CENTS = 605;
const EXPECTED_VAT_PERCENTAGE = 21;

function clean(value) {
  return typeof value === "string" ? value.trim() : "";
}

function initFirestore() {
  const projectId = clean(process.env.FIREBASE_PROJECT_ID);
  const clientEmail = clean(process.env.FIREBASE_CLIENT_EMAIL);
  const privateKey = clean(process.env.FIREBASE_PRIVATE_KEY).replace(/\\n/g, "\n");
  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("Missing Firebase Admin credentials");
  }
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
    });
  }
  return admin.firestore();
}

function maskId(value) {
  const v = clean(value);
  return v ? `${v.slice(0, 14)}…` : "";
}

function isoDay(sec) {
  return typeof sec === "number" ? new Date(sec * 1000).toISOString().slice(0, 10) : "";
}

/**
 * The subscription must already sit on the exclusive price with a single 21%
 * exclusive tax rate, otherwise clearing the cancellation would renew it at the
 * wrong amount.
 */
function billingBlockers(subscription, exclusivePriceId) {
  const reasons = [];
  const items = subscription?.items?.data || [];
  if (items.length !== 1) reasons.push("subscription_items_not_single");
  const price = items[0]?.price;
  if (clean(price?.id) !== clean(exclusivePriceId)) reasons.push("not_on_exclusive_price");
  if (price?.tax_behavior !== "exclusive") reasons.push("price_not_tax_exclusive");
  if (Number(price?.unit_amount) !== OLD_TOTAL_CENTS) reasons.push("price_not_500_cents");
  if (subscription?.automatic_tax?.enabled === true) reasons.push("automatic_tax_enabled");
  const rates = subscription?.default_tax_rates || [];
  if (rates.length !== 1) reasons.push(`default_tax_rates_${rates.length}`);
  else {
    const rate = rates[0];
    if (Number(rate.percentage) !== EXPECTED_VAT_PERCENTAGE) reasons.push("tax_rate_not_21");
    if (rate.inclusive === true) reasons.push("tax_rate_inclusive");
  }
  return reasons;
}

async function findUid(db, subscription) {
  const metaUid = clean(subscription?.metadata?.uid);
  if (metaUid) {
    const snap = await db.collection("Users").doc(metaUid).get();
    if (snap.exists) return { uid: metaUid, data: snap.data() || {} };
  }
  const bySub = await db
    .collection("Users")
    .where("stripeSubscriptionId", "==", subscription.id)
    .limit(2)
    .get();
  if (bySub.size === 1) return { uid: bySub.docs[0].id, data: bySub.docs[0].data() || {} };
  return { uid: null, data: null };
}

async function main() {
  const secretKey = LIVE
    ? clean(process.env.STRIPE_SECRET_KEY_LIVE)
    : clean(process.env.STRIPE_SECRET_KEY);
  if (!secretKey) throw new Error("Missing Stripe secret key");
  if (APPLY && confirmation !== CONFIRMATION) {
    throw new Error(`Apply requires --confirm=${CONFIRMATION}`);
  }

  const exclusivePriceId = clean(process.env.STRIPE_PREMIUM_PRICE_ID_EXCLUSIVE);
  if (!exclusivePriceId) throw new Error("Missing STRIPE_PREMIUM_PRICE_ID_EXCLUSIVE");

  console.log(
    `Mode: ${secretKey.startsWith("sk_live") ? "LIVE" : "TEST"} / ${APPLY ? "APPLY" : "DRY RUN"}`
  );
  console.log(`Exclusive price: ${exclusivePriceId}\n`);

  const stripe = new Stripe(secretKey);
  const db = initFirestore();

  const candidates = [];
  for await (const sub of stripe.subscriptions.list({ status: "all", limit: 100 })) {
    if (!PAYING_STATUSES.has(sub.status)) continue;
    if (sub.cancel_at_period_end !== true) continue;
    if (clean(sub.metadata?.priceChangeCancelReason) !== CANCEL_REASON) continue;
    candidates.push(sub);
  }
  console.log(`Subscriptions scheduled to cancel as ${CANCEL_REASON}: ${candidates.length}`);

  const summary = { eligible: 0, restored: 0, blocked: 0, failed: 0 };
  const blockedRows = [];

  for (const sub of candidates) {
    const reasons = billingBlockers(sub, exclusivePriceId);
    const { uid, data: userData } = await findUid(db, sub);
    if (!uid) reasons.push("user_not_found");

    if (reasons.length) {
      summary.blocked += 1;
      blockedRows.push({ subscriptionId: sub.id, uid, reasons });
      console.warn("[force-accept] blocked", { subscriptionId: maskId(sub.id), reasons });
      continue;
    }

    summary.eligible += 1;
    const renewalAt = isoDay(sub.current_period_end);

    if (!APPLY) {
      console.log("[force-accept] eligible", {
        subscriptionId: maskId(sub.id),
        uid: maskId(uid),
        renewalAt,
        platform: clean(sub.metadata?.platform) || "web",
        alreadyConsented: Boolean(userData?.premiumPriceChangeConsent?.acceptedAt),
      });
      continue;
    }

    try {
      await stripe.subscriptions.update(
        sub.id,
        {
          cancel_at_period_end: false,
          metadata: {
            ...(sub.metadata || {}),
            priceChangeCancelReason: "",
            priceChangeConsentVersion: CONSENT_VERSION,
            priceChangeConsentSource: FORCED_SOURCE,
          },
        },
        { idempotencyKey: `premium-force-accept-605-v1-${sub.id}` }
      );

      const updated = await stripe.subscriptions.retrieve(sub.id);
      if (updated.cancel_at_period_end !== false) {
        throw new Error("post_update_cancel_at_period_end_still_true");
      }
      if (billingBlockers(updated, exclusivePriceId).length) {
        throw new Error("post_update_billing_validation_failed");
      }

      await db
        .collection("Users")
        .doc(uid)
        .set(
          {
            premiumSubscriptionCancelAtPeriodEnd: false,
            premiumPriceChangeConsent: {
              version: CONSENT_VERSION,
              status: "accepted",
              source: FORCED_SOURCE,
              consentText:
                "Migrare operațională la prețul 5 EUR + TVA (6,05 EUR pentru România / TVA 21%).",
              oldTotalCents: OLD_TOTAL_CENTS,
              newTotalCents: NEW_TOTAL_CENTS,
              oldPriceId: exclusivePriceId,
              newPriceId: exclusivePriceId,
              subscriptionId: sub.id,
              renewalAt,
              uid,
              acceptedAt: admin.firestore.FieldValue.serverTimestamp(),
              noticeVersion: CONSENT_VERSION,
            },
            premiumTaxAddressGate: {
              ...(userData?.premiumTaxAddressGate || {}),
              required: false,
              readyForMigration: false,
              migrationCompleted: true,
              version: 1,
            },
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );

      summary.restored += 1;
      console.log("[force-accept] restored", {
        subscriptionId: maskId(sub.id),
        renewalAt,
      });
    } catch (error) {
      summary.failed += 1;
      console.error("[force-accept] failed", {
        subscriptionId: maskId(sub.id),
        message: clean(error?.message).slice(0, 300),
      });
    }
  }

  console.log("\nSummary:", summary);
  if (blockedRows.length) {
    console.log("Blocked:", JSON.stringify(blockedRows, null, 2));
  }
  if (summary.failed) process.exitCode = 1;
}

main().catch((err) => {
  console.error("FORCE ACCEPT FAILED:", err?.message || err);
  process.exit(1);
});
