import { PREMIUM_FLOW_METADATA, hasPremiumAccess } from "./premiumAccess";

export const PREMIUM_ALREADY_ACTIVE_ERROR = "premium_already_active";

/** Stripe statuses that imply an ongoing paid (or grace) site_premium subscription. */
export const GUARDED_STRIPE_SUBSCRIPTION_STATUSES = ["active", "trialing", "past_due"];

/**
 * @param {import("stripe").Stripe.Subscription} subscription
 */
export function isSitePremiumStripeSubscription(subscription) {
  return subscription?.metadata?.flow === PREMIUM_FLOW_METADATA;
}

/**
 * Pure decision: should we block starting a new premium checkout/payment sheet?
 *
 * @param {{ userData?: object | null; stripeSubscriptions?: import("stripe").Stripe.Subscription[] }} input
 * @returns {{ block: boolean; reason?: "firestore_premium" | "stripe_active_subscription" }}
 */
export function evaluatePremiumSubscriptionBlock(input) {
  const userData = input?.userData && typeof input.userData === "object" ? input.userData : null;
  const stripeSubscriptions = Array.isArray(input?.stripeSubscriptions)
    ? input.stripeSubscriptions
    : [];

  if (userData && hasPremiumAccess(userData)) {
    return { block: true, reason: "firestore_premium" };
  }

  const activeSitePremium = stripeSubscriptions.filter(
    (sub) =>
      isSitePremiumStripeSubscription(sub) &&
      GUARDED_STRIPE_SUBSCRIPTION_STATUSES.includes(sub.status)
  );
  if (activeSitePremium.length > 0) {
    return { block: true, reason: "stripe_active_subscription" };
  }

  return { block: false };
}

/**
 * @param {import("stripe").default} stripe
 * @param {string} customerId
 * @returns {Promise<import("stripe").Stripe.Subscription[]>}
 */
export async function listGuardedSitePremiumSubscriptionsForCustomer(stripe, customerId) {
  if (!customerId || typeof customerId !== "string") return [];

  const byId = new Map();
  for (const status of GUARDED_STRIPE_SUBSCRIPTION_STATUSES) {
    const page = await stripe.subscriptions.list({
      customer: customerId,
      status,
      limit: 100,
    });
    for (const sub of page.data) {
      if (!isSitePremiumStripeSubscription(sub)) continue;
      byId.set(sub.id, sub);
    }
  }
  return [...byId.values()];
}

/**
 * @param {import("stripe").default} stripe
 * @param {string} customerId
 * @param {string} returnUrl
 * @returns {Promise<string | null>}
 */
export async function createPremiumBillingPortalUrl(stripe, customerId, returnUrl) {
  if (!customerId || !returnUrl) return null;
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });
    return session?.url || null;
  } catch (err) {
    console.warn("[premium.guard] portal_create_failed", { message: err?.message });
    return null;
  }
}

/**
 * @param {{
 *   db: import("firebase-admin/firestore").Firestore;
 *   stripe: import("stripe").default;
 *   uid: string;
 *   returnUrl: string;
 *   defaultMessage?: string;
 * }} params
 */
export async function assertCanStartPremiumSubscription({
  db,
  stripe,
  uid,
  returnUrl,
  defaultMessage = "Ai deja un abonament premium activ.",
}) {
  const userRef = db.collection("Users").doc(uid);
  const userSnap = await userRef.get();
  const userData = userSnap.exists ? userSnap.data() || null : null;

  let stripeCustomerId =
    typeof userData?.stripeCustomerId === "string" && userData.stripeCustomerId.trim()
      ? userData.stripeCustomerId.trim()
      : "";

  if (!stripeCustomerId) {
    const decision = evaluatePremiumSubscriptionBlock({ userData, stripeSubscriptions: [] });
    if (!decision.block) {
      return { allowed: true };
    }
    return {
      allowed: false,
      code: PREMIUM_ALREADY_ACTIVE_ERROR,
      reason: decision.reason,
      message: defaultMessage,
      portalUrl: null,
    };
  }

  const stripeSubscriptions = await listGuardedSitePremiumSubscriptionsForCustomer(
    stripe,
    stripeCustomerId
  );
  const decision = evaluatePremiumSubscriptionBlock({ userData, stripeSubscriptions });

  if (!decision.block) {
    return { allowed: true, stripeCustomerId };
  }

  const portalUrl = await createPremiumBillingPortalUrl(stripe, stripeCustomerId, returnUrl);

  return {
    allowed: false,
    code: PREMIUM_ALREADY_ACTIVE_ERROR,
    reason: decision.reason,
    message: defaultMessage,
    portalUrl,
    stripeCustomerId,
  };
}
