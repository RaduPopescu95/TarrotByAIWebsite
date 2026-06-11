import { FieldPath } from "firebase-admin/firestore";
import { getAdminDb } from "../../../lib/firebaseAdmin";
import {
  applyUserTokenFilters,
  collectDistinctCities,
  computeUserTokenStats,
  hasActiveUserTokenFilters,
  mapUserTokenDoc,
} from "../../../lib/userTokensDashboard";

const DASHBOARD_SECRET = process.env.DASHBOARD_SECRET || "Cristina1994!";
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;
const BATCH_SIZE = 200;
const MAX_SCAN_DOCS = 5000;

function buildRequestId() {
  return `ut_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function parseLimit(raw) {
  const n = parseInt(String(raw ?? ""), 10);
  if (!Number.isFinite(n) || n <= 0) return DEFAULT_LIMIT;
  return Math.min(n, MAX_LIMIT);
}

function readQueryParam(query, key) {
  const value = query?.[key];
  if (typeof value === "string") return value.trim();
  if (Array.isArray(value) && typeof value[0] === "string") return value[0].trim();
  return "";
}

async function fetchUserTokenBatch(db, cursor, batchSize) {
  let q = db.collection("userTokens").orderBy(FieldPath.documentId()).limit(batchSize);
  if (cursor) {
    const cursorSnap = await db.collection("userTokens").doc(cursor).get();
    if (cursorSnap.exists) {
      q = q.startAfter(cursorSnap);
    }
  }
  const snap = await q.get();
  return snap.docs;
}

export default async function handler(req, res) {
  const requestId = buildRequestId();
  res.setHeader("X-Request-Id", requestId);

  const token = req.headers["x-dashboard-token"] || "";
  if (token !== DASHBOARD_SECRET) {
    return res.status(401).json({ error: "Unauthorized", requestId });
  }

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed", requestId });
  }

  const limit = parseLimit(readQueryParam(req.query, "limit"));
  const cursor = readQueryParam(req.query, "cursor");
  const search = readQueryParam(req.query, "search");
  const city = readQueryParam(req.query, "city");
  const modelFilter = readQueryParam(req.query, "modelFilter") || "all";
  const disabledOnly =
    readQueryParam(req.query, "disabledOnly") === "1" ||
    readQueryParam(req.query, "disabledOnly") === "true";
  const includeStats = readQueryParam(req.query, "stats") === "1";

  const filters = { search, city, modelFilter, disabledOnly };
  const filtersActive = hasActiveUserTokenFilters(filters);

  try {
    const db = getAdminDb();
    const matched = [];
    const scannedRows = [];
    let scanCursor = cursor || null;
    let scannedCount = 0;
    let scanTruncated = false;
    let lastDocId = null;

    if (!filtersActive) {
      const docs = await fetchUserTokenBatch(db, cursor || null, limit);
      docs.forEach((docSnap) => {
        const row = mapUserTokenDoc(docSnap);
        matched.push(row);
        scannedRows.push(row);
      });
      scannedCount = docs.length;
      lastDocId = docs.length > 0 ? docs[docs.length - 1].id : null;
    } else {
      while (matched.length < limit && scannedCount < MAX_SCAN_DOCS) {
        const remaining = MAX_SCAN_DOCS - scannedCount;
        const batchSize = Math.min(BATCH_SIZE, remaining);
        const docs = await fetchUserTokenBatch(db, scanCursor, batchSize);
        if (docs.length === 0) break;

        scannedCount += docs.length;
        lastDocId = docs[docs.length - 1].id;
        scanCursor = lastDocId;

        docs.forEach((docSnap) => {
          const row = mapUserTokenDoc(docSnap);
          scannedRows.push(row);
          if (applyUserTokenFilters([row], filters).length > 0) {
            matched.push(row);
          }
        });

        if (docs.length < batchSize) break;
      }
      if (scannedCount >= MAX_SCAN_DOCS) {
        scanTruncated = true;
      }
    }

    const pageTokens = filtersActive ? matched.slice(0, limit) : matched;
    const nextCursor =
      lastDocId && pageTokens.length === limit ? lastDocId : null;
    const hasMore = Boolean(nextCursor);

    const stats = computeUserTokenStats(includeStats ? scannedRows : pageTokens);
    const cities = collectDistinctCities(scannedRows);

    console.info("[dashboard/user-tokens]", {
      requestId,
      limit,
      cursor: cursor || null,
      filters,
      filtersActive,
      returned: pageTokens.length,
      scannedCount,
      scanTruncated,
    });

    return res.status(200).json({
      tokens: pageTokens,
      total: pageTokens.length,
      nextCursor,
      hasMore,
      stats,
      cities,
      scanTruncated,
      scannedCount,
      requestId,
    });
  } catch (err) {
    console.error("[dashboard/user-tokens] GET error", {
      requestId,
      message: err?.message || err,
    });
    return res.status(500).json({
      error: "Failed to load user tokens",
      requestId,
      detail: process.env.NODE_ENV === "development" ? err?.message : undefined,
    });
  }
}
