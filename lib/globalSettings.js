import { getAdminDb } from "./firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";
import {
  recordFirestoreCacheHit,
  withFirestoreCostLog,
} from "./firestoreCostLogger";

const SETTINGS_COLLECTION = "settings";
const GLOBAL_DOC_ID = "global";

const DEFAULT_SETTINGS = {
  subscriptionSystemEnabled: true,
};

/** Override via GLOBAL_SETTINGS_CACHE_TTL_MS (default 5 minutes). */
const DEFAULT_SETTINGS_TTL_MS = 5 * 60 * 1000;
const parsedSettingsTtlMs = Number.parseInt(
  process.env.GLOBAL_SETTINGS_CACHE_TTL_MS || "",
  10
);
const GLOBAL_SETTINGS_CACHE_TTL_MS =
  Number.isFinite(parsedSettingsTtlMs) && parsedSettingsTtlMs > 0
    ? parsedSettingsTtlMs
    : DEFAULT_SETTINGS_TTL_MS;

let settingsCache = {
  value: null,
  expiresAt: 0,
  promise: null,
};

function clearGlobalSettingsCache() {
  settingsCache = { value: null, expiresAt: 0, promise: null };
}

async function fetchGlobalSettings() {
  const db = getAdminDb();
  const docRef = db.collection(SETTINGS_COLLECTION).doc(GLOBAL_DOC_ID);
  const docSnap = await withFirestoreCostLog(
    {
      page: "api.global-settings",
      queryName: "settings.global",
      operationType: "document",
    },
    () => docRef.get()
  );

  if (!docSnap.exists) {
    return { ...DEFAULT_SETTINGS };
  }

  const data = docSnap.data() || {};
  return {
    subscriptionSystemEnabled:
      typeof data.subscriptionSystemEnabled === "boolean"
        ? data.subscriptionSystemEnabled
        : DEFAULT_SETTINGS.subscriptionSystemEnabled,
    updatedAt: data.updatedAt?.toDate?.() || null,
    updatedBy: data.updatedBy || null,
  };
}

/**
 * Get global settings from Firestore.
 * Returns default values merged with stored values.
 *
 * Backed by a short-lived in-memory cache so the rarely-changing global flag
 * is not re-read from Firestore on every premium request. The returned object
 * shape is identical to a direct read.
 * @returns {Promise<{ subscriptionSystemEnabled: boolean, updatedAt?: Date, updatedBy?: string }>}
 */
export async function getGlobalSettings() {
  const now = Date.now();
  if (settingsCache.value && settingsCache.expiresAt > now) {
    recordFirestoreCacheHit({
      page: "api.global-settings",
      queryName: "settings.global",
    });
    return settingsCache.value;
  }

  if (!settingsCache.promise) {
    settingsCache.promise = fetchGlobalSettings()
      .then((value) => {
        settingsCache = {
          value,
          expiresAt: Date.now() + GLOBAL_SETTINGS_CACHE_TTL_MS,
          promise: null,
        };
        return value;
      })
      .catch((error) => {
        settingsCache.promise = null;
        throw error;
      });
  }

  return settingsCache.promise;
}

/**
 * Check if subscription system is enabled.
 * Optimized single-field read for use in API routes.
 * @returns {Promise<boolean>}
 */
export async function isSubscriptionSystemEnabled() {
  const settings = await getGlobalSettings();
  return settings.subscriptionSystemEnabled;
}

/**
 * Update global settings.
 * @param {{ subscriptionSystemEnabled?: boolean }} updates
 * @param {string} [updatedBy="dashboard"]
 * @returns {Promise<{ ok: boolean }>}
 */
export async function updateGlobalSettings(updates, updatedBy = "dashboard") {
  const db = getAdminDb();
  const docRef = db.collection(SETTINGS_COLLECTION).doc(GLOBAL_DOC_ID);

  const payload = {
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy,
  };

  if (typeof updates.subscriptionSystemEnabled === "boolean") {
    payload.subscriptionSystemEnabled = updates.subscriptionSystemEnabled;
  }

  await docRef.set(payload, { merge: true });

  clearGlobalSettingsCache();

  return { ok: true };
}
