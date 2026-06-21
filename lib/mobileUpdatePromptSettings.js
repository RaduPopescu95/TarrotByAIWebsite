import { getAdminDb } from "./firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";
import { compareAppVersions, normalizeAppVersion } from "./appVersionCompare";

const COLLECTION = "ShouldUpdate";
/** Document id kept for compatibility with expo-mobile-app (Tarot / Mesaje magice / Noroc screens). */
const DOC_ID = "unicde";
const STATUS_CACHE_TTL_MS = 15 * 60 * 1000;

let cachedStatus = {
  expiresAt: 0,
  value: null,
};

export { normalizeAppVersion, compareAppVersions } from "./appVersionCompare";

export function clearMobileUpdateStatusCache() {
  cachedStatus = {
    expiresAt: 0,
    value: null,
  };
}

function readMinAppVersionFields(data = {}) {
  return {
    minAppVersionIos: normalizeAppVersion(data.minAppVersionIos),
    minAppVersionAndroid: normalizeAppVersion(data.minAppVersionAndroid),
  };
}

function buildStatusValue(data = {}) {
  return {
    update: data.update === true,
    forceUpdate: data.forceUpdate === true,
    ...readMinAppVersionFields(data),
  };
}

/**
 * @param {unknown} value
 * @returns {"ios" | "android" | null}
 */
export function normalizeMobilePlatform(value) {
  if (typeof value !== "string") {
    return null;
  }
  const normalized = value.trim().toLowerCase();
  if (normalized === "ios" || normalized === "android") {
    return normalized;
  }
  return null;
}

/**
 * @param {{
 *   update?: boolean;
 *   forceUpdate?: boolean;
 *   minAppVersionIos?: string | null;
 *   minAppVersionAndroid?: string | null;
 *   platform?: string | null;
 *   appVersion?: string | null;
 * }} input
 * @returns {{ showUpdatePrompt: boolean; forceUpdate: boolean }}
 */
export function resolveMobileUpdatePrompt(input = {}) {
  const update = input.update === true;
  const forceUpdate = input.forceUpdate === true;

  if (!update && !forceUpdate) {
    return { showUpdatePrompt: false, forceUpdate: false };
  }

  const platform = normalizeMobilePlatform(input.platform);
  const normalizedAppVersion = normalizeAppVersion(input.appVersion);
  const minAppVersionIos = normalizeAppVersion(input.minAppVersionIos);
  const minAppVersionAndroid = normalizeAppVersion(input.minAppVersionAndroid);

  if (!platform) {
    return {
      showUpdatePrompt: Boolean(update || forceUpdate),
      forceUpdate,
    };
  }

  const minForPlatform =
    platform === "ios" ? minAppVersionIos : minAppVersionAndroid;

  if (forceUpdate && !minForPlatform) {
    return { showUpdatePrompt: false, forceUpdate: false };
  }

  if (!normalizedAppVersion) {
    return {
      showUpdatePrompt: true,
      forceUpdate,
    };
  }

  if (minForPlatform && compareAppVersions(normalizedAppVersion, minForPlatform) >= 0) {
    return { showUpdatePrompt: false, forceUpdate: false };
  }

  return {
    showUpdatePrompt: true,
    forceUpdate,
  };
}

/**
 * Single Firestore read for ShouldUpdate/unicde (cached 15 min in memory).
 * @returns {Promise<{
 *   update: boolean;
 *   forceUpdate: boolean;
 *   minAppVersionIos: string | null;
 *   minAppVersionAndroid: string | null;
 * }>}
 */
export async function loadMobileUpdateStatus({ bypassCache = false } = {}) {
  const now = Date.now();
  if (!bypassCache && cachedStatus.value && cachedStatus.expiresAt > now) {
    return cachedStatus.value;
  }

  const db = getAdminDb();
  const snap = await db.collection(COLLECTION).doc(DOC_ID).get();
  if (!snap.exists) {
    const value = buildStatusValue({});
    cachedStatus = { value, expiresAt: now + STATUS_CACHE_TTL_MS };
    return value;
  }

  const value = buildStatusValue(snap.data() || {});
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
 * @param {{ ios?: string | null; android?: string | null }} versions
 * @param {string} [updatedBy="dashboard"]
 */
export async function setMobileMinAppVersions(versions = {}, updatedBy = "dashboard") {
  const ios = versions.ios === null ? null : normalizeAppVersion(versions.ios);
  const android = versions.android === null ? null : normalizeAppVersion(versions.android);

  if (versions.ios !== undefined && versions.ios !== null && !ios) {
    throw new Error("invalid_min_app_version_ios");
  }
  if (versions.android !== undefined && versions.android !== null && !android) {
    throw new Error("invalid_min_app_version_android");
  }

  const db = getAdminDb();
  const docRef = db.collection(COLLECTION).doc(DOC_ID);
  const payload = {
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy,
  };

  if (versions.ios !== undefined) {
    payload.minAppVersionIos = ios;
  }
  if (versions.android !== undefined) {
    payload.minAppVersionAndroid = android;
  }

  await docRef.set(payload, { merge: true });
  clearMobileUpdateStatusCache();
  return { ok: true };
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
  await docRef.set(payload, { merge: true });
  clearMobileUpdateStatusCache();
  return { ok: true };
}

/**
 * @param {{
 *   forceUpdateEnabled: boolean;
 *   minAppVersionIos?: string | null;
 *   minAppVersionAndroid?: string | null;
 * }} input
 */
export function validateForceUpdateMinVersions(input = {}) {
  if (input.forceUpdateEnabled !== true) {
    return { ok: true };
  }

  const ios = normalizeAppVersion(input.minAppVersionIos);
  const android = normalizeAppVersion(input.minAppVersionAndroid);

  if (!ios || !android) {
    return {
      ok: false,
      error:
        "Pentru force update trebuie setate versiunile minime iOS și Android (ex. 2.3.0).",
    };
  }

  return { ok: true, minAppVersionIos: ios, minAppVersionAndroid: android };
}
