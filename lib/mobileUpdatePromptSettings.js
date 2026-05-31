import { getAdminDb } from "./firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";

const COLLECTION = "ShouldUpdate";
/** Document id kept for compatibility with expo-mobile-app (Tarot / Mesaje magice / Noroc screens). */
const DOC_ID = "unicde";
const STATUS_CACHE_TTL_MS = 15 * 60 * 1000;

let cachedStatus = {
  expiresAt: 0,
  value: null,
};

export function clearMobileUpdateStatusCache() {
  cachedStatus = {
    expiresAt: 0,
    value: null,
  };
}

/**
 * Single Firestore read for ShouldUpdate/unicde (cached 15 min in memory).
 * @returns {Promise<{ update: boolean, forceUpdate: boolean }>}
 */
export async function loadMobileUpdateStatus({ bypassCache = false } = {}) {
  const now = Date.now();
  if (!bypassCache && cachedStatus.value && cachedStatus.expiresAt > now) {
    return cachedStatus.value;
  }

  const db = getAdminDb();
  const snap = await db.collection(COLLECTION).doc(DOC_ID).get();
  if (!snap.exists) {
    const value = { update: false, forceUpdate: false };
    cachedStatus = { value, expiresAt: now + STATUS_CACHE_TTL_MS };
    return value;
  }

  const data = snap.data() || {};
  const value = {
    update: data.update === true,
    forceUpdate: data.forceUpdate === true,
  };
  cachedStatus = { value, expiresAt: now + STATUS_CACHE_TTL_MS };
  return value;
}

/**
 * Whether the mobile app should show the update prompt modal (Firestore field `update`).
 * @returns {Promise<boolean>}
 */
export async function getMobileUpdatePromptEnabled() {
  const status = await loadMobileUpdateStatus();
  return status.update;
}

/**
 * Whether the mobile app should enforce force update modal (Firestore field `forceUpdate`).
 * @returns {Promise<boolean>}
 */
export async function getMobileForceUpdateEnabled() {
  const status = await loadMobileUpdateStatus();
  return status.forceUpdate;
}

/**
 * @param {boolean} enabled
 * @param {string} [updatedBy="dashboard"]
 */
export async function setMobileUpdatePromptEnabled(enabled, updatedBy = "dashboard") {
  const db = getAdminDb();
  const docRef = db.collection(COLLECTION).doc(DOC_ID);
  const payload = {
    update: Boolean(enabled),
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy,
  };
  if (!enabled) {
    payload.forceUpdate = false;
  }
  await docRef.set(payload, { merge: true });
  clearMobileUpdateStatusCache();
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
  clearMobileUpdateStatusCache();
  return { ok: true };
}
