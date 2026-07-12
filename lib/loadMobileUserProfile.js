import { getAdminDb } from "./firebaseAdmin";
import { withFirestoreCostLog } from "./firestoreCostLogger";

const USERS_COLLECTION = "Users";
const DEFAULT_CACHE_TTL_MS = 30_000;

const profileCache = new Map();

const MOBILE_USER_PROFILE_FIELDS = new Set([
  "owner_uid",
  "first_name",
  "last_name",
  "email",
  "phone",
  "photoURL",
  "premium",
  "subscriptionStatus",
  "subscription_status",
  "subscriptionProvider",
  "subscription_provider",
  "currentPeriodEnd",
  "current_period_end",
  "manualPremiumExpiresAt",
  "stripeCustomerId",
  "stripe_customer_id",
  "stripeSubscriptionId",
  "stripe_subscription_id",
  "premiumSubscriptionCancelAtPeriodEnd",
  "premiumSources",
  "activePremiumProviders",
  "revenueCatSubscriptionStatus",
  "revenueCatCurrentPeriodEnd",
  "revenueCatProductId",
  "revenueCatOriginalTransactionId",
  "actualLanguage",
  "language",
]);

const serializeFirestoreValue = (value) => {
  if (!value) return value;
  if (value instanceof Date) return value.toISOString();
  if (typeof value?.toDate === "function") return value.toDate().toISOString();
  if (Array.isArray(value)) return value.map(serializeFirestoreValue);
  if (typeof value === "object") {
    const out = {};
    for (const [key, val] of Object.entries(value)) {
      out[key] = serializeFirestoreValue(val);
    }
    return out;
  }
  return value;
};

export function trimMobileUserProfile(rawProfile) {
  if (!rawProfile || typeof rawProfile !== "object") return null;
  const serialized = serializeFirestoreValue(rawProfile);
  const trimmed = {};
  for (const [key, value] of Object.entries(serialized)) {
    if (MOBILE_USER_PROFILE_FIELDS.has(key)) {
      trimmed[key] = value;
    }
  }
  return Object.keys(trimmed).length > 0 ? trimmed : null;
}

export function clearMobileUserProfileCache(uid) {
  if (typeof uid === "string" && uid.trim()) {
    profileCache.delete(uid.trim());
    return;
  }
  profileCache.clear();
}

/**
 * Load the authenticated user's profile from Firestore (Admin SDK).
 * Tries Users/{uid} first, then owner_uid query — same strategy as requireAdmin.
 *
 * @param {string} uid Firebase Auth uid
 * @param {{ fresh?: boolean }} [options]
 * @returns {Promise<{ user: object|null, source: "doc"|"query"|null }>}
 */
export async function loadMobileUserProfile(uid, { fresh = false } = {}) {
  const normalizedUid = typeof uid === "string" ? uid.trim() : "";
  if (!normalizedUid) {
    return { user: null, source: null };
  }

  if (!fresh) {
    const cached = profileCache.get(normalizedUid);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.value;
    }
  }

  const db = getAdminDb();

  const directSnap = await withFirestoreCostLog(
    {
      page: "api.mobile.me",
      queryName: "Users.byUid",
      locale: "ro",
      isrRevalidateSeconds: 30,
    },
    () => db.collection(USERS_COLLECTION).doc(normalizedUid).get()
  );

  let result;
  if (directSnap.exists) {
    result = {
      user: trimMobileUserProfile(directSnap.data() || {}),
      source: "doc",
    };
  } else {
    const querySnap = await withFirestoreCostLog(
      {
        page: "api.mobile.me",
        queryName: "Users.byOwnerUid",
        locale: "ro",
        isrRevalidateSeconds: 30,
      },
      () =>
        db
          .collection(USERS_COLLECTION)
          .where("owner_uid", "==", normalizedUid)
          .limit(1)
          .get()
    );

    const docSnap = querySnap.docs[0];
    if (!docSnap) {
      result = { user: null, source: null };
    } else {
      result = {
        user: trimMobileUserProfile(docSnap.data() || {}),
        source: "query",
      };
    }
  }

  profileCache.set(normalizedUid, {
    value: result,
    expiresAt: Date.now() + DEFAULT_CACHE_TTL_MS,
  });

  return result;
}
