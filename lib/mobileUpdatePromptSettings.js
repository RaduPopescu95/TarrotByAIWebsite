import { getAdminDb } from "./firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";

const COLLECTION = "ShouldUpdate";
/** Document id kept for compatibility with expo-mobile-app (Tarot / Mesaje magice / Noroc screens). */
const DOC_ID = "unicde";

/**
 * Whether the mobile app should show the update prompt modal (Firestore field `update`).
 * @returns {Promise<boolean>}
 */
export async function getMobileUpdatePromptEnabled() {
  const db = getAdminDb();
  const snap = await db.collection(COLLECTION).doc(DOC_ID).get();
  if (!snap.exists) {
    return false;
  }
  const data = snap.data() || {};
  return data.update === true;
}

/**
 * Whether the mobile app should enforce force update modal (Firestore field `forceUpdate`).
 * @returns {Promise<boolean>}
 */
export async function getMobileForceUpdateEnabled() {
  const db = getAdminDb();
  const snap = await db.collection(COLLECTION).doc(DOC_ID).get();
  if (!snap.exists) {
    return false;
  }
  const data = snap.data() || {};
  return data.forceUpdate === true;
}

/**
 * @param {boolean} enabled
 * @param {string} [updatedBy="dashboard"]
 */
export async function setMobileUpdatePromptEnabled(enabled, updatedBy = "dashboard") {
  const db = getAdminDb();
  const docRef = db.collection(COLLECTION).doc(DOC_ID);
  await docRef.set(
    {
      update: Boolean(enabled),
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy,
    },
    { merge: true }
  );
  return { ok: true };
}

/**
 * @param {boolean} enabled
 * @param {string} [updatedBy="dashboard"]
 */
export async function setMobileForceUpdateEnabled(enabled, updatedBy = "dashboard") {
  const db = getAdminDb();
  const docRef = db.collection(COLLECTION).doc(DOC_ID);
  const payload = {
    forceUpdate: Boolean(enabled),
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy,
  };
  if (enabled) {
    payload.update = true;
  }
  await docRef.set(
    payload,
    { merge: true }
  );
  return { ok: true };
}
