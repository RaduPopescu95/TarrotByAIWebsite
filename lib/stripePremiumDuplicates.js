import { PREMIUM_FLOW_METADATA } from "./premiumAccess";

export const DUPLICATE_PREMIUM_SUBSCRIPTION_STATUSES = [
  "active",
  "trialing",
  "past_due",
];

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function stripeId(value) {
  if (typeof value === "string") return value;
  return cleanString(value?.id);
}

function unixToIso(value) {
  return typeof value === "number" && Number.isFinite(value)
    ? new Date(value * 1000).toISOString()
    : null;
}

function mapUser(docOrUser) {
  if (!docOrUser) return null;
  const isDoc = typeof docOrUser.data === "function";
  const data = isDoc ? docOrUser.data() || {} : docOrUser;
  const uid =
    cleanString(data.owner_uid) ||
    cleanString(isDoc ? docOrUser.id : data.uid || data.id);
  if (!uid) return null;
  return {
    uid,
    email: cleanString(data.email),
    firstName: cleanString(data.firstName || data.first_name),
    lastName: cleanString(data.lastName || data.last_name),
    stripeCustomerId: cleanString(data.stripeCustomerId),
  };
}

function mapSubscription(subscription) {
  const item = Array.isArray(subscription?.items?.data)
    ? subscription.items.data[0]
    : null;
  const price = item?.price || null;
  const recurring = price?.recurring || null;

  return {
    id: cleanString(subscription?.id),
    customerId: stripeId(subscription?.customer) || null,
    status: cleanString(subscription?.status),
    createdAt: unixToIso(subscription?.created),
    currentPeriodStart: unixToIso(subscription?.current_period_start),
    currentPeriodEnd: unixToIso(subscription?.current_period_end),
    cancelAtPeriodEnd: subscription?.cancel_at_period_end === true,
    priceId: stripeId(price) || null,
    productId: stripeId(price?.product) || null,
    amount: typeof price?.unit_amount === "number" ? price.unit_amount : null,
    currency: cleanString(price?.currency).toLowerCase() || null,
    interval: cleanString(recurring?.interval) || null,
    intervalCount:
      typeof recurring?.interval_count === "number" ? recurring.interval_count : null,
    quantity: typeof item?.quantity === "number" ? item.quantity : null,
  };
}

/**
 * Pure duplicate detector. Names and email are display-only; identity resolution
 * uses subscription metadata.uid first and a unique Stripe customer mapping second.
 */
export function buildPremiumDuplicateReport(subscriptions, users, options = {}) {
  const usersByUid = new Map();
  const uidsByCustomerId = new Map();

  for (const rawUser of Array.isArray(users) ? users : []) {
    const user = mapUser(rawUser);
    if (!user) continue;
    usersByUid.set(user.uid, user);
    if (!user.stripeCustomerId) continue;
    if (!uidsByCustomerId.has(user.stripeCustomerId)) {
      uidsByCustomerId.set(user.stripeCustomerId, new Set());
    }
    uidsByCustomerId.get(user.stripeCustomerId).add(user.uid);
  }

  const subscriptionsById = new Map();
  for (const subscription of Array.isArray(subscriptions) ? subscriptions : []) {
    const id = cleanString(subscription?.id);
    if (!id) continue;
    if (!DUPLICATE_PREMIUM_SUBSCRIPTION_STATUSES.includes(subscription?.status)) continue;
    if (subscription?.metadata?.flow !== PREMIUM_FLOW_METADATA) continue;
    subscriptionsById.set(id, subscription);
  }

  const subscriptionsByUid = new Map();
  let unresolvedCount = 0;

  for (const subscription of subscriptionsById.values()) {
    const metadataUid = cleanString(subscription?.metadata?.uid);
    const customerId = stripeId(subscription?.customer);
    const customerUids = customerId
      ? uidsByCustomerId.get(customerId) || new Set()
      : new Set();

    let uid = "";
    let resolvedBy = "";
    if (metadataUid) {
      const customerConflicts =
        customerUids.size > 0 &&
        (customerUids.size !== 1 || !customerUids.has(metadataUid));
      if (!usersByUid.has(metadataUid) || customerConflicts) {
        unresolvedCount += 1;
        continue;
      }
      uid = metadataUid;
      resolvedBy = "subscription_metadata";
    } else if (customerUids.size === 1) {
      uid = [...customerUids][0];
      resolvedBy = "stripe_customer";
    } else {
      unresolvedCount += 1;
      continue;
    }

    if (!subscriptionsByUid.has(uid)) subscriptionsByUid.set(uid, []);
    subscriptionsByUid.get(uid).push({
      ...mapSubscription(subscription),
      resolvedBy,
    });
  }

  const groups = [];
  for (const [uid, resolvedSubscriptions] of subscriptionsByUid.entries()) {
    if (resolvedSubscriptions.length < 2) continue;
    const user = usersByUid.get(uid);
    const sortedSubscriptions = [...resolvedSubscriptions].sort((a, b) => {
      if (!a.createdAt && !b.createdAt) return a.id.localeCompare(b.id);
      if (!a.createdAt) return 1;
      if (!b.createdAt) return -1;
      return a.createdAt.localeCompare(b.createdAt);
    });
    groups.push({
      uid,
      email: user?.email || "",
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      subscriptionCount: sortedSubscriptions.length,
      extraSubscriptionCount: sortedSubscriptions.length - 1,
      subscriptions: sortedSubscriptions,
    });
  }

  groups.sort((a, b) => {
    if (a.extraSubscriptionCount !== b.extraSubscriptionCount) {
      return b.extraSubscriptionCount - a.extraSubscriptionCount;
    }
    const aLabel = `${a.firstName} ${a.lastName} ${a.email} ${a.uid}`.toLowerCase();
    const bLabel = `${b.firstName} ${b.lastName} ${b.email} ${b.uid}`.toLowerCase();
    return aLabel.localeCompare(bLabel);
  });

  const totalSubscriptions = groups.reduce(
    (total, group) => total + group.subscriptionCount,
    0,
  );
  const extraSubscriptions = groups.reduce(
    (total, group) => total + group.extraSubscriptionCount,
    0,
  );

  return {
    totalUsers: groups.length,
    totalSubscriptions,
    extraSubscriptions,
    unresolvedCount,
    generatedAt: options.generatedAt || new Date().toISOString(),
    groups,
  };
}

export async function listCurrentPremiumSubscriptions(stripe) {
  const byId = new Map();
  for (const status of DUPLICATE_PREMIUM_SUBSCRIPTION_STATUSES) {
    let startingAfter;
    do {
      const page = await stripe.subscriptions.list({
        status,
        limit: 100,
        ...(startingAfter ? { starting_after: startingAfter } : {}),
      });
      const rows = Array.isArray(page?.data) ? page.data : [];
      for (const subscription of rows) {
        if (subscription?.metadata?.flow !== PREMIUM_FLOW_METADATA) continue;
        if (cleanString(subscription?.id)) byId.set(subscription.id, subscription);
      }
      startingAfter = page?.has_more && rows.length > 0 ? rows[rows.length - 1].id : undefined;
    } while (startingAfter);
  }
  return [...byId.values()];
}

async function loadRelevantUsers(db, subscriptions) {
  const usersRef = db.collection("Users");
  const customerSnapshot = await usersRef.where("stripeCustomerId", ">", "").get();
  const docsByUid = new Map(
    customerSnapshot.docs.map((docSnap) => [docSnap.id, docSnap]),
  );

  const requestedMetadataUids = [
    ...new Set(
      subscriptions
        .map((subscription) => cleanString(subscription?.metadata?.uid))
        .filter(Boolean),
    ),
  ];
  const knownCanonicalUids = () =>
    new Set(
      [...docsByUid.values()]
        .map((docSnap) => mapUser(docSnap)?.uid)
        .filter(Boolean),
    );
  const initiallyKnownUids = knownCanonicalUids();
  const metadataUids = requestedMetadataUids.filter(
    (uid) => !initiallyKnownUids.has(uid),
  );

  for (let index = 0; index < metadataUids.length; index += 50) {
    const chunk = metadataUids.slice(index, index + 50);
    const snapshots = await Promise.all(chunk.map((uid) => usersRef.doc(uid).get()));
    for (const snapshot of snapshots) {
      if (snapshot.exists) docsByUid.set(snapshot.id, snapshot);
    }
  }

  const knownAfterDirectReads = knownCanonicalUids();
  const unresolvedOwnerUids = requestedMetadataUids.filter((uid) => !knownAfterDirectReads.has(uid));
  for (let index = 0; index < unresolvedOwnerUids.length; index += 10) {
    const chunk = unresolvedOwnerUids.slice(index, index + 10);
    const snapshot = await usersRef.where("owner_uid", "in", chunk).get();
    for (const docSnap of snapshot.docs) docsByUid.set(docSnap.id, docSnap);
  }

  return [...docsByUid.values()];
}

export async function loadPremiumDuplicateReport({ stripe, db }) {
  const subscriptions = await listCurrentPremiumSubscriptions(stripe);
  const users = await loadRelevantUsers(db, subscriptions);
  return buildPremiumDuplicateReport(subscriptions, users);
}
