import { AsyncLocalStorage } from "async_hooks";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "./firebaseAdmin";

export const DEFAULT_ISR_REVALIDATE_SECONDS = 300;
export const DEFAULT_READ_TELEMETRY_SAMPLE_RATE = 0.1;
export const READ_TELEMETRY_COLLECTION = "FirestoreReadTelemetryDaily";
export const READ_TELEMETRY_RETENTION_DAYS = 30;

const requestStorage = new AsyncLocalStorage();

const isCostLogEnabled = () => process.env.FIRESTORE_COST_LOGS === "true";

export function isReadTelemetryEnabled() {
  const configured = process.env.FIRESTORE_READ_TELEMETRY_ENABLED;
  if (configured === "true") return true;
  if (configured === "false") return false;
  return process.env.NODE_ENV === "production";
}

export function getReadTelemetrySampleRate() {
  const parsed = Number(process.env.FIRESTORE_READ_TELEMETRY_SAMPLE_RATE);
  if (!Number.isFinite(parsed)) return DEFAULT_READ_TELEMETRY_SAMPLE_RATE;
  return Math.min(Math.max(parsed, 0), 1);
}

export function shouldSampleFirestoreReadRequest(randomValue = Math.random()) {
  return isReadTelemetryEnabled() && randomValue < getReadTelemetrySampleRate();
}

function normalizeText(value, fallback = "unknown") {
  if (typeof value !== "string") return fallback;
  return value.trim() || fallback;
}

function hashValue(value) {
  let hash = 5381;
  const input = String(value || "");
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 33) ^ input.charCodeAt(index);
  }
  return Math.abs(hash >>> 0).toString(36);
}

function sanitizeDocPart(value) {
  return normalizeText(value).replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 80);
}

function getDateKey(now = new Date()) {
  return now.toISOString().slice(0, 10);
}

function getExpirationDate(now = Date.now()) {
  return new Date(now + READ_TELEMETRY_RETENTION_DAYS * 24 * 60 * 60 * 1000);
}

function getSnapshotMetrics(result, fallbackDocs = 0, operationType) {
  if (operationType === "cache") {
    return { docsReturned: 0, estimatedReads: 0 };
  }

  if (typeof result?.exists === "boolean") {
    return { docsReturned: result.exists ? 1 : 0, estimatedReads: 1 };
  }
  if (typeof result?.exists === "function") {
    return { docsReturned: result.exists() ? 1 : 0, estimatedReads: 1 };
  }

  let docsReturned = Number(fallbackDocs) || 0;
  if (typeof result?.size === "number") docsReturned = result.size;
  else if (Array.isArray(result?.docs)) docsReturned = result.docs.length;
  else if (Array.isArray(result)) docsReturned = result.length;

  return {
    docsReturned,
    estimatedReads: Math.max(docsReturned, 1),
  };
}

function recordToActiveRequest(event) {
  const context = requestStorage.getStore();
  if (!context?.sampled) return;
  context.events.push(event);
}

export function recordFirestoreReadTelemetry({
  page,
  queryName,
  docsReturned = 0,
  estimatedReads = 0,
  queryCount = 1,
  durationMs = 0,
  error,
  cacheHit = false,
  operationType = "query",
}) {
  recordToActiveRequest({
    page: normalizeText(page),
    queryName: normalizeText(queryName),
    docsReturned: Math.max(Number(docsReturned) || 0, 0),
    estimatedReads: Math.max(Number(estimatedReads) || 0, 0),
    queryCount: Math.max(Number(queryCount) || 0, 0),
    durationMs: Math.max(Number(durationMs) || 0, 0),
    error: Boolean(error),
    cacheHit: Boolean(cacheHit),
    operationType: normalizeText(operationType, "query"),
  });
}

export function recordFirestoreCacheHit(meta = {}) {
  recordFirestoreReadTelemetry({
    ...meta,
    cacheHit: true,
    operationType: "cache",
    queryCount: 0,
  });
}

export function logFirestoreCost({
  page,
  locale,
  queryName,
  docsRead = 0,
  estimatedReads = docsRead,
  queryCount = 1,
  durationMs = 0,
  isrRevalidateSeconds = DEFAULT_ISR_REVALIDATE_SECONDS,
  error,
  cacheHit = false,
  operationType = "query",
}) {
  recordFirestoreReadTelemetry({
    page,
    queryName,
    docsReturned: docsRead,
    estimatedReads,
    queryCount,
    durationMs,
    error,
    cacheHit,
    operationType,
  });

  if (!isCostLogEnabled()) return;
  console.warn("[FirestoreCost]", {
    page,
    locale: locale || "ro",
    queryName,
    docsRead,
    estimatedReads,
    queryCount,
    durationMs,
    isrRevalidateSeconds,
    cacheHit,
    error: error ? String(error?.message || error) : undefined,
  });
}

export async function withFirestoreCostLog(meta, operation) {
  const startedAt = Date.now();
  try {
    const result = await operation();
    const metrics = getSnapshotMetrics(result, meta.docsRead, meta.operationType);
    logFirestoreCost({
      ...meta,
      docsRead: metrics.docsReturned,
      estimatedReads:
        Number.isFinite(Number(meta.estimatedReads))
          ? Number(meta.estimatedReads)
          : metrics.estimatedReads,
      durationMs: Date.now() - startedAt,
    });
    return result;
  } catch (error) {
    logFirestoreCost({
      ...meta,
      docsRead: 0,
      estimatedReads: Math.max(Number(meta.estimatedReadsOnError) || 0, 0),
      durationMs: Date.now() - startedAt,
      error,
    });
    throw error;
  }
}

function groupRequestEvents(events) {
  const grouped = new Map();
  for (const event of events) {
    const key = `${event.page}::${event.queryName}`;
    const row = grouped.get(key) || {
      page: event.page,
      queryName: event.queryName,
      operationCount: 0,
      queryCount: 0,
      docsReturned: 0,
      estimatedReads: 0,
      durationMs: 0,
      errorCount: 0,
      cacheHits: 0,
    };
    row.operationCount += 1;
    row.queryCount += event.queryCount;
    row.docsReturned += event.docsReturned;
    row.estimatedReads += event.estimatedReads;
    row.durationMs += event.durationMs;
    row.errorCount += event.error ? 1 : 0;
    row.cacheHits += event.cacheHit ? 1 : 0;
    grouped.set(key, row);
  }
  return Array.from(grouped.values());
}

export function buildFirestoreReadTelemetryWrites(context, responseMeta = {}, now = new Date()) {
  const date = getDateKey(now);
  const expiresAt = getExpirationDate(now.getTime());
  const sampleRate = context.sampleRate || DEFAULT_READ_TELEMETRY_SAMPLE_RATE;
  const route = normalizeText(context.route);
  const cacheControl = normalizeText(responseMeta.cacheControl, "");
  const isPublicCache = /(?:^|,)\s*(?:public|s-maxage=)/i.test(cacheControl);
  const groupedEvents = groupRequestEvents(context.events || []);
  const routeDocId = `${date}__route__${sanitizeDocPart(route)}__${hashValue(route)}`;

  const writes = [
    {
      id: routeDocId,
      data: {
        kind: "route",
        source: "next",
        date,
        route,
        sampleRate,
        observedRequests: FieldValue.increment(1),
        totalRequestDurationMs: FieldValue.increment(Math.max(responseMeta.durationMs || 0, 0)),
        responseErrorCount: FieldValue.increment(responseMeta.statusCode >= 500 ? 1 : 0),
        publicCacheRequests: FieldValue.increment(isPublicCache ? 1 : 0),
        noPublicCacheRequests: FieldValue.increment(isPublicCache ? 0 : 1),
        lastStatusCode: responseMeta.statusCode || 200,
        lastCacheControl: cacheControl,
        updatedAt: FieldValue.serverTimestamp(),
        expiresAt,
      },
    },
  ];

  for (const row of groupedEvents) {
    const identity = `${route}|${row.page}|${row.queryName}`;
    writes.push({
      id: `${date}__query__${sanitizeDocPart(route)}__${hashValue(identity)}`,
      data: {
        kind: "query",
        source: "next",
        date,
        route,
        page: row.page,
        queryName: row.queryName,
        sampleRate,
        requestSamples: FieldValue.increment(1),
        operationCount: FieldValue.increment(row.operationCount),
        queryCount: FieldValue.increment(row.queryCount),
        docsReturned: FieldValue.increment(row.docsReturned),
        estimatedReads: FieldValue.increment(row.estimatedReads),
        totalDurationMs: FieldValue.increment(row.durationMs),
        errorCount: FieldValue.increment(row.errorCount),
        cacheHits: FieldValue.increment(row.cacheHits),
        repeatedRequestCount: FieldValue.increment(row.operationCount > 1 ? 1 : 0),
        updatedAt: FieldValue.serverTimestamp(),
        expiresAt,
      },
    });
  }

  return writes;
}

async function persistRequestTelemetry(context, res, startedAt) {
  const writes = buildFirestoreReadTelemetryWrites(context, {
    durationMs: Date.now() - startedAt,
    statusCode: res.statusCode || 200,
    cacheControl: res.getHeader?.("Cache-Control") || res.getHeader?.("cache-control") || "",
  });
  const db = getAdminDb();
  const batch = db.batch();
  for (const write of writes) {
    batch.set(db.collection(READ_TELEMETRY_COLLECTION).doc(write.id), write.data, { merge: true });
  }
  await batch.commit();
}

export function withFirestoreReadTelemetry(route, handler) {
  return async function firestoreReadTelemetryHandler(req, res) {
    if (!shouldSampleFirestoreReadRequest()) {
      return handler(req, res);
    }

    const startedAt = Date.now();
    const context = {
      sampled: true,
      route: normalizeText(route),
      sampleRate: getReadTelemetrySampleRate(),
      events: [],
    };

    let result;
    let handlerError;
    try {
      result = await requestStorage.run(context, () => handler(req, res));
    } catch (error) {
      handlerError = error;
    }

    try {
      await persistRequestTelemetry(context, res, startedAt);
    } catch (telemetryError) {
      console.warn("[FirestoreReadTelemetry] persist_failed", {
        route,
        message: telemetryError?.message || String(telemetryError),
      });
    }

    if (handlerError) throw handlerError;
    return result;
  };
}
