/**
 * Simplified public articles loader - direct Firestore reads with in-memory cache.
 * No chunked Firestore cache, just simple and reliable.
 */
import { getAdminDb } from "./firebaseAdmin";

const COLLECTION = "BlogArticole";
const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 50;
const CACHE_TTL_MS = 60 * 1000; // 1 minute in-memory cache

// Simple in-memory cache
let memoryCache = {
  rows: null,
  expiresAt: 0,
  promise: null,
};

// Locale mapping (same as before)
const mapLocaleToInfoKey = (locale) => {
  if (locale === "hi") return "hu";
  if (locale === "id") return "ru";
  if (locale === "ru") return "rusa";
  return locale;
};

export const normalizeArticleLocale = (value, fallback = "ro") => {
  if (typeof value !== "string" || !value.trim()) return fallback;
  const [base] = value.trim().toLowerCase().replace("_", "-").split("-");
  return base || fallback;
};

export const parseArticleLimit = (value, fallback = DEFAULT_LIMIT) => {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === undefined || raw === null || raw === "") return fallback;
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed <= 0) return fallback;
  return Math.min(parsed, MAX_LIMIT);
};

export const parseRelatedLimit = (value, fallback = 2) => {
  return parseArticleLimit(value, fallback);
};

// Serialize Firestore timestamps to ISO strings
const serialize = (value) => {
  if (!value) return value;
  if (value instanceof Date) return value.toISOString();
  if (typeof value?.toDate === "function") return value.toDate().toISOString();
  if (Array.isArray(value)) return value.map(serialize);
  if (typeof value === "object") {
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = serialize(v);
    return out;
  }
  return value;
};

// Get scheduled timestamp in ms
const getScheduledMs = (article) => {
  if (article?.scheduledAtTs) {
    const d = new Date(article.scheduledAtTs);
    if (!isNaN(d.getTime())) return d.getTime();
  }
  if (article?.dataProgramata && article?.timpProgramat) {
    const d = new Date(`${article.dataProgramata}T${article.timpProgramat}`);
    if (!isNaN(d.getTime())) return d.getTime();
  }
  if (article?.firstUploadTimestamp) {
    const d = new Date(article.firstUploadTimestamp);
    if (!isNaN(d.getTime())) return d.getTime();
  }
  return 0;
};

// Localize info object - keep only requested locale + ro fallback
const localizeInfo = (info, locale) => {
  if (!info || typeof info !== "object") return info;
  const infoKey = mapLocaleToInfoKey(locale);
  const localized = {};
  if (info.ro) localized.ro = info.ro;
  if (infoKey !== "ro" && info[infoKey]) localized[infoKey] = info[infoKey];
  return localized;
};

// Transform Firestore doc to article row
const docToRow = (doc) => {
  const raw = serialize(doc.data() || {});
  const documentId = doc.id;
  const scheduledAtMs = getScheduledMs(raw);
  return {
    ...raw,
    documentId,
    id: raw?.id || documentId,
    scheduledAtMs,
    scheduledAtTs: new Date(scheduledAtMs).toISOString(),
    categoryKey: typeof raw?.categorie === "string" ? raw.categorie.trim() : "",
  };
};

// Fetch all articles from Firestore (with in-memory cache)
async function fetchAllRows() {
  const now = Date.now();
  
  // Return cached if valid
  if (memoryCache.rows && memoryCache.expiresAt > now) {
    return memoryCache.rows;
  }
  
  // If fetch in progress, wait for it
  if (memoryCache.promise) {
    return memoryCache.promise;
  }
  
  // Fetch from Firestore
  memoryCache.promise = (async () => {
    try {
      const db = getAdminDb();
      const snap = await db.collection(COLLECTION).get();
      const rows = snap.docs
        .map(docToRow)
        .sort((a, b) => b.scheduledAtMs - a.scheduledAtMs);
      
      memoryCache = {
        rows,
        expiresAt: Date.now() + CACHE_TTL_MS,
        promise: null,
      };
      return rows;
    } catch (error) {
      memoryCache.promise = null;
      throw error;
    }
  })();
  
  return memoryCache.promise;
}

// Sanitize row for response (remove internal fields, apply localization)
const sanitizeRow = (row, locale) => {
  const { scheduledAtMs, categoryKey, ...rest } = row;
  if (locale && rest.info) {
    rest.info = localizeInfo(rest.info, locale);
  }
  return rest;
};

// Find next scheduled article timestamp
const findNextPublishAtMs = (rows, nowMs) => {
  let next = null;
  for (const row of rows) {
    if (row.scheduledAtMs > nowMs) {
      if (next === null || row.scheduledAtMs < next) {
        next = row.scheduledAtMs;
      }
    }
  }
  return next;
};

/**
 * Load public articles with pagination
 */
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
  const nowMs = Date.now();

  const allRows = await fetchAllRows();
  let filtered = allRows;

  // Single article by ID
  if (id) {
    const found = filtered.find(
      (r) => r.documentId === id || r.id === id
    );
    if (!found || found.scheduledAtMs > nowMs) {
      return {
        articles: [],
        items: [],
        nextCursor: null,
        locale: normalizedLocale,
        nextPublishAtMs: findNextPublishAtMs(filtered, nowMs),
      };
    }
    const article = sanitizeRow(found, normalizedLocale);
    return {
      articles: [article],
      items: [article],
      nextCursor: null,
      locale: normalizedLocale,
      nextPublishAtMs: findNextPublishAtMs(filtered, nowMs),
    };
  }

  // Filter by category
  if (category && category !== "All") {
    filtered = filtered.filter((r) => r.categoryKey === category.trim());
  }

  // Filter by tag
  if (tag) {
    const tagLower = tag.toLowerCase();
    filtered = filtered.filter((r) =>
      Array.isArray(r.tags) && r.tags.some((t) => String(t).toLowerCase() === tagLower)
    );
  }

  const nextPublishAtMs = findNextPublishAtMs(filtered, nowMs);

  // Filter out future articles
  filtered = filtered.filter((r) => r.scheduledAtMs <= nowMs);

  // Search filter
  if (search) {
    const searchLower = search.trim().toLowerCase();
    const infoKey = mapLocaleToInfoKey(normalizedLocale);
    filtered = filtered.filter((r) => {
      const name = (r.info?.[infoKey]?.nume || r.info?.ro?.nume || "").toLowerCase();
      const desc = (r.info?.[infoKey]?.descriere || r.info?.ro?.descriere || "").toLowerCase();
      return name.includes(searchLower) || desc.includes(searchLower);
    });
  }

  // Pagination with cursor
  let startIndex = 0;
  if (cursor) {
    const cursorIndex = filtered.findIndex((r) => r.documentId === cursor);
    if (cursorIndex >= 0) startIndex = cursorIndex + 1;
  }

  const pageItems = filtered.slice(startIndex, startIndex + normalizedLimit);
  const sanitizedItems = pageItems.map((r) => sanitizeRow(r, normalizedLocale));
  const lastItem = pageItems[pageItems.length - 1];

  return {
    articles: sanitizedItems,
    items: sanitizedItems,
    nextCursor: lastItem ? lastItem.documentId : null,
    locale: normalizedLocale,
    nextPublishAtMs,
  };
}

/**
 * Load single article detail with related articles
 */
export async function loadPublicArticleDetail({
  id,
  locale = "ro",
  relatedLimit = 2,
} = {}) {
  if (!id) {
    return { article: null, related: [], locale: normalizeArticleLocale(locale), nextPublishAtMs: null };
  }

  const normalizedLocale = normalizeArticleLocale(locale);
  const nowMs = Date.now();
  const allRows = await fetchAllRows();

  const articleRow = allRows.find(
    (r) => (r.documentId === id || r.id === id) && r.scheduledAtMs <= nowMs
  );

  if (!articleRow) {
    return {
      article: null,
      related: [],
      locale: normalizedLocale,
      nextPublishAtMs: findNextPublishAtMs(allRows, nowMs),
    };
  }

  // Find related articles (same category)
  const related = allRows
    .filter((r) =>
      r.documentId !== articleRow.documentId &&
      r.scheduledAtMs <= nowMs &&
      r.categoryKey &&
      r.categoryKey === articleRow.categoryKey
    )
    .slice(0, parseRelatedLimit(relatedLimit))
    .map((r) => sanitizeRow(r, normalizedLocale));

  return {
    article: sanitizeRow(articleRow, normalizedLocale),
    related,
    locale: normalizedLocale,
    nextPublishAtMs: findNextPublishAtMs(allRows, nowMs),
  };
}

// Force cache refresh (for admin/testing)
export function clearArticlesCache() {
  memoryCache = { rows: null, expiresAt: 0, promise: null };
}
