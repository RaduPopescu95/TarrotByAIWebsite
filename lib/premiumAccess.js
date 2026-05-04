/**
 * Premium access helpers — provider-agnostic checks on Firestore user fields.
 * Stripe maps into: premium, subscriptionStatus, subscriptionProvider, currentPeriodEnd.
 * Other providers (RevenueCat, Play, App Store) can set the same fields or rely on `premium`.
 */

export const PREMIUM_FLOW_METADATA = "site_premium";

/**
 * Map Stripe.Subscription.status to our Firestore subscriptionStatus.
 * trialing → active (paid trial / access)
 */
export function mapStripeSubscriptionStatus(stripeStatus) {
  if (!stripeStatus || typeof stripeStatus !== "string") return "expired";
  switch (stripeStatus) {
    case "active":
    case "trialing":
      return "active";
    case "past_due":
      return "past_due";
    case "unpaid":
      return "unpaid";
    case "canceled":
      return "canceled";
    case "incomplete":
    case "incomplete_expired":
      return "expired";
    case "paused":
      return "expired";
    default:
      return "expired";
  }
}

export function currentPeriodEndToMillis(value) {
  if (value == null) return null;
  if (typeof value === "number") {
    return value > 1e12 ? value : value * 1000;
  }
  if (value instanceof Date) return value.getTime();
  if (typeof value.toMillis === "function") return value.toMillis();
  if (typeof value.seconds === "number") return value.seconds * 1000;
  return null;
}

/**
 * Whether the user should see premium content now, from denormalized user/profile fields.
 *
 * Stripe note: `subscriptionStatus` is kept in sync by the premium webhook
 * (`customer.subscription.updated` / `.deleted`) writing merge fields on `Users`.
 * If the user cancels in the Customer Portal with *cancel at period end*, status often stays
 * `active` until the period ends; then it becomes `canceled` and access follows `currentPeriodEnd`.
 * For *immediate* cancel, the webhook caps `currentPeriodEnd` using Stripe's `ended_at` so access
 * does not outlive the actual cancellation moment (see buildUserPremiumPayload).
 * The client may show stale data until the next profile fetch (no real-time listener by default).
 *
 * @param {object|null} userData - Users doc or AuthContext userData
 */
export function hasPremiumAccess(userData) {
  if (!userData || typeof userData !== "object") return false;

  const provider = userData.subscriptionProvider;
  if (provider && provider !== "stripe") {
    const manualEnd = currentPeriodEndToMillis(userData.manualPremiumExpiresAt);
    if (manualEnd != null && Date.now() >= manualEnd) return false;
    return userData.premium === true;
  }

  const status = userData.subscriptionStatus;
  const endMs = currentPeriodEndToMillis(userData.currentPeriodEnd);
  const now = Date.now();

  if (status === "active" || status === "past_due") {
    if (endMs != null && now >= endMs) return false;
    return true;
  }

  if (status === "canceled") {
    if (endMs != null && now < endMs) return true;
    return false;
  }

  if (status === "unpaid" || status === "expired") {
    return false;
  }

  return userData.premium === true;
}

/**
 * Webhook / server: set `premium` boolean consistently with hasPremiumAccess logic.
 */
export function computePremiumBoolean(fields) {
  return hasPremiumAccess(fields);
}
