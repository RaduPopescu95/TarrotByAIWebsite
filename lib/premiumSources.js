const SOURCE_KEYS = ["stripe", "revenuecat", "manual"];

function currentPeriodEndToMillis(value) {
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

export function isSourceActive(source, nowMs = Date.now()) {
  if (!source || typeof source !== "object" || source.active !== true) return false;
  const expiresAt = currentPeriodEndToMillis(source.expiresAt || source.currentPeriodEnd);
  return expiresAt == null || expiresAt > nowMs;
}

export function hasActivePremiumSource(premiumSources, nowMs = Date.now()) {
  if (!premiumSources || typeof premiumSources !== "object") return false;
  return SOURCE_KEYS.some((key) => isSourceActive(premiumSources[key], nowMs));
}

export function hasCanonicalPremiumSources(userData) {
  return Boolean(
    userData &&
      Object.prototype.hasOwnProperty.call(userData, "premiumSources") &&
      userData.premiumSources &&
      typeof userData.premiumSources === "object" &&
      !Array.isArray(userData.premiumSources)
  );
}

export function inferLegacyPremiumSources(userData) {
  if (hasCanonicalPremiumSources(userData)) {
    return { ...userData.premiumSources };
  }

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
    const stripeEnd = currentPeriodEndToMillis(userData?.currentPeriodEnd);
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
    const rcEnd = currentPeriodEndToMillis(userData?.revenueCatCurrentPeriodEnd);
    const statusAllowsAccess = ["active", "past_due", "trialing"].includes(rcStatus);
    sources.revenuecat = {
      active:
        (statusAllowsAccess || (!rcStatus && provider === "revenuecat" && userData?.premium === true)) &&
        (rcEnd == null || rcEnd > Date.now()),
      status: rcStatus,
      expiresAt: userData?.revenueCatCurrentPeriodEnd || null,
    };
  }

  const manualEvidence = provider === "manual" || userData?.manualPremiumExpiresAt != null;
  if (manualEvidence) {
    const expiry = currentPeriodEndToMillis(userData?.manualPremiumExpiresAt);
    sources.manual = {
      active: userData?.premium === true && (expiry == null || expiry > Date.now()),
      status: userData?.premium === true ? "active" : "inactive",
      expiresAt: userData?.manualPremiumExpiresAt || null,
    };
  }
  return sources;
}

export function buildPremiumSourcePatch(userData, sourceName, source) {
  const premiumSources = {
    ...inferLegacyPremiumSources(userData),
    [sourceName]: source,
  };
  const activeProviders = Object.entries(premiumSources)
    .filter(([key, value]) => SOURCE_KEYS.includes(key) && isSourceActive(value))
    .map(([key]) => key)
    .sort();

  return {
    premiumSources,
    premium: activeProviders.length > 0,
    activePremiumProviders: activeProviders,
    subscriptionProvider:
      activeProviders.length === 1
        ? activeProviders[0]
        : activeProviders.length > 1
        ? "multiple"
        : null,
  };
}
