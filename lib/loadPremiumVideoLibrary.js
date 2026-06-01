import { normalizeLocale } from "./courses";
import { getAdminDb } from "./firebaseAdmin";
import {
  isVideoCreatedBeforePremiumSpotlightCutoff,
  isVideoPublishScheduled,
  rowHasValidEmbedForLocale,
} from "./videoLibraryPublic";
import { sortVideoDocsForPublic } from "./videoLibrarySort";
import {
  mapVideoRowToPublicDto,
} from "./videoLibraryPublicMapper";

const COLLECTION = "videosVideoModule";
const CACHE_COLLECTION = "internalCaches";
const PUBLIC_CACHE_DOC_ID = "videoLibraryPublic";
const PUBLIC_CACHE_CHUNK_PREFIX = "videoLibraryPublic__chunk_";
const PUBLIC_CACHE_VERSION = 1;
const INTERNAL_DOC_IDS = new Set(["_meta"]);
const PUBLIC_CACHE_DOC_MAX_BYTES = 900_000;
const DEFAULT_CACHE_TTL_MS = 5 * 60 * 1000;
const cacheTtlMs = Number.parseInt(process.env.VIDEO_LIBRARY_CACHE_TTL_MS || "", 10);
const VIDEO_LIBRARY_CACHE_TTL_MS =
  Number.isFinite(cacheTtlMs) && cacheTtlMs > 0 ? cacheTtlMs : DEFAULT_CACHE_TTL_MS;

let publishedRowsCache = {
  expiresAt: 0,
  promise: null,
  rows: null,
};

function normalizeCachedRows(value) {
  if (!Array.isArray(value)) return null;
  return value
    .filter((row) => row && typeof row === "object" && typeof row.id === "string" && row.id.trim())
    .map((row) => ({
      ...row,
      id: row.id.trim(),
    }));
}

function estimateJsonBytes(value) {
  try {
    return Buffer.byteLength(JSON.stringify(value), "utf8");
  } catch (_) {
    return Number.POSITIVE_INFINITY;
  }
}

function toChunkDocId(index) {
  return `${PUBLIC_CACHE_CHUNK_PREFIX}${index}`;
}

function splitRowsIntoChunks(rows, maxChunkBytes) {
  const chunks = [];
  let currentRows = [];
  let currentBytes = 2; // [] wrapper

  for (const row of rows) {
    const rowBytes = estimateJsonBytes(row);
    if (rowBytes > maxChunkBytes) {
      throw new Error(
        `Public video cache row is too large for chunking (doc id: ${row?.id || "unknown"}, bytes: ${rowBytes}).`
      );
    }

    const separatorBytes = currentRows.length === 0 ? 0 : 1; // comma
    if (currentBytes + separatorBytes + rowBytes > maxChunkBytes) {
      chunks.push(currentRows);
      currentRows = [row];
      currentBytes = 2 + rowBytes;
    } else {
      currentRows.push(row);
      currentBytes += separatorBytes + rowBytes;
    }
  }

  if (currentRows.length > 0) {
    chunks.push(currentRows);
  }
  return chunks;
}

async function rebuildMaterializedRows(db) {
  const snap = await db.collection(COLLECTION).where("isPublished", "==", true).get();
  const rows = [];
  snap.forEach((docSnap) => {
    if (INTERNAL_DOC_IDS.has(docSnap.id)) return;
    rows.push({ id: docSnap.id, ...(docSnap.data() || {}) });
  });
  const sortedRows = sortVideoDocsForPublic(rows);
  const rowChunks = splitRowsIntoChunks(sortedRows, PUBLIC_CACHE_DOC_MAX_BYTES);
  const chunkDocIds = rowChunks.map((_, index) => toChunkDocId(index));

  const manifestPayload = {
    version: PUBLIC_CACHE_VERSION,
    updatedAt: new Date(),
    rowCount: sortedRows.length,
    chunkCount: chunkDocIds.length,
    chunkDocIds,
  };

  const writeOps = chunkDocIds.map((docId, index) =>
    db.collection(CACHE_COLLECTION).doc(docId).set(
      {
        version: PUBLIC_CACHE_VERSION,
        index,
        rowCount: rowChunks[index].length,
        rows: rowChunks[index],
      },
      { merge: false }
    )
  );
  await Promise.all(writeOps);
  await db.collection(CACHE_COLLECTION).doc(PUBLIC_CACHE_DOC_ID).set(manifestPayload, {
    merge: false,
  });

  publishedRowsCache = {
    rows: sortedRows,
    expiresAt: Date.now() + VIDEO_LIBRARY_CACHE_TTL_MS,
    promise: null,
  };
  return sortedRows;
}

export async function rebuildPremiumVideoLibraryMaterializedCache() {
  return rebuildMaterializedRows(getAdminDb());
}

function normalizePublishedVideoRow(docSnap) {
  if (!docSnap?.exists) return null;
  if (INTERNAL_DOC_IDS.has(docSnap.id)) return null;
  const row = { id: docSnap.id, ...(docSnap.data() || {}) };
  if (row.isPublished !== true) return null;
  return row;
}

export async function loadPremiumVideoLibraryRowById(videoId) {
  const id = typeof videoId === "string" ? videoId.trim() : "";
  if (!id || INTERNAL_DOC_IDS.has(id)) return null;

  const db = getAdminDb();
  const snap = await db.collection(COLLECTION).doc(id).get();
  return normalizePublishedVideoRow(snap);
}

export async function loadPremiumVideoRelatedRows({
  category,
  excludeId,
  locale,
  limit = 12,
  nowMs = Date.now(),
}) {
  const catTrim = typeof category === "string" ? category.trim() : "";
  const exclude = typeof excludeId === "string" ? excludeId.trim() : "";
  if (!catTrim) return [];

  const localeNorm = normalizeLocale(typeof locale === "string" ? locale : undefined, "ro");
  const db = getAdminDb();
  const queryLimit = Math.max(limit + 1, limit + 5);

  try {
    const snap = await db
      .collection(COLLECTION)
      .where("isPublished", "==", true)
      .where("category", "==", catTrim)
      .limit(queryLimit)
      .get();

    const rows = [];
    snap.forEach((docSnap) => {
      if (docSnap.id === exclude) return;
      const row = normalizePublishedVideoRow(docSnap);
      if (row) rows.push(row);
    });

    return sortVideoDocsForPublic(rows)
      .filter(
        (row) =>
          !isVideoPublishScheduled(row.publishAt, nowMs) &&
          rowHasValidEmbedForLocale(row, localeNorm)
      )
      .slice(0, limit);
  } catch (error) {
    console.warn("[video-library] related query failed, returning empty", error?.message || error);
    return [];
  }
}

async function fetchPublishedVideoRows() {
  const db = getAdminDb();
  const manifestSnap = await db.collection(CACHE_COLLECTION).doc(PUBLIC_CACHE_DOC_ID).get();
  if (manifestSnap.exists) {
    const manifest = manifestSnap.data() || {};
    const chunkDocIds = Array.isArray(manifest.chunkDocIds) ? manifest.chunkDocIds : [];
    if (manifest.version === PUBLIC_CACHE_VERSION && chunkDocIds.length > 0) {
      const chunkSnaps = await Promise.all(
        chunkDocIds.map((chunkId) => db.collection(CACHE_COLLECTION).doc(chunkId).get())
      );
      const rowsFromChunks = [];
      for (const chunkSnap of chunkSnaps) {
        if (!chunkSnap.exists) {
          rowsFromChunks.length = 0;
          break;
        }
        const chunkData = chunkSnap.data() || {};
        if (chunkData.version !== PUBLIC_CACHE_VERSION) {
          rowsFromChunks.length = 0;
          break;
        }
        const normalized = normalizeCachedRows(chunkData.rows);
        if (!normalized) {
          rowsFromChunks.length = 0;
          break;
        }
        rowsFromChunks.push(...normalized);
      }
      if (rowsFromChunks.length > 0) {
        return rowsFromChunks;
      }
    }
    if (manifest.version === PUBLIC_CACHE_VERSION && manifest.rowCount === 0) {
      return [];
    }
  }
  return rebuildMaterializedRows(db);
}

export async function loadPremiumVideoLibraryRows() {
  const now = Date.now();
  if (publishedRowsCache.rows && publishedRowsCache.expiresAt > now) {
    return publishedRowsCache.rows;
  }

  if (!publishedRowsCache.promise) {
    publishedRowsCache.promise = fetchPublishedVideoRows()
      .then((rows) => {
        publishedRowsCache = {
          rows,
          expiresAt: Date.now() + VIDEO_LIBRARY_CACHE_TTL_MS,
          promise: null,
        };
        return rows;
      })
      .catch((err) => {
        publishedRowsCache.promise = null;
        throw err;
      });
  }

  return publishedRowsCache.promise;
}

/**
 * Published video library as public DTOs (same shape as GET /api/premium/video-library).
 *
 * @param {{ locale?: string; premiumActive: boolean; previewLimit?: number | null; premiumSpotlightOnly?: boolean }} opts
 * When previewLimit is a positive number, only that many clips are returned (same newest-first order as /videouri).
 */
export async function loadPremiumVideoLibraryVideos({
  locale,
  premiumActive,
  previewLimit = null,
  premiumSpotlightOnly = false,
}) {
  const localeNorm = normalizeLocale(typeof locale === "string" ? locale : undefined, "ro");
  const nowMs = Date.now();
  const sortedRows = await loadPremiumVideoLibraryRows();
  let playable = sortedRows.filter(
    (row) =>
      !isVideoPublishScheduled(row.publishAt, nowMs) &&
      rowHasValidEmbedForLocale(row, localeNorm)
  );

  if (premiumSpotlightOnly) {
    playable = playable.filter(
      (row) =>
        row.isPremium === true &&
        !isVideoCreatedBeforePremiumSpotlightCutoff(row),
    );
  }

  if (previewLimit != null && previewLimit > 0) {
    playable = playable.slice(0, previewLimit);
  }

  return playable.map((row) =>
    mapVideoRowToPublicDto(row, { locale: localeNorm, premiumActive })
  );
}
