import { getAdminDb } from "./firebaseAdmin";

/**
 * Server-side cache for the Expo read-telemetry config stored in
 * `AppConfig/ReadTelemetry`. The doc may set:
 *   - `enabled` (boolean, default true)
 *   - `sampleRate` (0..1, default 0.1)
 *   - `flushIntervalSec` (positive integer, default 60)
 *   - `includeRealtimeSubscriptions` (boolean, default true)
 *
 * Mobile clients receive the normalized config in the response of
 * `POST /api/mobile/firestore-read-telemetry` so that sampling/flush behavior
 * can be tuned without an app update.
 */

const CONFIG_DOC_PATH = "AppConfig/ReadTelemetry";
const CONFIG_TTL_MS = 60 * 1000;

const DEFAULT_CONFIG = Object.freeze({
  enabled: true,
  sampleRate: 0.1,
  flushIntervalSec: 60,
  includeRealtimeSubscriptions: true,
});

let cachedConfig = null;
let cachedAt = 0;
let pendingFetch = null;

function normalizeConfig(snapshotData) {
  if (!snapshotData || typeof snapshotData !== "object") {
    return { ...DEFAULT_CONFIG };
  }

  const enabled = snapshotData.enabled !== false;

  const rawSampleRate = Number(snapshotData.sampleRate);
  const sampleRate =
    Number.isFinite(rawSampleRate) && rawSampleRate > 0
      ? Math.min(rawSampleRate, 1)
      : DEFAULT_CONFIG.sampleRate;

  const rawFlush = Number(snapshotData.flushIntervalSec);
  const flushIntervalSec =
    Number.isFinite(rawFlush) && rawFlush > 0
      ? Math.floor(rawFlush)
      : DEFAULT_CONFIG.flushIntervalSec;

  const includeRealtimeSubscriptions =
    snapshotData.includeRealtimeSubscriptions !== false;

  return { enabled, sampleRate, flushIntervalSec, includeRealtimeSubscriptions };
}

export async function getReadTelemetryConfig({ force = false } = {}) {
  if (!force && cachedConfig && Date.now() - cachedAt < CONFIG_TTL_MS) {
    return cachedConfig;
  }

  if (pendingFetch) {
    return pendingFetch;
  }

  pendingFetch = (async () => {
    try {
      const snapshot = await getAdminDb().doc(CONFIG_DOC_PATH).get();
      cachedConfig = normalizeConfig(snapshot.exists ? snapshot.data() : null);
    } catch (error) {
      console.warn(
        "[readTelemetryConfigCache] Failed to load AppConfig/ReadTelemetry, falling back to defaults",
        { message: error?.message || String(error) }
      );
      cachedConfig = { ...DEFAULT_CONFIG };
    } finally {
      cachedAt = Date.now();
      pendingFetch = null;
    }
    return cachedConfig;
  })();

  return pendingFetch;
}

export function invalidateReadTelemetryConfigCache() {
  cachedConfig = null;
  cachedAt = 0;
}

export const READ_TELEMETRY_DEFAULT_CONFIG = DEFAULT_CONFIG;
