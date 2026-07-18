import { getAdminDb } from "./firebaseAdmin";
import { isIosPremiumSubscriptionsEnabled } from "./globalSettings";
import { explainPremiumAccess } from "./explainPremiumAccess";
import { auditPremiumVideoAccess } from "./premiumVideoAccessAudit";
import { withFirestoreCostLog } from "./firestoreCostLogger";

function isWebClientContext(context = {}) {
  if (context?.webClient === true) return true;
  if (typeof context?.client === "string") {
    return context.client.trim().toLowerCase() === "web";
  }
  return false;
}

function isIosAppContext(context = {}) {
  return typeof context?.appPlatform === "string" &&
    context.appPlatform.trim().toLowerCase() === "ios";
}

/**
 * Premium flag used when mapping video rows for cacheable public list responses.
 * When subscription is disabled, all premium content is treated as unlocked only for
 * legacy/non-web clients. Website requests must keep normal subscription gating.
 */
export async function resolvePublicVideoLibraryPremiumActive(context = {}) {
  const subscriptionEnabled = await isIosPremiumSubscriptionsEnabled();
  const webClient = isWebClientContext(context);
  const iosApp = isIosAppContext(context);
  const premiumActive = !subscriptionEnabled && iosApp && !webClient;
  auditPremiumVideoAccess({
    stage: "public_premium_resolve",
    uid: null,
    subscriptionSystemEnabled: subscriptionEnabled,
    premiumActive,
    hasAccess: premiumActive,
    accessReason: subscriptionEnabled
      ? "subscription_system_requires_auth"
      : webClient
        ? "web_subscription_system_unchanged"
        : !iosApp
          ? "non_ios_subscription_system_unchanged"
        : "subscription_system_disabled",
  });
  return premiumActive;
}

/**
 * Premium flag for personalized responses (list/detail with auth).
 * @returns {Promise<{ premiumActive: boolean, accessExplain: ReturnType<typeof explainPremiumAccess>, subscriptionSystemEnabled: boolean, userDocExists: boolean }>}
 */
export async function resolveVideoLibraryPremiumAccessForUser(uid, context = {}) {
  const subscriptionEnabled = await isIosPremiumSubscriptionsEnabled();
  const webClient = isWebClientContext(context);
  const iosApp = isIosAppContext(context);
  if (!subscriptionEnabled && iosApp && !webClient) {
    const accessExplain = {
      hasAccess: true,
      reason: "subscription_system_disabled",
      snapshot: null,
      now: new Date().toISOString(),
    };
    auditPremiumVideoAccess({
      stage: context.stage || "user_premium_resolve",
      uid: uid || null,
      subscriptionSystemEnabled: false,
      premiumActive: true,
      hasAccess: true,
      accessReason: accessExplain.reason,
      userDocExists: null,
    });
    return {
      premiumActive: true,
      accessExplain,
      subscriptionSystemEnabled: false,
      userDocExists: null,
    };
  }

  const normalizedUid = typeof uid === "string" ? uid.trim() : "";
  if (!normalizedUid) {
    const accessExplain = {
      hasAccess: false,
      reason: "missing_uid",
      snapshot: null,
      now: new Date().toISOString(),
    };
    auditPremiumVideoAccess({
      stage: context.stage || "user_premium_resolve",
      uid: null,
      subscriptionSystemEnabled: true,
      premiumActive: false,
      hasAccess: false,
      accessReason: accessExplain.reason,
      userDocExists: false,
      level: "warn",
    });
    return {
      premiumActive: false,
      accessExplain,
      subscriptionSystemEnabled: subscriptionEnabled,
      userDocExists: false,
    };
  }

  const db = getAdminDb();
  const userSnap = await withFirestoreCostLog(
    {
      page: "api.video-library.access",
      queryName: "Users.premium_by_uid",
      operationType: "document",
    },
    () => db.collection("Users").doc(normalizedUid).get()
  );
  if (!userSnap.exists) {
    const accessExplain = {
      hasAccess: false,
      reason: "user_doc_missing",
      snapshot: null,
      now: new Date().toISOString(),
    };
    auditPremiumVideoAccess({
      stage: context.stage || "user_premium_resolve",
      uid: normalizedUid,
      subscriptionSystemEnabled: true,
      premiumActive: false,
      hasAccess: false,
      accessReason: accessExplain.reason,
      userDocExists: false,
      level: "warn",
    });
    return {
      premiumActive: false,
      accessExplain,
      subscriptionSystemEnabled: subscriptionEnabled,
      userDocExists: false,
    };
  }

  const userData = userSnap.data() || {};
  const accessExplain = explainPremiumAccess(userData);
  auditPremiumVideoAccess({
    stage: context.stage || "user_premium_resolve",
    uid: normalizedUid,
    subscriptionSystemEnabled: true,
    premiumActive: accessExplain.hasAccess,
    hasAccess: accessExplain.hasAccess,
    accessReason: accessExplain.reason,
    accessSnapshot: accessExplain.snapshot,
    userDocExists: true,
    level: accessExplain.hasAccess ? "info" : "warn",
  });

  return {
    premiumActive: accessExplain.hasAccess,
    accessExplain,
    subscriptionSystemEnabled: subscriptionEnabled,
    userDocExists: true,
  };
}

/** @deprecated name kept for callers — use resolveVideoLibraryPremiumAccessForUser for diagnostics */
export async function resolveVideoLibraryPremiumActiveForUser(uid) {
  const result = await resolveVideoLibraryPremiumAccessForUser(uid);
  return result.premiumActive;
}
