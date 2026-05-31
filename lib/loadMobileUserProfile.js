import { getAdminDb } from "./firebaseAdmin";
import { withFirestoreCostLog } from "./firestoreCostLogger";

const USERS_COLLECTION = "Users";

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

/**
 * Load the authenticated user's profile from Firestore (Admin SDK).
 * Tries Users/{uid} first, then owner_uid query — same strategy as requireAdmin.
 *
 * @param {string} uid Firebase Auth uid
 * @returns {Promise<{ user: object|null, source: "doc"|"query"|null }>}
 */
export async function loadMobileUserProfile(uid) {
  const normalizedUid = typeof uid === "string" ? uid.trim() : "";
  if (!normalizedUid) {
    return { user: null, source: null };
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

  if (directSnap.exists) {
    return {
      user: serializeFirestoreValue(directSnap.data() || {}),
      source: "doc",
    };
  }

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
    return { user: null, source: null };
  }

  return {
    user: serializeFirestoreValue(docSnap.data() || {}),
    source: "query",
  };
}
