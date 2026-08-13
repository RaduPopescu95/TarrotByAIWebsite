#!/usr/bin/env node
/* eslint-disable no-console */

/**
 * Read-only audit for "paid but not active" premium subscriptions.
 *
 * A. Every Stripe subscription vs the premium state denormalised on Users,
 *    including the ones the webhook sync would silently skip.
 * B. Stripe invoices actually paid whose covered period includes today but
 *    whose owner has no access (money in, access out).
 * C. RevenueCat / Google Play holders cross-checked against the RevenueCat API.
 * D. RevenueCat webhook events that granted nothing.
 * E. Users billed by several simultaneous subscriptions.
 *
 * Usage: node scripts/audit-premium-subscriptions.cjs [--live]
 */

const path = require("path");
const dotenv = require("dotenv");
const Stripe = require("stripe");
const admin = require("firebase-admin");

dotenv.config({ path: path.join(process.cwd(), ".env.local") });
dotenv.config({ path: path.join(process.cwd(), ".env") });

const LIVE = process.argv.includes("--live");
const PREMIUM_FLOW_METADATA = "site_premium";
const PAYING_STATUSES = new Set(["active", "trialing", "past_due"]);

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

// --- mirrors lib/premiumSources.js + lib/premiumAccess.js -----------------

function toMillis(value) {
  if (value == null) return null;
  if (typeof value === "number") return value > 1e12 ? value : value * 1000;
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  if (value instanceof Date) return value.getTime();
  if (typeof value.toMillis === "function") return value.toMillis();
  if (typeof value.seconds === "number") return value.seconds * 1000;
  return null;
}

const SOURCE_KEYS = ["stripe", "revenuecat", "manual"];

function isSourceActive(source, nowMs = Date.now()) {
  if (!source || typeof source !== "object" || source.active !== true) return false;
  const expiresAt = toMillis(source.expiresAt || source.currentPeriodEnd);
  return expiresAt == null || expiresAt > nowMs;
}

function hasActivePremiumSource(premiumSources, nowMs = Date.now()) {
  if (!premiumSources || typeof premiumSources !== "object") return false;
  return SOURCE_KEYS.some((key) => isSourceActive(premiumSources[key], nowMs));
}

function hasCanonicalPremiumSources(userData) {
  return Boolean(
    userData &&
      Object.prototype.hasOwnProperty.call(userData, "premiumSources") &&
      userData.premiumSources &&
      typeof userData.premiumSources === "object" &&
      !Array.isArray(userData.premiumSources)
  );
}

function inferLegacyPremiumSources(userData) {
  if (hasCanonicalPremiumSources(userData)) return { ...userData.premiumSources };
  const sources = {};
  const provider = String(
    userData?.subscriptionProvider || userData?.subscription_provider || ""
  )
    .trim()
    .toLowerCase();

  const stripeEvidence =
    provider === "stripe" ||
    Boolean(userData?.stripeCustomerId) ||
    Boolean(userData?.stripeSubscriptionId);
  if (stripeEvidence) {
    const stripeEnd = toMillis(userData?.currentPeriodEnd);
    const stripeStatus = userData?.subscriptionStatus || null;
    sources.stripe = {
      active:
        stripeStatus === "active" ||
        stripeStatus === "past_due" ||
        stripeStatus === "trialing" ||
        (stripeStatus === "canceled" && stripeEnd != null && stripeEnd > Date.now()),
      status: stripeStatus,
      expiresAt: userData?.currentPeriodEnd || null,
    };
  }

  const revenueCatEvidence =
    provider === "revenuecat" ||
    Boolean(userData?.revenueCatSubscriptionStatus) ||
    Boolean(userData?.revenueCatCurrentPeriodEnd) ||
    Boolean(userData?.revenueCatProductId) ||
    Boolean(userData?.revenueCatOriginalTransactionId);
  if (revenueCatEvidence) {
    const rcStatus = userData?.revenueCatSubscriptionStatus || null;
    const rcEnd = toMillis(userData?.revenueCatCurrentPeriodEnd);
    const statusAllowsAccess = ["active", "past_due", "trialing"].includes(rcStatus);
    sources.revenuecat = {
      active:
        (statusAllowsAccess ||
          (!rcStatus && provider === "revenuecat" && userData?.premium === true)) &&
        (rcEnd == null || rcEnd > Date.now()),
      status: rcStatus,
      expiresAt: userData?.revenueCatCurrentPeriodEnd || null,
    };
  }

  const manualEvidence = provider === "manual" || userData?.manualPremiumExpiresAt != null;
  if (manualEvidence) {
    const expiry = toMillis(userData?.manualPremiumExpiresAt);
    sources.manual = {
      active: userData?.premium === true && (expiry == null || expiry > Date.now()),
      status: userData?.premium === true ? "active" : "inactive",
      expiresAt: userData?.manualPremiumExpiresAt || null,
    };
  }
  return sources;
}

function hasPremiumAccess(userData) {
  if (!userData || typeof userData !== "object") return false;
  if (hasCanonicalPremiumSources(userData)) {
    return hasActivePremiumSource(userData.premiumSources);
  }
  const inferredSources = inferLegacyPremiumSources(userData);
  if (Object.keys(inferredSources).length > 0) {
    return hasActivePremiumSource(inferredSources);
  }
  const provider = userData.subscriptionProvider;
  if (provider && provider !== "stripe") {
    const manualEnd = toMillis(userData.manualPremiumExpiresAt);
    if (manualEnd != null && Date.now() >= manualEnd) return false;
    return userData.premium === true;
  }
  const status = userData.subscriptionStatus;
  const endMs = toMillis(userData.currentPeriodEnd);
  const now = Date.now();
  if (status === "active" || status === "past_due") {
    if (endMs != null && now >= endMs) return false;
    return true;
  }
  if (status === "canceled") return endMs != null && now < endMs;
  if (status === "unpaid" || status === "expired") return false;
  return userData.premium === true;
}

// -------------------------------------------------------------------------

function isoDay(sec) {
  return typeof sec === "number" ? new Date(sec * 1000).toISOString().slice(0, 10) : null;
}

async function listAllSubscriptions(stripe) {
  const subs = [];
  for await (const sub of stripe.subscriptions.list({
    status: "all",
    limit: 100,
    expand: ["data.customer"],
  })) {
    subs.push(sub);
  }
  return subs;
}

async function sectionSubscriptionsVsAccess(stripe, db, subs, userCache) {
  console.log("\n########## A. STRIPE SUBSCRIPTIONS vs ACCESS ##########");
  console.log(`Stripe subscriptions: ${subs.length}`);

  const customerIdsNeedingLookup = new Set();
  for (const sub of subs) {
    if (!clean(sub.metadata?.uid)) {
      const cid = typeof sub.customer === "string" ? sub.customer : sub.customer?.id;
      if (cid) customerIdsNeedingLookup.add(cid);
    }
  }
  const customerToUid = new Map();
  for (const cid of customerIdsNeedingLookup) {
    const snap = await db
      .collection("Users")
      .where("stripeCustomerId", "==", cid)
      .limit(1)
      .get();
    if (!snap.empty) customerToUid.set(cid, snap.docs[0].id);
  }

  const rows = [];
  for (const sub of subs) {
    const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer?.id;
    const customerObj = typeof sub.customer === "object" ? sub.customer : null;
    const flow = clean(sub.metadata?.flow);
    let uid = clean(sub.metadata?.uid);
    let uidSource = uid ? "subscription.metadata" : null;
    if (!uid && customerObj?.metadata?.uid) {
      uid = clean(customerObj.metadata.uid);
      uidSource = "customer.metadata";
    }
    if (!uid && customerId && customerToUid.has(customerId)) {
      uid = customerToUid.get(customerId);
      uidSource = "firestore.stripeCustomerId";
    }

    let userData = null;
    if (uid) {
      if (!userCache.has(uid)) {
        const snap = await db.collection("Users").doc(uid).get();
        userCache.set(uid, snap.exists ? snap.data() : null);
      }
      userData = userCache.get(uid);
    }

    rows.push({
      subId: sub.id,
      status: sub.status,
      paying: PAYING_STATUSES.has(sub.status),
      flow: flow || "(none)",
      uid: uid || "(unresolved)",
      uidSource: uidSource || "(none)",
      email: customerObj?.email || null,
      currentPeriodEnd: isoDay(sub.current_period_end),
      fsStatus: userData?.subscriptionStatus ?? null,
      fsPremium: userData?.premium ?? null,
      access: userData ? hasPremiumAccess(userData) : false,
      wouldSkipSync: flow !== PREMIUM_FLOW_METADATA || !clean(sub.metadata?.uid),
    });
  }

  const paying = rows.filter((r) => r.paying);
  const broken = paying.filter((r) => !r.access);
  const skipRisk = paying.filter((r) => r.wouldSkipSync);

  console.log(`Paying subscriptions (active/trialing/past_due): ${paying.length}`);
  console.log(`  -> WITHOUT premium access in Firestore: ${broken.length}`);
  console.log(broken.length ? JSON.stringify(broken, null, 2) : "");
  console.log(`  -> webhook sync would silently skip: ${skipRisk.length}`);
  console.log(skipRisk.length ? JSON.stringify(skipRisk, null, 2) : "");

  const statusCounts = rows.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {});
  console.log("Stripe status distribution:", statusCounts);
}

async function sectionPaidInvoices(stripe, db) {
  console.log("\n########## B. PAID INVOICES vs ACCESS ##########");

  const paidBySub = new Map();
  let scanned = 0;
  for await (const invoice of stripe.invoices.list({ status: "paid", limit: 100 })) {
    scanned += 1;
    const subId =
      typeof invoice.subscription === "string"
        ? invoice.subscription
        : invoice.subscription?.id;
    if (!subId || Number(invoice.amount_paid) <= 0) continue;
    const prev = paidBySub.get(subId);
    if (!prev || Number(invoice.created) > Number(prev.created)) {
      paidBySub.set(subId, {
        created: invoice.created,
        invoiceId: invoice.id,
        amountPaid: invoice.amount_paid,
        currency: invoice.currency,
        periodEnd: invoice.lines?.data?.[0]?.period?.end ?? null,
        customerEmail: invoice.customer_email,
      });
    }
  }
  console.log(`Paid invoices scanned: ${scanned}; distinct subscriptions paid: ${paidBySub.size}`);

  const nowSec = Math.floor(Date.now() / 1000);
  const suspicious = [];
  for (const [subId, info] of paidBySub) {
    if (info.periodEnd != null && info.periodEnd < nowSec) continue;

    let sub;
    try {
      sub = await stripe.subscriptions.retrieve(subId);
    } catch (err) {
      suspicious.push({ subId, issue: "subscription_retrieve_failed", message: err?.message });
      continue;
    }

    const uid = clean(sub.metadata?.uid);
    let userData = null;
    if (uid) {
      const snap = await db.collection("Users").doc(uid).get();
      userData = snap.exists ? snap.data() : null;
    }
    if (userData && hasPremiumAccess(userData)) continue;

    suspicious.push({
      subId,
      issue: "paid_period_active_but_no_access",
      stripeStatus: sub.status,
      canceledAt: isoDay(sub.ended_at),
      uid: uid || "(none)",
      fsStatus: userData?.subscriptionStatus ?? null,
      fsPremium: userData?.premium ?? null,
      paidUntil: isoDay(info.periodEnd),
      amountPaid: `${(info.amountPaid / 100).toFixed(2)} ${info.currency}`,
      email: info.customerEmail,
      invoiceId: info.invoiceId,
    });
  }

  console.log(`Paid, period still running, but no access: ${suspicious.length}`);
  console.log(suspicious.length ? JSON.stringify(suspicious, null, 2) : "(none)");
}

async function fetchRevenueCatSubscriber(appUserId) {
  const key = clean(process.env.REVENUECAT_SECRET_API_KEY);
  if (!key) return { error: "missing_key" };
  const res = await fetch(
    `https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(appUserId)}`,
    { headers: { Authorization: `Bearer ${key}`, Accept: "application/json" } }
  );
  if (!res.ok) return { error: `http_${res.status}` };
  const body = await res.json();
  return { subscriber: body?.subscriber || null };
}

async function sectionRevenueCat(db) {
  console.log("\n########## C. REVENUECAT / GOOGLE PLAY vs ACCESS ##########");

  const premiumSnap = await db.collection("Users").where("premium", "==", true).get();
  const providerCounts = {};
  const candidates = new Map();
  for (const doc of premiumSnap.docs) {
    const d = doc.data() || {};
    const provider = d.subscriptionProvider || "(none)";
    providerCounts[provider] = (providerCounts[provider] || 0) + 1;
    if (d.premiumSources?.revenuecat || d.revenueCatProductId || d.revenueCatSubscriptionStatus) {
      candidates.set(doc.id, d);
    }
  }
  console.log(`Users with premium == true: ${premiumSnap.size}`);
  console.log("subscriptionProvider distribution:", providerCounts);

  const rcSnap = await db
    .collection("Users")
    .where("subscriptionProvider", "==", "revenuecat")
    .get();
  for (const doc of rcSnap.docs) candidates.set(doc.id, doc.data() || {});

  const mismatches = [];
  for (const [uid, d] of candidates) {
    const localActive = hasPremiumAccess(d);
    const { subscriber, error } = await fetchRevenueCatSubscriber(uid);
    if (error) {
      if (localActive) continue;
      mismatches.push({ uid, email: d.email || null, issue: `revenuecat_lookup_${error}` });
      continue;
    }
    const entitlements = subscriber?.entitlements || {};
    const rcActive = Object.values(entitlements).some((e) => {
      const exp = e?.expires_date ? Date.parse(e.expires_date) : null;
      return exp == null || exp > Date.now();
    });
    if (rcActive && !localActive) {
      mismatches.push({
        uid,
        email: d.email || null,
        issue: "revenuecat_active_but_no_local_access",
        rcEntitlements: entitlements,
        localPremium: d.premium ?? null,
        localSources: d.premiumSources ?? null,
      });
    }
  }
  console.log(`RevenueCat holders checked: ${candidates.size}`);
  console.log(`RevenueCat active but no local access: ${mismatches.length}`);
  console.log(mismatches.length ? JSON.stringify(mismatches, null, 2) : "(none)");
}

async function sectionRevenueCatEvents(db) {
  console.log("\n########## D. REVENUECAT WEBHOOK EVENT OUTCOMES ##########");
  const snap = await db.collection("revenueCatWebhookEvents").get();
  const byReason = {};
  const byType = {};
  const notGranted = [];
  const PURCHASE_LIKE = [
    "INITIAL_PURCHASE",
    "RENEWAL",
    "NON_RENEWING_PURCHASE",
    "UNCANCELLATION",
    "PRODUCT_CHANGE",
  ];
  for (const doc of snap.docs) {
    const d = doc.data() || {};
    const reason = d.result?.skipped === true ? d.result?.reason || "skipped" : "granted";
    byReason[reason] = (byReason[reason] || 0) + 1;
    byType[`${d.eventType}|${reason}`] = (byType[`${d.eventType}|${reason}`] || 0) + 1;
    if (
      PURCHASE_LIKE.includes(clean(d.eventType)) &&
      d.result?.skipped === true &&
      reason !== "already_processed"
    ) {
      notGranted.push({
        eventId: d.eventId,
        eventType: d.eventType,
        uid: d.uid,
        productId: d.productId,
        reason,
      });
    }
  }
  console.log(`Recorded events: ${snap.size}`);
  console.log("Outcome distribution:", byReason);
  console.log("By event type:", byType);
  console.log(`Purchase-like events that granted nothing: ${notGranted.length}`);
  console.log(notGranted.length ? JSON.stringify(notGranted, null, 2) : "(none)");
}

function sectionDuplicateSubscriptions(subs) {
  console.log("\n########## E. SIMULTANEOUS DUPLICATE SUBSCRIPTIONS ##########");
  const byUid = new Map();
  for (const sub of subs) {
    if (!PAYING_STATUSES.has(sub.status)) continue;
    const uid = clean(sub.metadata?.uid);
    if (!uid) continue;
    if (!byUid.has(uid)) byUid.set(uid, []);
    byUid.get(uid).push({
      id: sub.id,
      status: sub.status,
      created: isoDay(sub.created),
      email: typeof sub.customer === "object" ? sub.customer?.email : null,
    });
  }
  const duplicates = [...byUid.entries()].filter(([, list]) => list.length > 1);
  console.log(`Users billed by more than one active subscription: ${duplicates.length}`);
  console.log(duplicates.length ? JSON.stringify(duplicates, null, 2) : "(none)");
}

async function main() {
  const secretKey = LIVE
    ? clean(process.env.STRIPE_SECRET_KEY_LIVE)
    : clean(process.env.STRIPE_SECRET_KEY);
  if (!secretKey) throw new Error("Missing Stripe secret key");
  console.log(`Mode: ${secretKey.startsWith("sk_live") ? "LIVE" : "TEST"}`);

  const stripe = new Stripe(secretKey);
  const db = initFirestore();
  const userCache = new Map();

  const subs = await listAllSubscriptions(stripe);
  await sectionSubscriptionsVsAccess(stripe, db, subs, userCache);
  await sectionPaidInvoices(stripe, db);
  await sectionRevenueCat(db);
  await sectionRevenueCatEvents(db);
  sectionDuplicateSubscriptions(subs);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("AUDIT FAILED:", err);
    process.exit(1);
  });
