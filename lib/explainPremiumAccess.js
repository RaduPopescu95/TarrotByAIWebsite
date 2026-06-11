import { currentPeriodEndToMillis } from "./premiumAccess";

function safeStr(value) {
  return typeof value === "string" ? value.trim() : "";
}

function readProvider(userData) {
  const provider = userData.subscriptionProvider ?? userData.subscription_provider;
  return safeStr(provider).toLowerCase();
}

function readPremiumFlag(userData) {
  return userData.premium === true || userData.premium === "true" || userData.premium === 1;
}

function readStatus(userData) {
  return safeStr(userData.subscriptionStatus ?? userData.subscription_status).toLowerCase();
}

function tsToIso(value) {
  const ms = currentPeriodEndToMillis(value);
  return ms != null ? new Date(ms).toISOString() : null;
}

export function buildPremiumAccessSnapshot(userData) {
  if (!userData || typeof userData !== "object") {
    return null;
  }
  return {
    premium: readPremiumFlag(userData),
    subscriptionProvider: readProvider(userData) || null,
    subscriptionStatus: readStatus(userData) || null,
    currentPeriodEnd: tsToIso(userData.currentPeriodEnd ?? userData.current_period_end),
    manualPremiumExpiresAt: tsToIso(userData.manualPremiumExpiresAt),
    stripeSubscriptionId: safeStr(userData.stripeSubscriptionId ?? userData.stripe_subscription_id) || null,
    stripeCustomerId: safeStr(userData.stripeCustomerId ?? userData.stripe_customer_id) || null,
    email: safeStr(userData.email) || null,
    owner_uid: safeStr(userData.owner_uid) || null,
  };
}

/**
 * @returns {{ hasAccess: boolean, reason: string, snapshot: object|null, now: string }}
 */
export function explainPremiumAccess(userData) {
  const now = new Date().toISOString();
  const snapshot = buildPremiumAccessSnapshot(userData);

  if (!userData || typeof userData !== "object") {
    return { hasAccess: false, reason: "no_user_data", snapshot: null, now };
  }

  const provider = readProvider(userData);
  if (provider && provider !== "stripe") {
    const manualEnd = currentPeriodEndToMillis(userData.manualPremiumExpiresAt);
    if (manualEnd != null && Date.now() >= manualEnd) {
      return { hasAccess: false, reason: "manual_expired", snapshot, now };
    }
    if (readPremiumFlag(userData)) {
      return { hasAccess: true, reason: `manual_active:${provider}`, snapshot, now };
    }
    return { hasAccess: false, reason: `manual_inactive:${provider || "unknown"}`, snapshot, now };
  }

  const status = readStatus(userData);
  const endMs = currentPeriodEndToMillis(userData.currentPeriodEnd ?? userData.current_period_end);
  const nowMs = Date.now();

  if (status === "active" || status === "past_due" || status === "trialing") {
    if (endMs != null && nowMs >= endMs) {
      return { hasAccess: false, reason: "stripe_period_ended", snapshot, now };
    }
    return { hasAccess: true, reason: `stripe_${status || "active"}`, snapshot, now };
  }

  if (status === "canceled") {
    if (endMs != null && nowMs < endMs) {
      return { hasAccess: true, reason: "stripe_canceled_grace", snapshot, now };
    }
    return { hasAccess: false, reason: "stripe_canceled_expired", snapshot, now };
  }

  if (status === "unpaid") {
    return { hasAccess: false, reason: "stripe_unpaid", snapshot, now };
  }

  if (status === "expired") {
    return { hasAccess: false, reason: "stripe_expired", snapshot, now };
  }

  if (readPremiumFlag(userData)) {
    return { hasAccess: true, reason: "premium_flag_fallback", snapshot, now };
  }

  return { hasAccess: false, reason: "no_access", snapshot, now };
}

export function hasPremiumAccessFromExplain(userData) {
  return explainPremiumAccess(userData).hasAccess;
}
