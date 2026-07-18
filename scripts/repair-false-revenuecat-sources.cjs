#!/usr/bin/env node
/* eslint-disable no-console */
const admin = require("firebase-admin");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(process.cwd(), ".env.local") });
dotenv.config({ path: path.join(process.cwd(), ".env") });

const apply = process.argv.includes("--apply");
const requestedUidArg = process.argv.find((arg) => arg.startsWith("--uid="));
const requestedUid = requestedUidArg ? requestedUidArg.slice("--uid=".length).trim() : "";

function initAdmin() {
  if (admin.apps.length) return;
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("Missing Firebase Admin environment variables");
  }
  admin.initializeApp({
    credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
  });
}

function clean(value) {
  return typeof value === "string" ? value.trim() : "";
}

function toMillis(value) {
  if (value == null) return null;
  if (typeof value === "number") return value > 1e12 ? value : value * 1000;
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  if (typeof value?.toMillis === "function") return value.toMillis();
  if (typeof value?.seconds === "number") return value.seconds * 1000;
  return null;
}

function hasLocalPurchaseEvidence(data) {
  const source = data?.premiumSources?.revenuecat || {};
  return Boolean(
    clean(source.productId) ||
      clean(source.originalTransactionId) ||
      toMillis(source.expiresAt || source.currentPeriodEnd) != null ||
      clean(data?.revenueCatProductId) ||
      clean(data?.revenueCatOriginalTransactionId) ||
      toMillis(data?.revenueCatCurrentPeriodEnd) != null
  );
}

function normalizeProductId(value) {
  const raw = clean(value);
  return raw.includes(":") ? raw.split(":")[0] : raw;
}

function parseRevenueCatDate(value) {
  if (typeof value !== "string" || !value.trim()) return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

async function fetchRevenueCatPremiumState(uid) {
  const apiKey = clean(process.env.REVENUECAT_SECRET_API_KEY);
  if (!apiKey) throw new Error("Missing REVENUECAT_SECRET_API_KEY");
  const response = await fetch(
    `https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(uid)}`,
    { headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" } }
  );
  if (!response.ok) {
    throw new Error(`RevenueCat verification failed (${response.status})`);
  }
  const subscriber = (await response.json())?.subscriber || {};
  const entitlementId = clean(process.env.REVENUECAT_PREMIUM_ENTITLEMENT_ID) || "premium";
  const entitlement = subscriber?.entitlements?.[entitlementId] || null;
  const configuredProduct = normalizeProductId(process.env.REVENUECAT_PREMIUM_PRODUCT_ID);
  const entitlementProduct = normalizeProductId(entitlement?.product_identifier);
  const subscriptionMatch = Object.entries(subscriber?.subscriptions || {})
    .filter(([productId]) => {
      const normalized = normalizeProductId(productId);
      return Boolean(
        normalized &&
          (normalized === entitlementProduct || normalized === configuredProduct)
      );
    })
    .map(([productId, subscription]) => ({
      productId: normalizeProductId(productId),
      subscription: subscription || {},
      expiresMs: parseRevenueCatDate(subscription?.expires_date),
    }))
    .sort((left, right) => (right.expiresMs || 0) - (left.expiresMs || 0))[0] || null;
  const expiresMs =
    parseRevenueCatDate(entitlement?.expires_date) ?? subscriptionMatch?.expiresMs ?? null;
  const hasHistory = Boolean(entitlement || subscriptionMatch);
  const active = Boolean(hasHistory && (expiresMs == null || expiresMs > Date.now()));
  const cancelAtPeriodEnd =
    active && Boolean(subscriptionMatch?.subscription?.unsubscribe_detected_at);
  const billingIssue = Boolean(subscriptionMatch?.subscription?.billing_issues_detected_at);
  return {
    hasHistory,
    active,
    expiresMs,
    productId: entitlementProduct || subscriptionMatch?.productId || null,
    cancelAtPeriodEnd,
    status: !hasHistory
      ? "no_purchase"
      : active
        ? billingIssue
          ? "past_due"
          : "active"
        : "expired",
  };
}

function isSourceActive(source, nowMs = Date.now()) {
  if (!source || source.active !== true) return false;
  const expiresMs = toMillis(source.expiresAt || source.currentPeriodEnd);
  return expiresMs == null || expiresMs > nowMs;
}

function cleanupPatch(data) {
  const premiumSources = { ...(data?.premiumSources || {}) };
  delete premiumSources.revenuecat;
  const activePremiumProviders = ["stripe", "manual"]
    .filter((provider) => isSourceActive(premiumSources[provider]))
    .sort();
  return {
    premiumSources,
    premium: activePremiumProviders.length > 0,
    activePremiumProviders,
    subscriptionProvider:
      activePremiumProviders.length === 1
        ? activePremiumProviders[0]
        : activePremiumProviders.length > 1
          ? "multiple"
          : null,
    revenueCatSubscriptionStatus: admin.firestore.FieldValue.delete(),
    revenueCatCurrentPeriodEnd: admin.firestore.FieldValue.delete(),
    revenueCatProductId: admin.firestore.FieldValue.delete(),
    revenueCatOriginalTransactionId: admin.firestore.FieldValue.delete(),
    revenueCatCancelAtPeriodEnd: admin.firestore.FieldValue.delete(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };
}

function reconciliationPatch(data, state) {
  const expiresAt = Number.isFinite(state.expiresMs)
    ? admin.firestore.Timestamp.fromMillis(state.expiresMs)
    : null;
  const premiumSources = {
    ...(data?.premiumSources || {}),
    revenuecat: {
      ...(data?.premiumSources?.revenuecat || {}),
      active: state.active,
      status: state.status,
      expiresAt,
      productId: state.productId,
      cancelAtPeriodEnd: state.cancelAtPeriodEnd,
      willRenew: state.active ? !state.cancelAtPeriodEnd : false,
      verificationStatus: "verified",
      lastVerifiedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
  };
  const activePremiumProviders = ["stripe", "revenuecat", "manual"]
    .filter((provider) => isSourceActive(premiumSources[provider]))
    .sort();
  return {
    premiumSources,
    premium: activePremiumProviders.length > 0,
    activePremiumProviders,
    subscriptionProvider:
      activePremiumProviders.length === 1
        ? activePremiumProviders[0]
        : activePremiumProviders.length > 1
          ? "multiple"
          : null,
    revenueCatSubscriptionStatus: state.status,
    revenueCatCurrentPeriodEnd: expiresAt,
    revenueCatProductId: state.productId,
    revenueCatCancelAtPeriodEnd: state.cancelAtPeriodEnd,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };
}

async function loadCandidates(db) {
  if (requestedUid) {
    const snap = await db.collection("Users").doc(requestedUid).get();
    return snap.exists ? [snap] : [];
  }
  const queries = [
    db.collection("Users").where("revenueCatSubscriptionStatus", "==", "expired"),
    db.collection("Users").where("subscriptionProvider", "==", "revenuecat"),
  ];
  const snapshots = await Promise.all(queries.map((query) => query.get()));
  const byId = new Map();
  snapshots.forEach((snapshot) =>
    snapshot.docs.forEach((docSnap) => byId.set(docSnap.id, docSnap))
  );
  return [...byId.values()];
}

async function main() {
  initAdmin();
  const db = admin.firestore();
  const candidates = await loadCandidates(db);
  const repairs = [];
  const reconciliations = [];
  const preserved = [];

  for (const docSnap of candidates) {
    const data = docSnap.data() || {};
    if (!data?.premiumSources?.revenuecat && !hasLocalPurchaseEvidence(data)) {
      preserved.push({ uid: docSnap.id, reason: "no_revenuecat_source" });
      continue;
    }
    const verifiedState = await fetchRevenueCatPremiumState(docSnap.id);
    if (verifiedState.hasHistory) {
      reconciliations.push({ ref: docSnap.ref, uid: docSnap.id, data, verifiedState });
      continue;
    }
    if (hasLocalPurchaseEvidence(data)) {
      preserved.push({ uid: docSnap.id, reason: "local_purchase_evidence" });
      continue;
    }
    repairs.push({ ref: docSnap.ref, uid: docSnap.id, data });
  }

  console.log("[repair-false-revenuecat-sources] summary", {
    mode: apply ? "apply" : "dry-run",
    scanned: candidates.length,
    repairable: repairs.length,
    reconcilable: reconciliations.length,
    preserved: preserved.length,
  });
  repairs.forEach(({ uid }) =>
    console.log("[repair-false-revenuecat-sources] candidate", { uid })
  );
  reconciliations.forEach(({ uid, verifiedState }) =>
    console.log("[repair-false-revenuecat-sources] reconcile", {
      uid,
      status: verifiedState.cancelAtPeriodEnd
        ? "cancel_at_period_end"
        : verifiedState.status,
      active: verifiedState.active,
    })
  );

  if (!apply) return;
  for (const repair of repairs) {
    await repair.ref.set(cleanupPatch(repair.data), { merge: true });
    console.log("[repair-false-revenuecat-sources] repaired", { uid: repair.uid });
  }
  for (const item of reconciliations) {
    await item.ref.set(reconciliationPatch(item.data, item.verifiedState), { merge: true });
    console.log("[repair-false-revenuecat-sources] reconciled", { uid: item.uid });
  }
}

main().catch((error) => {
  console.error("[repair-false-revenuecat-sources] failed", error?.message || error);
  process.exitCode = 1;
});
