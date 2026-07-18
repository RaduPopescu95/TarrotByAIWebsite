import { inferLegacyPremiumSources, isSourceActive } from "./premiumSources";

export function resolveAdminPremiumRevocation(userData = {}) {
  const sources = inferLegacyPremiumSources(userData);
  const subscriptionId =
    typeof userData.stripeSubscriptionId === "string"
      ? userData.stripeSubscriptionId.trim()
      : "";
  const hasStripeSource =
    Boolean(sources.stripe) ||
    ["stripe", "multiple"].includes(userData.subscriptionProvider);
  const hasManualSource =
    Boolean(sources.manual) || userData.subscriptionProvider === "manual";
  const hasActiveRevenueCat = isSourceActive(sources.revenuecat);

  if (hasStripeSource) {
    return subscriptionId
      ? { source: "stripe", subscriptionId, hasActiveRevenueCat }
      : { error: "stripe_subscription_id_missing", hasActiveRevenueCat };
  }
  if (hasManualSource) {
    return { source: "manual", subscriptionId: null, hasActiveRevenueCat };
  }
  if (hasActiveRevenueCat) {
    return { error: "revenuecat_managed_externally", hasActiveRevenueCat: true };
  }
  return { error: "no_locally_revocable_premium_source", hasActiveRevenueCat: false };
}
