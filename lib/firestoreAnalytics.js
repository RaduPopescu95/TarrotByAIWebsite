export const DEFAULT_SAMPLE_LIMIT = 25;
export const MAX_SAMPLE_LIMIT = 100;
export const DEFAULT_SORT_BY = "estimatedBytes";
export const ESTIMATION_METHOD = "count_plus_sample";

function clampNumber(value, min, max, fallback) {
  const parsed = parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(parsed, min), max);
}

export function parseAnalyticsParams(query = {}) {
  const rawSampleLimit = Array.isArray(query.sampleLimit) ? query.sampleLimit[0] : query.sampleLimit;
  const rawSortBy = Array.isArray(query.sortBy) ? query.sortBy[0] : query.sortBy;
  const rawSearch = Array.isArray(query.search) ? query.search[0] : query.search;

  const sampleLimit = clampNumber(rawSampleLimit, 1, MAX_SAMPLE_LIMIT, DEFAULT_SAMPLE_LIMIT);
  const sortByOptions = new Set(["estimatedBytes", "documentCount", "name"]);
  const sortBy = sortByOptions.has(rawSortBy) ? rawSortBy : DEFAULT_SORT_BY;
  const search = typeof rawSearch === "string" ? rawSearch.trim().toLowerCase() : "";

  return { sampleLimit, sortBy, search };
}

export function estimateValueBytes(value) {
  try {
    const serialized = JSON.stringify(value);
    if (typeof serialized !== "string") return 0;
    return Buffer.byteLength(serialized, "utf8");
  } catch (_) {
    return 0;
  }
}

export function formatBytes(bytes) {
  const value = Number.isFinite(bytes) && bytes > 0 ? bytes : 0;
  if (value < 1024) return `${value} B`;

  const units = ["KB", "MB", "GB", "TB"];
  let size = value / 1024;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  const rounded = size >= 100 ? size.toFixed(0) : size >= 10 ? size.toFixed(1) : size.toFixed(2);
  return `${rounded} ${units[unitIndex]}`;
}

function compareRows(left, right, sortBy) {
  if (sortBy === "name") {
    return left.name.localeCompare(right.name, "ro");
  }

  if (sortBy === "documentCount") {
    if (right.documentCount !== left.documentCount) {
      return right.documentCount - left.documentCount;
    }
    return left.name.localeCompare(right.name, "ro");
  }

  if (right.estimatedBytes !== left.estimatedBytes) {
    return right.estimatedBytes - left.estimatedBytes;
  }
  if (right.documentCount !== left.documentCount) {
    return right.documentCount - left.documentCount;
  }
  return left.name.localeCompare(right.name, "ro");
}

async function analyzeCollection(collectionRef, sampleLimit) {
  const name = collectionRef.id || "unknown";
  const startedAt = Date.now();
  const countSnapshot = await collectionRef.count().get();
  const countData = typeof countSnapshot?.data === "function" ? countSnapshot.data() : {};
  const documentCount = Number(countData?.count) || 0;

  let sampleDocs = [];
  if (sampleLimit > 0) {
    const sampleSnapshot = await collectionRef.limit(sampleLimit).get();
    sampleDocs = Array.isArray(sampleSnapshot?.docs) ? sampleSnapshot.docs : [];
  }

  const sampledCount = sampleDocs.length;
  const sampledBytesTotal = sampleDocs.reduce((sum, docSnap) => {
    const data = typeof docSnap?.data === "function" ? docSnap.data() : null;
    return sum + estimateValueBytes(data);
  }, 0);
  const averageDocBytes =
    sampledCount > 0 ? Math.round(sampledBytesTotal / sampledCount) : 0;
  const estimatedBytes = documentCount > 0 ? averageDocBytes * documentCount : 0;

  return {
    name,
    documentCount,
    sampledCount,
    averageDocBytes,
    estimatedBytes,
    estimatedSizeLabel: formatBytes(estimatedBytes),
    sampleDurationMs: Date.now() - startedAt,
  };
}

export async function loadFirestoreCollectionAnalytics(db, options = {}) {
  const startedAt = Date.now();
  const sampleLimit = clampNumber(
    options.sampleLimit,
    1,
    MAX_SAMPLE_LIMIT,
    DEFAULT_SAMPLE_LIMIT
  );
  const sortBy = ["estimatedBytes", "documentCount", "name"].includes(options.sortBy)
    ? options.sortBy
    : DEFAULT_SORT_BY;
  const search = typeof options.search === "string" ? options.search.trim().toLowerCase() : "";

  const collectionRefs = await db.listCollections();
  const filteredRefs =
    search.length > 0
      ? collectionRefs.filter((collectionRef) =>
          String(collectionRef?.id || "").toLowerCase().includes(search)
        )
      : collectionRefs;

  const baseRows = await Promise.all(
    filteredRefs.map((collectionRef) => analyzeCollection(collectionRef, sampleLimit))
  );

  const totalEstimatedBytes = baseRows.reduce((sum, row) => sum + row.estimatedBytes, 0);
  const totalDocumentCount = baseRows.reduce((sum, row) => sum + row.documentCount, 0);
  const rows = baseRows
    .map((row) => ({
      ...row,
      shareOfEstimatedTotal:
        totalEstimatedBytes > 0 ? row.estimatedBytes / totalEstimatedBytes : 0,
    }))
    .sort((left, right) => compareRows(left, right, sortBy));

  const largest = rows[0] || null;

  return {
    collections: rows,
    summary: {
      collectionCount: rows.length,
      totalDocumentCount,
      totalEstimatedBytes,
      largestCollectionName: largest?.name || null,
      largestEstimatedBytes: largest?.estimatedBytes || 0,
    },
    meta: {
      sampleLimit,
      generatedAt: new Date().toISOString(),
      durationMs: Date.now() - startedAt,
      estimationMethod: ESTIMATION_METHOD,
      sortBy,
      search,
    },
  };
}
