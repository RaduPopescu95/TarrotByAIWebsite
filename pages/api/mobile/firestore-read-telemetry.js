import { FieldValue } from "firebase-admin/firestore";

import { getAdminDb } from "../../../lib/firebaseAdmin";
import { buildAggregateDocId } from "../../../lib/readTelemetryDocId";
import {
  READ_TELEMETRY_DEFAULT_CONFIG,
  getReadTelemetryConfig,
} from "../../../lib/readTelemetryConfigCache";
import { requireAuth } from "../../../lib/requireAuth";

const READ_TELEMETRY_COLLECTION = "ReadTelemetryDaily";
const READ_TELEMETRY_RETENTION_DAYS = 30;
const MAX_AGGREGATES_PER_REQUEST = 500;

const COUNTER_FIELDS = [
  "logicalReadCalls",
  "docReadCalls",
  "queryReadCalls",
  "serverReadCalls",
  "estimatedServerDocReads",
  "cacheHits",
  "realtimeSubscriptions",
  "realtimeSnapshots",
];

const STRING_FIELDS = [
  "date",
  "screenName",
  "collectionName",
  "collectionPathPattern",
  "platform",
  "appVersion",
];

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function buildRequestId() {
  return `frt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function toFiniteNumber(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < 0) return 0;
  return Math.floor(numeric);
}

function toBoundedString(value, max = 200) {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  return trimmed.length > max ? trimmed.slice(0, max) : trimmed;
}

function normalizeAggregate(raw, expectedUid) {
  if (!raw || typeof raw !== "object") return null;

  const uid = toBoundedString(raw.uid, 200);
  if (!uid || uid !== expectedUid) return null;

  const date = toBoundedString(raw.date, 10);
  if (!DATE_PATTERN.test(date)) return null;

  const aggregate = { uid, date };
  STRING_FIELDS.forEach((field) => {
    if (field === "uid" || field === "date") return;
    aggregate[field] = toBoundedString(raw[field], 200) || "unknown";
  });

  let totalCounter = 0;
  COUNTER_FIELDS.forEach((field) => {
    const value = toFiniteNumber(raw[field]);
    aggregate[field] = value;
    totalCounter += value;
  });

  if (totalCounter === 0) return null;

  return aggregate;
}

async function writeAggregate(db, aggregate, expiresAt) {
  const docRef = db
    .collection(READ_TELEMETRY_COLLECTION)
    .doc(buildAggregateDocId(aggregate));

  const payload = {
    date: aggregate.date,
    uid: aggregate.uid,
    screenName: aggregate.screenName,
    collectionName: aggregate.collectionName,
    collectionPathPattern: aggregate.collectionPathPattern,
    platform: aggregate.platform,
    appVersion: aggregate.appVersion,
    updatedAt: FieldValue.serverTimestamp(),
    expiresAt,
  };

  COUNTER_FIELDS.forEach((field) => {
    payload[field] = FieldValue.increment(aggregate[field]);
  });

  await docRef.set(payload, { merge: true });
}

export default async function handler(req, res) {
  const requestId = buildRequestId();
  res.setHeader("X-Request-Id", requestId);

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed", requestId });
  }

  let decoded;
  try {
    decoded = await requireAuth(req);
  } catch (error) {
    const statusCode = error?.statusCode || 401;
    return res.status(statusCode).json({
      error: error?.message || "Unauthorized",
      requestId,
    });
  }

  const uid = decoded?.uid;
  if (!uid) {
    return res.status(401).json({ error: "Unauthorized", requestId });
  }

  const rawAggregates = Array.isArray(req.body?.aggregates)
    ? req.body.aggregates
    : null;

  if (!rawAggregates) {
    return res.status(400).json({
      error: "Missing aggregates array",
      requestId,
    });
  }

  if (rawAggregates.length > MAX_AGGREGATES_PER_REQUEST) {
    return res.status(413).json({
      error: `Too many aggregates (max ${MAX_AGGREGATES_PER_REQUEST})`,
      requestId,
    });
  }

  const normalized = [];
  const rejected = [];
  rawAggregates.forEach((raw, index) => {
    const aggregate = normalizeAggregate(raw, uid);
    if (aggregate) {
      normalized.push(aggregate);
    } else {
      rejected.push(index);
    }
  });

  let config = READ_TELEMETRY_DEFAULT_CONFIG;
  try {
    config = await getReadTelemetryConfig();
  } catch (error) {
    console.warn("[mobile.firestore-read-telemetry] config fetch failed", {
      requestId,
      message: error?.message || String(error),
    });
  }

  if (config.enabled === false || normalized.length === 0) {
    return res.status(200).json({
      ok: true,
      written: 0,
      rejected: rejected.length,
      config,
      requestId,
    });
  }

  const db = getAdminDb();
  const expiresAt = new Date(
    Date.now() + READ_TELEMETRY_RETENTION_DAYS * 24 * 60 * 60 * 1000
  );

  let written = 0;
  const writeErrors = [];
  await Promise.all(
    normalized.map(async (aggregate) => {
      try {
        await writeAggregate(db, aggregate, expiresAt);
        written += 1;
      } catch (error) {
        writeErrors.push({
          message: error?.message || String(error),
        });
      }
    })
  );

  if (writeErrors.length > 0) {
    console.warn("[mobile.firestore-read-telemetry] partial write failure", {
      requestId,
      uid,
      total: normalized.length,
      failed: writeErrors.length,
      sampleError: writeErrors[0]?.message,
    });
  }

  if (writeErrors.length === normalized.length) {
    return res.status(502).json({
      error: "Failed to persist telemetry",
      requestId,
      config,
    });
  }

  return res.status(200).json({
    ok: true,
    written,
    rejected: rejected.length,
    failed: writeErrors.length,
    config,
    requestId,
  });
}
