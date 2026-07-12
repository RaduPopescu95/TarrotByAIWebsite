const SOURCE_KEYS = ["stripe", "revenuecat", "manual"];

function currentPeriodEndToMillis(value) {
  if (value == null) return null;
  if (typeof value === "number") return value > 1e12 ? value : value * 1000;
  if (value instanceof Date) return value.getTime();
  if (typeof value.toMillis === "function") return value.toMillis();
  if (typeof value.seconds === "number") return value.seconds * 1000;
  return null;
}

function isSourceActive(source, nowMs = Date.now()) {
  if (!source || typeof source !== "object" || source.active !== true) return false;
  const expiresAt = currentPeriodEndToMillis(source.expiresAt || source.currentPeriodEnd);
  return expiresAt == null || expiresAt > nowMs;
}

export function hasActivePremiumSource(premiumSources, nowMs = Date.now()) {
  if (!premiumSources || typeof premiumSources !== "object") return false;
  return Object.values(premiumSources).some((source) => isSourceActive(source, nowMs));
}

export function inferLegacyPremiumSources(userData) {
  const sources =
    userData?.premiumSources && typeof userData.premiumSources === "object"
      ? { ...userData.premiumSources }
      : {};
  const provider = String(
    userData?.subscriptionProvider || userData?.subscription_provider || ""
  )
    .trim()
    .toLowerCase();

  if (!SOURCE_KEYS.includes(provider) || sources[provider]) return sources;

  if (provider === "stripe") {
    sources.stripe = {
      active:
        userData.subscriptionStatus === "active" ||
        userData.subscriptionStatus === "past_due" ||
        userData.subscriptionStatus === "trialing" ||
        (userData.subscriptionStatus === "canceled" &&
          currentPeriodEndToMillis(userData.currentPeriodEnd) > Date.now()),
      status: userData.subscriptionStatus || null,
      expiresAt: userData.currentPeriodEnd || null,
    };
  } else if (provider === "manual") {
    const expiry = currentPeriodEndToMillis(userData.manualPremiumExpiresAt);
    sources.manual = {
      active: userData.premium === true && (expiry == null || expiry > Date.now()),
      status: userData.premium === true ? "active" : "inactive",
      expiresAt: userData.manualPremiumExpiresAt || null,
    };
  } else if (provider === "revenuecat") {
    sources.revenuecat = {
      active: userData.premium === true,
      status: userData.revenueCatSubscriptionStatus || userData.subscriptionStatus || null,
      expiresAt: userData.revenueCatCurrentPeriodEnd || userData.currentPeriodEnd || null,
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
    .filter(([, value]) => isSourceActive(value))
    .map(([key]) => key)
    .sort();

  return {
    premiumSources,
    premium: activeProviders.length > 0,
    activePremiumProviders: activeProviders,
    ...(activeProviders.length === 1
      ? { subscriptionProvider: activeProviders[0] }
      : activeProviders.length > 1
      ? { subscriptionProvider: "multiple" }
      : {}),
  };
}
