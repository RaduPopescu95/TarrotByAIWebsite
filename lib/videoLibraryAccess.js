import { getAdminDb } from "./firebaseAdmin";
import { isIosPremiumSubscriptionsEnabled } from "./globalSettings";
import { explainPremiumAccess } from "./explainPremiumAccess";
import { auditPremiumVideoAccess } from "./premiumVideoAccessAudit";
import { withFirestoreCostLog } from "./firestoreCostLogger";

/**
 * Premium flag used when mapping video rows for cacheable public list responses.
 * Billing availability must never grant content access. Anonymous/public
 * responses therefore always remain non-premium.
 */
export async function resolvePublicVideoLibraryPremiumActive(context = {}) {
  const subscriptionEnabled = await isIosPremiumSubscriptionsEnabled();
  const premiumActive = false;
  auditPremiumVideoAccess({
    stage: "public_premium_resolve",
    uid: null,
    subscriptionSystemEnabled: subscriptionEnabled,
    premiumActive,
    hasAccess: premiumActive,
    accessReason: "subscription_system_requires_auth",
    appPlatform: context?.appPlatform || null,
  });
  return premiumActive;
}

/**
 * Premium flag for personalized responses (list/detail with auth).
 * @returns {Promise<{ premiumActive: boolean, accessExplain: ReturnType<typeof explainPremiumAccess>, subscriptionSystemEnabled: boolean, userDocExists: boolean }>}
 */
export async function resolveVideoLibraryPremiumAccessForUser(uid, context = {}) {
  const subscriptionEnabled = await isIosPremiumSubscriptionsEnabled();
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
