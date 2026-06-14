import { getAdminDb } from "./firebaseAdmin";
import {
  recordFirestoreCacheHit,
  withFirestoreCostLog,
} from "./firestoreCostLogger";

const COLLECTION = "courses";

/** Override via COURSES_CACHE_TTL_MS (default 5 minutes). */
const DEFAULT_CACHE_TTL_MS = 5 * 60 * 1000;
const parsedCacheTtlMs = Number.parseInt(process.env.COURSES_CACHE_TTL_MS || "", 10);
const COURSES_CACHE_TTL_MS =
  Number.isFinite(parsedCacheTtlMs) && parsedCacheTtlMs > 0
    ? parsedCacheTtlMs
    : DEFAULT_CACHE_TTL_MS;

let candidatesCache = {
  rows: null,
  expiresAt: 0,
  promise: null,
};

async function fetchCandidatesFromFirestore({ page, queryName }) {
  const db = getAdminDb();
  try {
    const snapshot = await withFirestoreCostLog(
      { page, queryName },
      () =>
        db
          .collection(COLLECTION)
          .where("status", "in", ["published", "scheduled"])
          .orderBy("updatedAt", "desc")
          .get()
    );
    return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
  } catch (error) {
    console.warn("[courses.cache] candidates_query_fallback", {
      message: error?.message || "unknown_error",
    });
    const fallbackSnapshot = await withFirestoreCostLog(
      { page, queryName: "courses.updated_fallback" },
      () => db.collection(COLLECTION).orderBy("updatedAt", "desc").get()
    );
    return fallbackSnapshot.docs
      .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
      .filter((course) => course.status === "published" || course.status === "scheduled");
  }
}

/**
 * Shared, short-lived in-memory cache of the visible course candidates
 * (`status in [published, scheduled]`, ordered by `updatedAt desc`).
 *
 * Returns the same raw candidate shape the route handlers previously fetched
 * directly, so downstream visibility filtering / `toSafeCourse` mapping
 * produces identical field-level output. `page`/`queryName` are used purely
 * for cost telemetry so existing analytics lines stay attributed.
 */
export async function loadVisibleCourseCandidates({ page, queryName } = {}) {
  const now = Date.now();
  if (candidatesCache.rows && candidatesCache.expiresAt > now) {
    recordFirestoreCacheHit({ page, queryName });
    return candidatesCache.rows;
  }

  if (!candidatesCache.promise) {
    candidatesCache.promise = fetchCandidatesFromFirestore({ page, queryName })
      .then((rows) => {
        candidatesCache = {
          rows,
          expiresAt: Date.now() + COURSES_CACHE_TTL_MS,
          promise: null,
        };
        return rows;
      })
      .catch((error) => {
        candidatesCache.promise = null;
        throw error;
      });
  }

  return candidatesCache.promise;
}

export function clearVisibleCourseCandidatesCache() {
  candidatesCache = { rows: null, expiresAt: 0, promise: null };
}
