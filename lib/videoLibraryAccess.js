import { getAdminDb } from "./firebaseAdmin";
import { isSubscriptionSystemEnabled } from "./globalSettings";
import { hasPremiumAccess } from "./premiumAccess";

/**
 * Premium flag used when mapping video rows for cacheable public list responses.
 * When subscription is disabled, all premium content is treated as unlocked (legacy mobile behavior).
 */
export async function resolvePublicVideoLibraryPremiumActive() {
  const subscriptionEnabled = await isSubscriptionSystemEnabled();
  return !subscriptionEnabled;
}

/**
 * Premium flag for personalized responses (detail view with auth).
 */
export async function resolveVideoLibraryPremiumActiveForUser(uid) {
  const subscriptionEnabled = await isSubscriptionSystemEnabled();
  if (!subscriptionEnabled) {
    return true;
  }

  const normalizedUid = typeof uid === "string" ? uid.trim() : "";
  if (!normalizedUid) {
    return false;
  }

  const db = getAdminDb();
  const userSnap = await db.collection("Users").doc(normalizedUid).get();
  if (!userSnap.exists) {
    return false;
  }

  return hasPremiumAccess(userSnap.data() || {});
}
