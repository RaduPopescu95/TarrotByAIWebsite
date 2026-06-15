import { getAdminDb } from "../firebaseAdmin";
import {
  recordFirestoreCacheHit,
  withFirestoreCostLog,
} from "../firestoreCostLogger";
import {
  COLLECTION,
  computeNextPartnerPromotionChangeAtMs,
  filterPublicPartnerPromotions,
  serializePartnerPromotionRow,
} from "./partnerPromotions.service";

const CACHE_COLLECTION = "internalCaches";
const CACHE_DOC_ID = "partnerPromotionsPublic";
const CACHE_VERSION = 1;
const DEFAULT_CACHE_TTL_MS = 5 * 60 * 1000;
const parsedTtl = Number.parseInt(process.env.PARTNER_PROMOTIONS_CACHE_TTL_MS || "", 10);
const CACHE_TTL_MS =
  Number.isFinite(parsedTtl) && parsedTtl > 0 ? parsedTtl : DEFAULT_CACHE_TTL_MS;

let memoryCache = {
  expiresAt: 0,
  promise: null,
  rows: null,
  nextChangeAtMs: null,
};

export function clearPartnerPromotionsMemoryCache() {
  memoryCache = {
    expiresAt: 0,
    promise: null,
    rows: null,
    nextChangeAtMs: null,
  };
}

async function loadAllPartnerPromotionRows(db) {
  const snap = await withFirestoreCostLog(
    { page: "api.partner-promotions", queryName: "partnerPromotions.all" },
    () => db.collection(COLLECTION).get()
  );
  const rows = [];
  snap.forEach((docSnap) => {
    const row = serializePartnerPromotionRow(docSnap);
    if (row) rows.push(row);
  });
  rows.sort((a, b) => {
    const orderA = typeof a.sortOrder === "number" ? a.sortOrder : 0;
    const orderB = typeof b.sortOrder === "number" ? b.sortOrder : 0;
    if (orderA !== orderB) return orderA - orderB;
    return String(a.name || "").localeCompare(String(b.name || ""));
  });
  return rows;
}

export async function rebuildPartnerPromotionsMaterializedCache() {
  const db = getAdminDb();
  const rows = await loadAllPartnerPromotionRows(db);
  const nextChangeAtMs = computeNextPartnerPromotionChangeAtMs(rows);
  await db.collection(CACHE_COLLECTION).doc(CACHE_DOC_ID).set(
    {
      version: CACHE_VERSION,
      updatedAt: new Date(),
      rowCount: rows.length,
      rows,
      nextChangeAtMs: nextChangeAtMs ?? null,
    },
    { merge: false }
  );
  memoryCache = {
    rows,
    nextChangeAtMs: nextChangeAtMs ?? null,
    expiresAt: Date.now() + CACHE_TTL_MS,
    promise: null,
  };
  return rows;
}

async function loadCachedRowsFromFirestore(db) {
  const snap = await withFirestoreCostLog(
    {
      page: "api.partner-promotions",
      queryName: "internalCaches.partnerPromotionsPublic",
      operationType: "document",
    },
    () => db.collection(CACHE_COLLECTION).doc(CACHE_DOC_ID).get()
  );
  if (!snap.exists) return null;
  const data = snap.data() || {};
  if (!Array.isArray(data.rows)) return null;
  return {
    rows: data.rows,
    nextChangeAtMs:
      typeof data.nextChangeAtMs === "number" && Number.isFinite(data.nextChangeAtMs)
        ? data.nextChangeAtMs
        : computeNextPartnerPromotionChangeAtMs(data.rows),
  };
}

async function ensurePartnerPromotionRowsLoaded() {
  const now = Date.now();
  if (memoryCache.rows && memoryCache.expiresAt > now) {
    recordFirestoreCacheHit({
      page: "api.partner-promotions",
      queryName: "memory.partnerPromotionsPublic",
    });
    return memoryCache;
  }

  if (!memoryCache.promise) {
    memoryCache.promise = (async () => {
      const db = getAdminDb();
      let cached = await loadCachedRowsFromFirestore(db);
      if (!cached) {
        const rows = await rebuildPartnerPromotionsMaterializedCache();
        cached = {
          rows,
          nextChangeAtMs: computeNextPartnerPromotionChangeAtMs(rows),
        };
      }
      memoryCache = {
        rows: cached.rows,
        nextChangeAtMs: cached.nextChangeAtMs ?? null,
        expiresAt: Date.now() + CACHE_TTL_MS,
        promise: null,
      };
      return memoryCache;
    })().catch((err) => {
      memoryCache.promise = null;
      throw err;
    });
  }

  return memoryCache.promise;
}

export async function loadPartnerPromotionsForPlacement({
  placement,
  locale = "ro",
  nowMs = Date.now(),
} = {}) {
  const state = await ensurePartnerPromotionRowsLoaded();
  const promotions = filterPublicPartnerPromotions(state.rows, {
    placement,
    locale,
    nowMs,
  });
  return {
    placement,
    promotions,
    nextChangeAtMs: state.nextChangeAtMs ?? null,
    generatedAt: new Date(nowMs).toISOString(),
  };
}

export async function listAllPartnerPromotionsAdmin() {
  const db = getAdminDb();
  const snap = await withFirestoreCostLog(
    { page: "api.admin.partner-promotions", queryName: "partnerPromotions.all" },
    () => db.collection(COLLECTION).get()
  );
  const rows = [];
  snap.forEach((docSnap) => {
    const row = serializePartnerPromotionRow(docSnap);
    if (row) rows.push(row);
  });
  return rows.sort((a, b) => {
    const orderA = typeof a.sortOrder === "number" ? a.sortOrder : 0;
    const orderB = typeof b.sortOrder === "number" ? b.sortOrder : 0;
    if (orderA !== orderB) return orderA - orderB;
    return String(a.name || "").localeCompare(String(b.name || ""));
  });
}

export async function getPartnerPromotionAdminById(id) {
  const trimmed = typeof id === "string" ? id.trim() : "";
  if (!trimmed) return null;
  const db = getAdminDb();
  const snap = await withFirestoreCostLog(
    {
      page: "api.admin.partner-promotions",
      queryName: "partnerPromotions.by_id",
      operationType: "document",
    },
    () => db.collection(COLLECTION).doc(trimmed).get()
  );
  return serializePartnerPromotionRow(snap);
}
