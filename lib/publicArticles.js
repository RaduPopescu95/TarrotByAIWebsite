import { Timestamp } from "firebase-admin/firestore";
import { getAdminDb } from "./firebaseAdmin";
import {
  recordFirestoreCacheHit,
  withFirestoreCostLog,
} from "./firestoreCostLogger";
import { buildScheduledDate, toDateFromUnknown } from "./articleSchedule";

const COLLECTION = "BlogArticole";
const CACHE_COLLECTION = "internalCaches";
const CACHE_DOC_ID = "articlesPublic";
const CACHE_CHUNK_PREFIX = "articlesPublic__chunk_";
const CACHE_VERSION = 1;
const CACHE_DOC_MAX_BYTES = 900_000;
// Firestore hard per-document limit is ~1,048,576 bytes. A single oversized row
// is allowed to occupy its own chunk up to this ceiling (leaving headroom for
// Firestore field overhead). Anything above is skipped so it can't take down the
// entire articles catalog.
const CACHE_DOC_HARD_LIMIT_BYTES = 1_000_000;
/**
 * How often (ms) we check Firestore's manifest doc to see if chunks need
 * re-fetching. Default 30s. Backward-compatible alias:
 * `ARTICLES_PUBLIC_CACHE_TTL_MS`.
 *
 * Behaviour:
 *  - request within window of last verification → return memory rows (0 reads)
 *  - request after window → read manifest only (1 read); refetch chunks only
 *    if `manifest.updatedAt` changed (rare: dashboard edit/upload/delete).
 */
const DEFAULT_MANIFEST_VERIFY_INTERVAL_MS = 30 * 1000;
const parsedManifestVerifyMs = Number.parseInt(
  process.env.ARTICLES_MANIFEST_VERIFY_INTERVAL_MS
    || process.env.ARTICLES_PUBLIC_CACHE_TTL_MS
    || "",
  10
);
const MANIFEST_VERIFY_INTERVAL_MS =
  Number.isFinite(parsedManifestVerifyMs) && parsedManifestVerifyMs > 0
    ? parsedManifestVerifyMs
    : DEFAULT_MANIFEST_VERIFY_INTERVAL_MS;

/**
 * Maximum number of chunks to load from Firestore cache on cold start /
 * manifest-change refetch. Articles are sorted newest-first, so the first
 * chunks hold the most recent articles. With the current production catalog
 * (~5-6 slim articles per chunk) the default `10` covers the ~50-60 newest
 * articles — enough for the Expo paginated list (DEFAULT_LIMIT=12,
 * MAX_LIMIT=50). Set to 0 or negative to load all chunks (original
 * behaviour).
 * Override via `ARTICLES_MAX_CHUNKS_TO_LOAD`.
 */
const DEFAULT_MAX_CHUNKS_TO_LOAD = 10;
const parsedMaxChunks = Number.parseInt(process.env.ARTICLES_MAX_CHUNKS_TO_LOAD || "", 10);
const MAX_CHUNKS_TO_LOAD =
  Number.isFinite(parsedMaxChunks) ? parsedMaxChunks : DEFAULT_MAX_CHUNKS_TO_LOAD;

const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 50;
const DEFAULT_RELATED_LIMIT = 2;
const MAX_RELATED_LIMIT = 12;

let cachedRowsState = {
  manifestUpdatedAtMs: 0,
  lastVerifiedAtMs: 0,
  rows: null,
  promise: null,
};

/**
 * Normalizes the `updatedAt` field on the manifest document (Firestore
 * Timestamp, native Date, or ISO string) into a comparable epoch-ms value.
 * Returns 0 when nothing usable is present so cache comparisons stay safe.
 */
const getManifestUpdatedAtMs = (manifest) => {
  const updatedAt = manifest?.updatedAt;
  if (!updatedAt) return 0;
  if (typeof updatedAt?.toMillis === "function") {
    const ms = updatedAt.toMillis();
    return Number.isFinite(ms) ? ms : 0;
  }
  if (typeof updatedAt?.toDate === "function") {
    const ms = updatedAt.toDate()?.getTime?.();
    return Number.isFinite(ms) ? ms : 0;
  }
  if (updatedAt instanceof Date) {
    const ms = updatedAt.getTime();
    return Number.isFinite(ms) ? ms : 0;
  }
  const parsed = new Date(updatedAt).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
};

const readSingleQueryValue = (value) => (Array.isArray(value) ? value[0] : value);

export const normalizeArticleLocale = (value, fallback = "ro") => {
  if (typeof value !== "string" || !value.trim()) return fallback;
  const [base] = value.trim().toLowerCase().replace("_", "-").split("-");
  return base || fallback;
};

export const parseArticleLimit = (value, fallback = DEFAULT_LIMIT) => {
  const raw = readSingleQueryValue(value);
  if (raw === undefined || raw === null || raw === "") return fallback;
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed <= 0) return fallback;
  return Math.min(parsed, MAX_LIMIT);
};

export const parseRelatedLimit = (value, fallback = DEFAULT_RELATED_LIMIT) => {
  const raw = readSingleQueryValue(value);
  if (raw === undefined || raw === null || raw === "") return fallback;
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed <= 0) return fallback;
  return Math.min(parsed, MAX_RELATED_LIMIT);
};

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

const normalizeString = (value) => {
  if (value === undefined || value === null) return "";
  return String(value).trim();
};

const normalizeArticleId = (value) => {
  const raw = normalizeString(value);
  return raw || null;
};

const getLocalizedArticleName = (article, locale) => {
  const mappedLocale =
    locale === "hi" ? "hu" : locale === "id" ? "ru" : locale === "ru" ? "rusa" : locale;
  const value = article?.info?.[mappedLocale]?.nume;
  return typeof value === "string" ? value : "";
};

const getLocalizedArticleDescription = (article, locale) => {
  const mappedLocale =
    locale === "hi" ? "hu" : locale === "id" ? "ru" : locale === "ru" ? "rusa" : locale;
  const value = article?.info?.[mappedLocale]?.descriere;
  return typeof value === "string" ? value : "";
};

const resolveArticleSortDate = (article) => {
  const hasScheduledFields =
    typeof article?.dataProgramata === "string" && article.dataProgramata.trim() !== "";

  if (hasScheduledFields) {
    const fromProgram = buildScheduledDate({
      dataProgramata: article.dataProgramata,
      timpProgramat: article.timpProgramat,
      fallbackDate: article?.firstUploadTimestamp || article?.createdAt || null,
    });
    if (fromProgram) return fromProgram;
  }

  return (
    toDateFromUnknown(article?.scheduledAtTs) ||
    buildScheduledDate({
      dataProgramata: article?.dataProgramata,
      timpProgramat: article?.timpProgramat,
      fallbackDate: article?.firstUploadTimestamp || article?.createdAt || null,
    }) ||
    new Date(0)
  );
};

const resolveArticleSortMs = (article) => {
  const dateValue = resolveArticleSortDate(article);
  const ms = dateValue?.getTime?.();
  return Number.isFinite(ms) ? ms : 0;
};

const refreshArticleRowsSchedule = (rows) => {
  const refreshed = rows.map((row) => {
    const scheduledAtMs = resolveArticleSortMs(row);
    return {
      ...row,
      scheduledAtMs,
      scheduledAtTs: new Date(scheduledAtMs).toISOString(),
    };
  });
  refreshed.sort((left, right) => right.scheduledAtMs - left.scheduledAtMs);
  return refreshed;
};

const LIVE_PUBLISHED_AUGMENT_LIMIT = 20;

/** Override via ARTICLES_LIVE_AUGMENT_TTL_MS (default 60s). */
const DEFAULT_LIVE_AUGMENT_TTL_MS = 60 * 1000;
const parsedLiveAugmentTtlMs = Number.parseInt(
  process.env.ARTICLES_LIVE_AUGMENT_TTL_MS || "",
  10
);
const LIVE_AUGMENT_TTL_MS =
  Number.isFinite(parsedLiveAugmentTtlMs) && parsedLiveAugmentTtlMs >= 0
    ? parsedLiveAugmentTtlMs
    : DEFAULT_LIVE_AUGMENT_TTL_MS;

let livePublishedCache = {
  rows: null,
  expiresAt: 0,
  promise: null,
};

// The live-published "augment" exists only as a safety net to surface articles
// that became visible since the last materialized-cache rebuild. Scheduled
// articles are already in the cache (rebuild reads the full collection) and
// appear automatically once their time passes; freshly edited/uploaded ones are
// picked up by the dashboard-triggered rebuild. So the augment page does not
// need to be re-queried on every request — memoizing it for a short TTL keeps
// the exact same merge output while collapsing the per-request read cost.
async function loadLivePublishedRows(nowMs) {
  const now = Date.now();
  if (livePublishedCache.rows && livePublishedCache.expiresAt > now) {
    recordFirestoreCacheHit({
      page: "api.articles",
      queryName: "BlogArticole.publishedPage",
    });
    return livePublishedCache.rows;
  }

  if (!livePublishedCache.promise) {
    livePublishedCache.promise = queryPublishedArticlesPage({
      limit: LIVE_PUBLISHED_AUGMENT_LIMIT,
      cursor: null,
      nowMs,
    })
      .then((pageResult) => {
        livePublishedCache = {
          rows: pageResult.rows,
          expiresAt: Date.now() + LIVE_AUGMENT_TTL_MS,
          promise: null,
        };
        return pageResult.rows;
      })
      .catch((error) => {
        livePublishedCache.promise = null;
        throw error;
      });
  }

  return livePublishedCache.promise;
}

async function augmentRowsWithLivePublished(rows, nowMs) {
  try {
    const liveRows = await loadLivePublishedRows(nowMs);
    const merged = new Map(
      rows
        .map((row) => [normalizeString(row.documentId), row])
        .filter(([documentId]) => documentId)
    );
    for (const row of liveRows) {
      const documentId = normalizeString(row.documentId);
      if (!documentId || merged.has(documentId)) continue;
      merged.set(documentId, row);
    }
    return refreshArticleRowsSchedule([...merged.values()]);
  } catch (error) {
    console.warn("[articles.public] live published augment failed", error?.message || error);
    return refreshArticleRowsSchedule(rows);
  }
};

const isArticlePublishedAt = (article, nowMs) => resolveArticleSortMs(article) <= nowMs;

const extractCategoryKey = (article) => {
  const raw = article?.categorie;
  if (typeof raw === "string" && raw.trim()) return raw.trim();
  const ro = raw?.info?.ro?.nume;
  if (typeof ro === "string" && ro.trim()) return ro.trim();
  return "";
};

/** Resolved category label for filters (string field or legacy nested object). */
export const resolveArticleCategoryKey = extractCategoryKey;

const estimateJsonBytes = (value) => {
  try {
    return Buffer.byteLength(JSON.stringify(value), "utf8");
  } catch (_) {
    return Number.POSITIVE_INFINITY;
  }
};

const toChunkDocId = (index) => `${CACHE_CHUNK_PREFIX}${index}`;

const splitRowsIntoChunks = (rows, maxChunkBytes) => {
  const chunks = [];
  let currentRows = [];
  let currentBytes = 2;

  const flushCurrent = () => {
    if (currentRows.length > 0) {
      chunks.push(currentRows);
      currentRows = [];
      currentBytes = 2;
    }
  };

  for (const row of rows) {
    const rowBytes = estimateJsonBytes(row);

    // A single row larger than the regular chunk budget can never be packed
    // alongside others. Instead of throwing (which previously broke the entire
    // articles catalog on web + mobile), give it its own chunk when it still
    // fits Firestore's hard document limit, otherwise skip it with a warning.
    if (rowBytes > maxChunkBytes) {
      if (rowBytes <= CACHE_DOC_HARD_LIMIT_BYTES) {
        flushCurrent();
        chunks.push([row]);
        console.warn("[articles.public] oversized article stored in dedicated cache chunk", {
          documentId: row?.documentId || "unknown",
          bytes: rowBytes,
        });
      } else {
        console.error("[articles.public] article too large for cache, skipping", {
          documentId: row?.documentId || "unknown",
          bytes: rowBytes,
          hardLimitBytes: CACHE_DOC_HARD_LIMIT_BYTES,
        });
      }
      continue;
    }

    const separatorBytes = currentRows.length === 0 ? 0 : 1;
    if (currentBytes + separatorBytes + rowBytes > maxChunkBytes) {
      flushCurrent();
      currentRows = [row];
      currentBytes = 2 + rowBytes;
    } else {
      currentRows.push(row);
      currentBytes += separatorBytes + rowBytes;
    }
  }

  flushCurrent();

  return chunks;
};

const docToCachedArticleRow = (docSnap) => {
  const raw = serializeFirestoreValue(docSnap.data() || {});
  const documentId = normalizeString(docSnap.id);
  const legacyId = normalizeArticleId(raw?.id);
  const scheduledAtMs = resolveArticleSortMs(raw);
  return {
    ...raw,
    documentId,
    id: legacyId || documentId,
    legacyId,
    scheduledAtTs: new Date(scheduledAtMs).toISOString(),
    scheduledAtMs,
    categoryKey: extractCategoryKey(raw),
  };
};

const normalizeCachedRows = (rows) => {
  if (!Array.isArray(rows)) return null;
  const normalized = rows
    .filter((row) => row && typeof row === "object")
    .map((row) => {
      const documentId = normalizeString(row.documentId || row.id);
      if (!documentId) return null;
      const scheduledAtMs = Number(row.scheduledAtMs);
      if (!Number.isFinite(scheduledAtMs)) return null;
      const legacyId = normalizeArticleId(row.legacyId || row.id);
      return {
        ...row,
        documentId,
        id: legacyId || documentId,
        legacyId,
        scheduledAtMs,
        scheduledAtTs: toDateFromUnknown(row.scheduledAtTs || scheduledAtMs)?.toISOString(),
        categoryKey: normalizeString(row.categoryKey || extractCategoryKey(row)),
      };
    })
    .filter(Boolean);

  return normalized;
};

function stripRowContent(row) {
  if (!row || typeof row !== "object" || !row.info || typeof row.info !== "object") {
    return row;
  }
  return { ...row, info: stripInfoContent(row.info) };
}

const rebuildMaterializedRows = async (db) => {
  const snap = await withFirestoreCostLog(
    {
      page: "api.articles",
      locale: "all",
      queryName: "BlogArticole.publicCacheRebuild",
      isrRevalidateSeconds: 60,
    },
    () => db.collection(COLLECTION).get()
  );

  const rows = snap.docs.map(docToCachedArticleRow).sort((left, right) => right.scheduledAtMs - left.scheduledAtMs);
  // The list cache never serves `info[*].content` (every list path runs
  // through `stripInfoContent` on output, and article detail reads the full
  // document directly via `resolveArticleById`). Storing content-stripped
  // ("slim") rows packs hundreds of cards per chunk instead of a handful of
  // content-heavy rows, collapsing the chunk count (and per-request reads)
  // dramatically without changing the field-level list output.
  const slimRows = rows.map(stripRowContent);
  const chunks = splitRowsIntoChunks(slimRows, CACHE_DOC_MAX_BYTES);
  const chunkDocIds = chunks.map((_, index) => toChunkDocId(index));
  const manifestPayload = {
    version: CACHE_VERSION,
    updatedAt: new Date(),
    rowCount: slimRows.length,
    chunkCount: chunkDocIds.length,
    chunkDocIds,
  };

  await Promise.all(
    chunkDocIds.map((docId, index) =>
      db.collection(CACHE_COLLECTION).doc(docId).set(
        {
          version: CACHE_VERSION,
          index,
          rowCount: chunks[index].length,
          rows: chunks[index],
        },
        { merge: false }
      )
    )
  );

  await db.collection(CACHE_COLLECTION).doc(CACHE_DOC_ID).set(manifestPayload, { merge: false });

  // After a rebuild we know exactly what the manifest's updatedAt is going to
  // be (we just wrote it as `new Date()` in manifestPayload). Stamp the memory
  // cache so the next request short-circuits on the manifest-check path.
  const nowMs = Date.now();
  cachedRowsState = {
    manifestUpdatedAtMs: manifestPayload.updatedAt.getTime(),
    lastVerifiedAtMs: nowMs,
    rows: slimRows,
    promise: null,
  };
  return slimRows;
};

/**
 * Fetches chunk documents from Firestore based on the manifest's
 * `chunkDocIds`. Honors `MAX_CHUNKS_TO_LOAD` (articles are newest-first, so
 * the first chunk is the most relevant slice). Returns sorted rows or null
 * when a chunk is missing / version-mismatched (caller should rebuild).
 */
async function fetchChunkRowsFromManifest(db, manifest) {
  const chunkDocIds = Array.isArray(manifest?.chunkDocIds) ? manifest.chunkDocIds : [];
  if (manifest?.version !== CACHE_VERSION || chunkDocIds.length === 0) {
    return null;
  }

  const chunksToLoad =
    MAX_CHUNKS_TO_LOAD > 0
      ? chunkDocIds.slice(0, MAX_CHUNKS_TO_LOAD)
      : chunkDocIds;

  const chunkSnaps = await Promise.all(
    chunksToLoad.map((chunkId) =>
      withFirestoreCostLog(
        {
          page: "api.articles",
          queryName: "internalCaches.articles_chunk",
          operationType: "document",
        },
        () => db.collection(CACHE_COLLECTION).doc(chunkId).get()
      )
    )
  );

  const hydratedRows = [];
  for (const chunkSnap of chunkSnaps) {
    if (!chunkSnap.exists) return null;
    const chunkData = chunkSnap.data() || {};
    if (chunkData.version !== CACHE_VERSION) return null;
    const normalized = normalizeCachedRows(chunkData.rows);
    if (!normalized) return null;
    hydratedRows.push(...normalized);
  }

  return hydratedRows.sort((left, right) => right.scheduledAtMs - left.scheduledAtMs);
}

/**
 * Reads only the manifest doc (1 read) and decides whether to reuse the
 * memory rows or refetch chunks. Returns the up-to-date rows and the new
 * `manifestUpdatedAtMs` stamp.
 */
async function verifyManifestAndLoadRows() {
  const db = getAdminDb();
  const manifestSnap = await withFirestoreCostLog(
    {
      page: "api.articles",
      queryName: "internalCaches.articles_manifest",
      operationType: "document",
    },
    () => db.collection(CACHE_COLLECTION).doc(CACHE_DOC_ID).get()
  );

  if (!manifestSnap.exists) {
    const rows = await rebuildMaterializedRows(db);
    return { rows, manifestUpdatedAtMs: cachedRowsState.manifestUpdatedAtMs || Date.now() };
  }

  const manifest = manifestSnap.data() || {};
  const manifestUpdatedAtMs = getManifestUpdatedAtMs(manifest);

  // Same version stamp + we already have rows in memory: reuse them. This is
  // the hot path for "API is just being polled, nothing actually changed" —
  // costs exactly 1 read for the whole request.
  if (
    cachedRowsState.rows
    && manifestUpdatedAtMs > 0
    && manifestUpdatedAtMs === cachedRowsState.manifestUpdatedAtMs
  ) {
    recordFirestoreCacheHit({
      page: "api.articles",
      queryName: "memory.article_rows_unchanged",
    });
    return { rows: cachedRowsState.rows, manifestUpdatedAtMs };
  }

  // Empty cache short-circuit: no chunks at all is a valid state.
  if (manifest.version === CACHE_VERSION && manifest.rowCount === 0) {
    return { rows: [], manifestUpdatedAtMs };
  }

  const chunkRows = await fetchChunkRowsFromManifest(db, manifest);
  if (chunkRows !== null) {
    return { rows: chunkRows, manifestUpdatedAtMs };
  }

  // Manifest looked corrupt (missing chunk / version skew) → full rebuild.
  const rows = await rebuildMaterializedRows(db);
  return { rows, manifestUpdatedAtMs: cachedRowsState.manifestUpdatedAtMs || manifestUpdatedAtMs || Date.now() };
}

export async function loadPublicArticleRows() {
  const now = Date.now();

  // Fast path: we verified the manifest very recently — skip the read entirely.
  if (
    cachedRowsState.rows
    && now - cachedRowsState.lastVerifiedAtMs < MANIFEST_VERIFY_INTERVAL_MS
  ) {
    recordFirestoreCacheHit({
      page: "api.articles",
      queryName: "memory.article_rows",
    });
    return cachedRowsState.rows;
  }

  if (!cachedRowsState.promise) {
    cachedRowsState.promise = verifyManifestAndLoadRows()
      .then(({ rows, manifestUpdatedAtMs }) => {
        cachedRowsState = {
          manifestUpdatedAtMs,
          lastVerifiedAtMs: Date.now(),
          rows,
          promise: null,
        };
        return rows;
      })
      .catch((error) => {
        cachedRowsState.promise = null;
        throw error;
      });
  }

  return cachedRowsState.promise;
}

export async function rebuildPublicArticlesMaterializedCache() {
  return rebuildMaterializedRows(getAdminDb());
}

export function clearPublicArticlesMemoryCache() {
  cachedRowsState = {
    manifestUpdatedAtMs: 0,
    lastVerifiedAtMs: 0,
    rows: null,
    promise: null,
  };
  livePublishedCache = {
    expiresAt: 0,
    promise: null,
    rows: null,
  };
}

const toFirestoreTimestamp = (nowMs) => Timestamp.fromDate(new Date(nowMs));

async function resolveArticleById(id) {
  const normalizedId = normalizeString(id);
  if (!normalizedId) return null;

  const db = getAdminDb();
  const directSnap = await withFirestoreCostLog(
    {
      page: "api.articles",
      locale: "all",
      queryName: "BlogArticole.byDocId",
      isrRevalidateSeconds: 900,
    },
    () => db.collection(COLLECTION).doc(normalizedId).get()
  );

  if (directSnap.exists) {
    return docToCachedArticleRow(directSnap);
  }

  const legacySnap = await withFirestoreCostLog(
    {
      page: "api.articles",
      locale: "all",
      queryName: "BlogArticole.byLegacyId",
      isrRevalidateSeconds: 900,
    },
    () => db.collection(COLLECTION).where("id", "==", normalizedId).limit(1).get()
  );

  const legacyDoc = legacySnap.docs[0];
  if (!legacyDoc) return null;
  return docToCachedArticleRow(legacyDoc);
}

async function queryPublishedArticlesPage({ limit, cursor, category, nowMs }) {
  const db = getAdminDb();
  const nowTimestamp = toFirestoreTimestamp(nowMs);
  const normalizedCategory = category ? normalizeString(category) : null;
  const normalizedCursor = normalizeString(cursor) || null;

  let cursorSnap = null;
  if (normalizedCursor) {
    cursorSnap = await withFirestoreCostLog(
      {
        page: "api.articles",
        locale: "all",
        queryName: "BlogArticole.cursorDoc",
        isrRevalidateSeconds: 900,
      },
      () => db.collection(COLLECTION).doc(normalizedCursor).get()
    );
    if (!cursorSnap.exists) {
      cursorSnap = null;
    }
  }

  let queryRef = db.collection(COLLECTION);
  if (normalizedCategory) {
    queryRef = queryRef.where("categorie", "==", normalizedCategory);
  }
  queryRef = queryRef
    .where("scheduledAtTs", "<=", nowTimestamp)
    .orderBy("scheduledAtTs", "desc")
    .limit(limit);

  if (cursorSnap) {
    queryRef = queryRef.startAfter(cursorSnap);
  }

  const pageSnap = await withFirestoreCostLog(
    {
      page: "api.articles",
      locale: "all",
      queryName: normalizedCategory
        ? "BlogArticole.publishedPageByCategory"
        : "BlogArticole.publishedPage",
      isrRevalidateSeconds: 900,
    },
    () => queryRef.get()
  );

  const rows = pageSnap.docs.map(docToCachedArticleRow);
  const lastItem = rows.length > 0 ? rows[rows.length - 1] : null;
  const hasMore = rows.length === limit;

  return {
    rows,
    nextCursor: hasMore && lastItem ? normalizeString(lastItem.documentId) : null,
  };
}

async function queryRelatedArticles({ categoryKey, excludeDocumentId, limit, nowMs }) {
  const normalizedCategory = normalizeString(categoryKey);
  if (!normalizedCategory || limit <= 0) return [];

  const db = getAdminDb();
  const nowTimestamp = toFirestoreTimestamp(nowMs);
  const fetchLimit = Math.min(limit + 1, MAX_LIMIT);

  const relatedSnap = await withFirestoreCostLog(
    {
      page: "api.articles",
      locale: "all",
      queryName: "BlogArticole.relatedByCategory",
      isrRevalidateSeconds: 900,
    },
    () =>
      db
        .collection(COLLECTION)
        .where("categorie", "==", normalizedCategory)
        .where("scheduledAtTs", "<=", nowTimestamp)
        .orderBy("scheduledAtTs", "desc")
        .limit(fetchLimit)
        .get()
  );

  const excludeId = normalizeString(excludeDocumentId);
  return relatedSnap.docs
    .map(docToCachedArticleRow)
    .filter((row) => normalizeString(row.documentId) !== excludeId)
    .slice(0, limit);
}

async function queryNextPublishAtMs(nowMs) {
  const db = getAdminDb();
  const nowTimestamp = toFirestoreTimestamp(nowMs);

  try {
    const futureSnap = await withFirestoreCostLog(
      {
        page: "api.articles",
        locale: "all",
        queryName: "BlogArticole.nextScheduled",
        isrRevalidateSeconds: 900,
      },
      () =>
        db
          .collection(COLLECTION)
          .where("scheduledAtTs", ">", nowTimestamp)
          .orderBy("scheduledAtTs", "asc")
          .limit(1)
          .get()
    );

    const futureDoc = futureSnap.docs[0];
    if (!futureDoc) return null;
    const row = docToCachedArticleRow(futureDoc);
    const scheduledAtMs = Number(row.scheduledAtMs);
    return Number.isFinite(scheduledAtMs) ? scheduledAtMs : null;
  } catch (error) {
    console.warn("[articles.public] next scheduled query failed", error?.message || error);
    return null;
  }
}

function matchesArticleIdentity(article, value) {
  const needle = normalizeString(value);
  if (!needle) return false;

  const documentId = normalizeString(article?.documentId);
  if (documentId && documentId === needle) return true;

  const legacyId = normalizeString(article?.legacyId || article?.id);
  if (legacyId && legacyId === needle) return true;

  return false;
}

function matchesTag(article, rawTag) {
  const tag = normalizeString(rawTag).toLowerCase();
  if (!tag) return true;
  const tags = Array.isArray(article?.tags) ? article.tags : [];
  return tags.some((entry) => normalizeString(entry).toLowerCase() === tag);
}

function normalizeSearchValue(value) {
  if (typeof value !== "string") return "";
  return value.trim().toLowerCase();
}

// Maps the API locale to the actual key used inside the `info` object.
// Mirrors the mapping consumers (PostCard, NewsDetailsModal, news/[slug])
// already apply on the client side.
const mapLocaleToInfoKey = (locale) => {
  if (locale === "hi") return "hu";
  if (locale === "id") return "ru";
  if (locale === "ru") return "rusa";
  return locale;
};

function localizeInfo(info, locale) {
  if (!info || typeof info !== "object") return info;
  const infoKey = mapLocaleToInfoKey(locale);
  const localized = {};
  // Always keep Romanian as the universal fallback.
  if (info.ro) localized.ro = info.ro;
  if (infoKey !== "ro" && info[infoKey]) localized[infoKey] = info[infoKey];
  return localized;
}

function stripInfoContent(info) {
  if (!info || typeof info !== "object") return info;
  const stripped = {};
  for (const [key, block] of Object.entries(info)) {
    if (!block || typeof block !== "object") {
      stripped[key] = block;
      continue;
    }
    const { content, ...rest } = block;
    stripped[key] = rest;
  }
  return stripped;
}

function sanitizeArticleRow(article, locale, { includeContent = false } = {}) {
  const cloned = { ...article };
  delete cloned.scheduledAtMs;
  const categoryKey = normalizeString(cloned.categoryKey || extractCategoryKey(cloned));
  if (categoryKey) {
    cloned.categorie = categoryKey;
  }
  delete cloned.categoryKey;
  if (locale && cloned.info) {
    cloned.info = localizeInfo(cloned.info, locale);
  }
  if (!includeContent && cloned.info) {
    cloned.info = stripInfoContent(cloned.info);
  }
  return cloned;
}

function findNextPublishAtMs(rows, nowMs) {
  let nextValue = null;
  for (const row of rows) {
    const scheduledAtMs = Number(row?.scheduledAtMs);
    if (!Number.isFinite(scheduledAtMs) || scheduledAtMs <= nowMs) continue;
    if (nextValue === null || scheduledAtMs < nextValue) {
      nextValue = scheduledAtMs;
    }
  }
  return nextValue;
}

async function loadPublicArticlesFromMaterializedCache({
  normalizedLimit,
  normalizedLocale,
  normalizedCategory,
  normalizedSearch,
  normalizedCursor,
  normalizedId,
  tag,
  nowMs,
}) {
  let allRows = await loadPublicArticleRows();
  const shouldAugmentLive =
    !normalizedCategory && !normalizedSearch && !tag && !normalizedCursor;

  if (shouldAugmentLive) {
    allRows = await augmentRowsWithLivePublished(allRows, nowMs);
  } else {
    allRows = refreshArticleRowsSchedule(allRows);
  }

  let filtered = allRows;

  if (normalizedId) {
    const found = filtered.find((row) => matchesArticleIdentity(row, normalizedId)) || null;
    if (!found || !isArticlePublishedAt(found, nowMs)) {
      return {
        articles: [],
        items: [],
        nextCursor: null,
        locale: normalizedLocale,
        nextPublishAtMs: findNextPublishAtMs(filtered, nowMs),
      };
    }
    const article = sanitizeArticleRow(found, normalizedLocale);
    return {
      articles: [article],
      items: [article],
      nextCursor: null,
      locale: normalizedLocale,
      nextPublishAtMs: findNextPublishAtMs(filtered, nowMs),
    };
  }

  if (normalizedCategory) {
    filtered = filtered.filter((row) => normalizeString(row.categoryKey) === normalizedCategory);
  }

  if (tag) {
    filtered = filtered.filter((row) => matchesTag(row, tag));
  }

  const nextPublishAtMs = findNextPublishAtMs(filtered, nowMs);

  filtered = filtered.filter((row) => isArticlePublishedAt(row, nowMs));

  if (normalizedSearch) {
    filtered = filtered.filter((row) => {
      const name = getLocalizedArticleName(row, normalizedLocale).toLowerCase();
      const description = getLocalizedArticleDescription(row, normalizedLocale).toLowerCase();
      return name.includes(normalizedSearch) || description.includes(normalizedSearch);
    });
  }

  let startIndex = 0;
  if (normalizedCursor) {
    const cursorIndex = filtered.findIndex(
      (row) => normalizeString(row.documentId) === normalizedCursor
    );
    if (cursorIndex >= 0) {
      startIndex = cursorIndex + 1;
    }
  }

  const pageItems = filtered.slice(startIndex, startIndex + normalizedLimit);
  const sanitizedItems = pageItems.map((row) => sanitizeArticleRow(row, normalizedLocale));
  const lastItem = pageItems.length > 0 ? pageItems[pageItems.length - 1] : null;
  const hasMore = startIndex + pageItems.length < filtered.length;

  return {
    articles: sanitizedItems,
    items: sanitizedItems,
    nextCursor: hasMore && lastItem ? normalizeString(lastItem.documentId) : null,
    locale: normalizedLocale,
    nextPublishAtMs,
  };
}

export async function loadPublicArticles({
  limit = DEFAULT_LIMIT,
  category,
  search,
  cursor,
  locale = "ro",
  tag = null,
  id = null,
} = {}) {
  const normalizedLimit = parseArticleLimit(limit);
  const normalizedLocale = normalizeArticleLocale(locale);
  const normalizedCategory =
    typeof category === "string" && category.trim() && category !== "All" ? category.trim() : null;
  const normalizedSearch = normalizeSearchValue(search);
  const normalizedCursor = normalizeString(cursor) || null;
  const normalizedId = normalizeString(id) || null;
  const nowMs = Date.now();

  if (normalizedId) {
    const found = await resolveArticleById(normalizedId);
    const nextPublishAtMs = await queryNextPublishAtMs(nowMs);
    if (!found || !isArticlePublishedAt(found, nowMs)) {
      return {
        articles: [],
        items: [],
        nextCursor: null,
        locale: normalizedLocale,
        nextPublishAtMs,
      };
    }
    const article = sanitizeArticleRow(found, normalizedLocale);
    return {
      articles: [article],
      items: [article],
      nextCursor: null,
      locale: normalizedLocale,
      nextPublishAtMs,
    };
  }

  // All list queries (All, category, search, tag) use the materialized cache so
  // legacy `categorie` shapes and scheduledAtMs backfills stay consistent.
  return loadPublicArticlesFromMaterializedCache({
    normalizedLimit,
    normalizedLocale,
    normalizedCategory,
    normalizedSearch,
    normalizedCursor,
    normalizedId,
    tag,
    nowMs,
  });
}

export async function loadPublicArticleDetail({
  id,
  locale = "ro",
  relatedLimit = DEFAULT_RELATED_LIMIT,
} = {}) {
  const normalizedId = normalizeString(id);
  if (!normalizedId) {
    return {
      article: null,
      related: [],
      locale: normalizeArticleLocale(locale),
      nextPublishAtMs: null,
    };
  }

  const normalizedLocale = normalizeArticleLocale(locale);
  const nowMs = Date.now();
  const boundedRelatedLimit = parseRelatedLimit(relatedLimit, DEFAULT_RELATED_LIMIT);

  const [articleRow, nextPublishAtMs] = await Promise.all([
    resolveArticleById(normalizedId),
    queryNextPublishAtMs(nowMs),
  ]);

  if (!articleRow || Number(articleRow.scheduledAtMs) > nowMs) {
    return {
      article: null,
      related: [],
      locale: normalizedLocale,
      nextPublishAtMs,
    };
  }

  const categoryKey = normalizeString(articleRow.categoryKey);
  const relatedRows = await queryRelatedArticles({
    categoryKey,
    excludeDocumentId: articleRow.documentId,
    limit: boundedRelatedLimit,
    nowMs,
  });

  return {
    article: sanitizeArticleRow(articleRow, normalizedLocale, { includeContent: true }),
    related: relatedRows.map((row) => sanitizeArticleRow(row, normalizedLocale)),
    locale: normalizedLocale,
    nextPublishAtMs,
  };
}
