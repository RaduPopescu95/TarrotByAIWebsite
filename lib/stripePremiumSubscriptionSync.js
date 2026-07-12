import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { getAdminDb } from "./firebaseAdmin";
import {
  PREMIUM_FLOW_METADATA,
  computePremiumBoolean,
  isManualPremiumProtected,
  mapStripeSubscriptionStatus,
} from "./premiumAccess";
import {
  buildUserIdentityPatch,
  resolveAuthIdentitySources,
} from "./userIdentitySync";
import { buildPremiumSourcePatch } from "./premiumSources";

export function getStripeCustomerIdFromSubscription(subscription) {
  const customer = subscription?.customer;
  if (typeof customer === "string") return customer;
  if (customer && typeof customer.id === "string") return customer.id;
  return null;
}

export function buildUserPremiumPayload(subscription) {
  const appStatus = mapStripeSubscriptionStatus(subscription.status);
  let endSec =
    typeof subscription.current_period_end === "number"
      ? subscription.current_period_end
      : null;
  const endedSec =
    typeof subscription.ended_at === "number" ? subscription.ended_at : null;

  if (appStatus === "canceled" && endedSec != null) {
    endSec = endSec == null ? endedSec : Math.min(endSec, endedSec);
  }

  const currentPeriodEnd =
    typeof endSec === "number" ? Timestamp.fromMillis(endSec * 1000) : null;
  const stripeCustomerId = getStripeCustomerIdFromSubscription(subscription);
  const fields = {
    subscriptionStatus: appStatus,
    stripeSubscriptionId: subscription.id,
    subscriptionProvider: "stripe",
    premiumSubscriptionCancelAtPeriodEnd:
      subscription.cancel_at_period_end === true,
    updatedAt: FieldValue.serverTimestamp(),
  };

  if (currentPeriodEnd) {
    fields.currentPeriodEnd = currentPeriodEnd;
  }
  if (stripeCustomerId) {
    fields.stripeCustomerId = stripeCustomerId;
  }

  fields.premium = computePremiumBoolean({
    subscriptionStatus: appStatus,
    currentPeriodEnd: currentPeriodEnd || undefined,
    subscriptionProvider: "stripe",
  });

  return fields;
}

export async function writePremiumToUser(uid, payload) {
  const db = getAdminDb();
  const userSnap = await db.collection("Users").doc(uid).get();
  const existing = userSnap.exists ? userSnap.data() || {} : {};
  const authIdentity = await resolveAuthIdentitySources(uid);
  const { patch: identityPatch } = buildUserIdentityPatch(existing, {
    uid,
    authEmail: authIdentity.email,
    displayName: authIdentity.displayName,
  });
  await db.collection("Users").doc(uid).set({ ...identityPatch, ...payload }, { merge: true });
}

export async function syncPremiumSubscription(subscription) {
  console.log("[syncPremiumSubscription] Starting sync", {
    subscriptionId: subscription?.id,
    metadataFlow: subscription?.metadata?.flow,
    metadataUid: subscription?.metadata?.uid,
    expectedFlow: PREMIUM_FLOW_METADATA,
  });
  
  if (!subscription?.metadata || subscription.metadata.flow !== PREMIUM_FLOW_METADATA) {
    console.log("[syncPremiumSubscription] Skipping - not site_premium flow", {
      actualFlow: subscription?.metadata?.flow,
    });
    return { skipped: true, reason: "not_site_premium" };
  }

  const uid = subscription.metadata.uid;
  if (!uid || typeof uid !== "string") {
    console.log("[syncPremiumSubscription] Skipping - missing uid");
    return { skipped: true, reason: "missing_uid" };
  }

  const db = getAdminDb();
  const userSnap = await db.collection("Users").doc(uid).get();
  const userData = userSnap.exists ? userSnap.data() || null : null;
  if (isManualPremiumProtected(userData)) {
    console.info("[syncPremiumSubscription] Skipping - manual premium active", { uid });
    return { skipped: true, reason: "manual_premium_active", uid };
  }

  const stripePayload = buildUserPremiumPayload(subscription);
  const payload = {
    ...stripePayload,
    ...buildPremiumSourcePatch(userData, "stripe", {
      active: stripePayload.premium === true,
      status: stripePayload.subscriptionStatus,
      expiresAt: stripePayload.currentPeriodEnd || null,
      subscriptionId: stripePayload.stripeSubscriptionId,
      updatedAt: FieldValue.serverTimestamp(),
    }),
  };
  console.log("[syncPremiumSubscription] Built payload", {
    uid,
    subscriptionStatus: payload.subscriptionStatus,
    premium: payload.premium,
    stripeSubscriptionId: payload.stripeSubscriptionId,
    currentPeriodEnd: payload.currentPeriodEnd,
  });
  
  await writePremiumToUser(uid, payload);
  console.log("[syncPremiumSubscription] Wrote to user", { uid });
  
  return {
    skipped: false,
    uid,
    payload,
    premiumActive: payload.premium === true,
    subscriptionStatus: payload.subscriptionStatus,
  };
}

export async function syncPremiumSubscriptionById(stripe, subscriptionId) {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  return syncPremiumSubscription(subscription);
}
