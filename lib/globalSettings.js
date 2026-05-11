import { getAdminDb } from "./firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";

const SETTINGS_COLLECTION = "settings";
const GLOBAL_DOC_ID = "global";

const DEFAULT_SETTINGS = {
  subscriptionSystemEnabled: true,
};

/**
 * Get global settings from Firestore.
 * Returns default values merged with stored values.
 * @returns {Promise<{ subscriptionSystemEnabled: boolean, updatedAt?: Date, updatedBy?: string }>}
 */
export async function getGlobalSettings() {
  const db = getAdminDb();
  const docRef = db.collection(SETTINGS_COLLECTION).doc(GLOBAL_DOC_ID);
  const docSnap = await docRef.get();

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

  return { ok: true };
}
