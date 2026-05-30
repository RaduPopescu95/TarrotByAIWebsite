import { getAdminDb } from "./firebaseAdmin";
import { withFirestoreCostLog } from "./firestoreCostLogger";
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
const DEFAULT_CACHE_TTL_MS = 60 * 1000;
const parsedCacheTtlMs = Number.parseInt(process.env.ARTICLES_PUBLIC_CACHE_TTL_MS || "", 10);
const ARTICLES_PUBLIC_CACHE_TTL_MS =
  Number.isFinite(parsedCacheTtlMs) && parsedCacheTtlMs > 0
    ? parsedCacheTtlMs
    : DEFAULT_CACHE_TTL_MS;

const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 50;
const DEFAULT_RELATED_LIMIT = 2;
const MAX_RELATED_LIMIT = 12;

let cachedRowsState = {
  expiresAt: 0,
  promise: null,
  rows: null,
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

const resolveArticleSortDate = (article) =>
  toDateFromUnknown(article?.scheduledAtTs) ||
  buildScheduledDate({
    dataProgramata: article?.dataProgramata,
    timpProgramat: article?.timpProgramat,
    fallbackDate: article?.firstUploadTimestamp || article?.createdAt || null,
  }) ||
  new Date(0);

const resolveArticleSortMs = (article) => {
  const dateValue = resolveArticleSortDate(article);
  const ms = dateValue?.getTime?.();
  return Number.isFinite(ms) ? ms : 0;
};

const extractCategoryKey = (article) => {
  const raw = article?.categorie;
  if (typeof raw === "string" && raw.trim()) return raw.trim();
  const ro = raw?.info?.ro?.nume;
  if (typeof ro === "string" && ro.trim()) return ro.trim();
  return "";
};

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
  const chunks = splitRowsIntoChunks(rows, CACHE_DOC_MAX_BYTES);
  const chunkDocIds = chunks.map((_, index) => toChunkDocId(index));
  const manifestPayload = {
    version: CACHE_VERSION,
    updatedAt: new Date(),
    rowCount: rows.length,
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

  cachedRowsState = {
    rows,
    expiresAt: Date.now() + ARTICLES_PUBLIC_CACHE_TTL_MS,
    promise: null,
  };
  return rows;
};

async function fetchPublicArticleRowsFromCache() {
  const db = getAdminDb();
  const manifestSnap = await db.collection(CACHE_COLLECTION).doc(CACHE_DOC_ID).get();
  if (manifestSnap.exists) {
    const manifest = manifestSnap.data() || {};
    const chunkDocIds = Array.isArray(manifest.chunkDocIds) ? manifest.chunkDocIds : [];
    if (manifest.version === CACHE_VERSION && chunkDocIds.length > 0) {
      const chunkSnaps = await Promise.all(
        chunkDocIds.map((chunkId) => db.collection(CACHE_COLLECTION).doc(chunkId).get())
      );
      const hydratedRows = [];
      for (const chunkSnap of chunkSnaps) {
        if (!chunkSnap.exists) {
          hydratedRows.length = 0;
          break;
        }
        const chunkData = chunkSnap.data() || {};
        if (chunkData.version !== CACHE_VERSION) {
          hydratedRows.length = 0;
          break;
        }
        const normalized = normalizeCachedRows(chunkData.rows);
        if (!normalized) {
          hydratedRows.length = 0;
          break;
        }
        hydratedRows.push(...normalized);
      }
      if (hydratedRows.length > 0 || manifest.rowCount === 0) {
        return hydratedRows.sort((left, right) => right.scheduledAtMs - left.scheduledAtMs);
      }
    }
    if (manifest.version === CACHE_VERSION && manifest.rowCount === 0) {
      return [];
    }
  }
  return rebuildMaterializedRows(db);
}

export async function loadPublicArticleRows() {
  const now = Date.now();
  if (cachedRowsState.rows && cachedRowsState.expiresAt > now) {
    return cachedRowsState.rows;
  }

  if (!cachedRowsState.promise) {
    cachedRowsState.promise = fetchPublicArticleRowsFromCache()
      .then((rows) => {
        cachedRowsState = {
          rows,
          expiresAt: Date.now() + ARTICLES_PUBLIC_CACHE_TTL_MS,
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

function sanitizeArticleRow(article) {
  const cloned = { ...article };
  delete cloned.scheduledAtMs;
  delete cloned.categoryKey;
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

  const allRows = await loadPublicArticleRows();
  let filtered = allRows;

  if (normalizedId) {
    const found = filtered.find((row) => matchesArticleIdentity(row, normalizedId)) || null;
    if (!found || Number(found.scheduledAtMs) > nowMs) {
      return {
        articles: [],
        items: [],
        nextCursor: null,
        locale: normalizedLocale,
        nextPublishAtMs: findNextPublishAtMs(filtered, nowMs),
      };
    }
    const article = sanitizeArticleRow(found);
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

  filtered = filtered.filter((row) => Number(row.scheduledAtMs) <= nowMs);

  if (normalizedSearch) {
    filtered = filtered.filter((row) => {
      const name = getLocalizedArticleName(row, normalizedLocale).toLowerCase();
      const description = getLocalizedArticleDescription(row, normalizedLocale).toLowerCase();
      return name.includes(normalizedSearch) || description.includes(normalizedSearch);
    });
  }

  let startIndex = 0;
  if (normalizedCursor) {
    const cursorIndex = filtered.findIndex((row) => normalizeString(row.documentId) === normalizedCursor);
    if (cursorIndex >= 0) {
      startIndex = cursorIndex + 1;
    }
  }

  const pageItems = filtered.slice(startIndex, startIndex + normalizedLimit);
  const sanitizedItems = pageItems.map(sanitizeArticleRow);
  const lastItem = pageItems.length > 0 ? pageItems[pageItems.length - 1] : null;

  return {
    articles: sanitizedItems,
    items: sanitizedItems,
    nextCursor: lastItem ? normalizeString(lastItem.documentId) : null,
    locale: normalizedLocale,
    nextPublishAtMs,
  };
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
  const rows = await loadPublicArticleRows();
  const nextPublishAtMs = findNextPublishAtMs(rows, nowMs);

  const articleRow =
    rows.find((row) => matchesArticleIdentity(row, normalizedId) && Number(row.scheduledAtMs) <= nowMs) || null;

  if (!articleRow) {
    return {
      article: null,
      related: [],
      locale: normalizedLocale,
      nextPublishAtMs,
    };
  }

  const categoryKey = normalizeString(articleRow.categoryKey);
  const boundedRelatedLimit = parseRelatedLimit(relatedLimit, DEFAULT_RELATED_LIMIT);
  const related = rows
    .filter((row) => {
      if (normalizeString(row.documentId) === normalizeString(articleRow.documentId)) return false;
      if (Number(row.scheduledAtMs) > nowMs) return false;
      if (!categoryKey) return false;
      return normalizeString(row.categoryKey) === categoryKey;
    })
    .slice(0, boundedRelatedLimit)
    .map(sanitizeArticleRow);

  return {
    article: sanitizeArticleRow(articleRow),
    related,
    locale: normalizedLocale,
    nextPublishAtMs,
  };
}

