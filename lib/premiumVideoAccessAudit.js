import { explainPremiumAccess } from "./explainPremiumAccess";

const LOG_PREFIX = "[premium-video-access]";

function summarizeVideos(videos) {
  if (!Array.isArray(videos)) {
    return { total: 0, premium: 0, lockedPremium: 0, playablePremium: 0 };
  }
  let premium = 0;
  let lockedPremium = 0;
  let playablePremium = 0;
  videos.forEach((video) => {
    if (video?.isPremium !== true) return;
    premium += 1;
    if (video.canPlay === true) playablePremium += 1;
    else lockedPremium += 1;
  });
  return { total: videos.length, premium, lockedPremium, playablePremium };
}

/**
 * Structured server log for premium video access decisions.
 */
export function auditPremiumVideoAccess(entry) {
  const payload = {
    at: new Date().toISOString(),
    ...entry,
  };

  const mismatch =
    entry.premiumActive === true &&
    typeof entry.lockedPremiumCount === "number" &&
    entry.lockedPremiumCount > 0;

  if (mismatch || entry.level === "error" || entry.level === "warn") {
    console.warn(`${LOG_PREFIX} ${entry.stage || "event"}`, payload);
    return payload;
  }

  console.info(`${LOG_PREFIX} ${entry.stage || "event"}`, payload);
  return payload;
}

export function auditUserPremiumFields(uid, userData, context = {}) {
  const explained = explainPremiumAccess(userData);
  return auditPremiumVideoAccess({
    stage: context.stage || "user_premium_check",
    uid: uid || null,
    hasAccess: explained.hasAccess,
    reason: explained.reason,
    snapshot: explained.snapshot,
    ...context,
  });
}

export function auditVideoLibraryResponse({
  stage,
  requestId,
  uid,
  premiumActive,
  subscriptionSystemEnabled,
  accessExplain,
  videos,
  extra = {},
}) {
  const videoStats = summarizeVideos(videos);
  const mismatch = premiumActive === true && videoStats.lockedPremium > 0;

  return auditPremiumVideoAccess({
    stage,
    level: mismatch ? "warn" : "info",
    requestId: requestId || null,
    uid: uid || null,
    premiumActive: premiumActive === true,
    subscriptionSystemEnabled: subscriptionSystemEnabled === true,
    hasAccess: accessExplain?.hasAccess,
    accessReason: accessExplain?.reason || null,
    accessSnapshot: accessExplain?.snapshot || null,
    videoStats,
    lockedPremiumCount: videoStats.lockedPremium,
    mismatch: mismatch
      ? "premium_user_but_locked_premium_videos_in_dto"
      : premiumActive === false && accessExplain?.hasAccess === true
        ? "has_access_but_premiumActive_false"
        : null,
    ...extra,
  });
}

export function buildClientAccessDebug(accessExplain, extra = {}) {
  if (!accessExplain) return null;
  return {
    hasAccess: accessExplain.hasAccess,
    reason: accessExplain.reason,
    snapshot: accessExplain.snapshot,
    checkedAt: accessExplain.now,
    ...extra,
  };
}
