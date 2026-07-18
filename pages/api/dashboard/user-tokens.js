import { FieldPath } from "firebase-admin/firestore";
import { getAdminDb } from "../../../lib/firebaseAdmin";
import {
  applyUserTokenFilters,
  buildUserTokenBulkDeletePlan,
  collectDistinctCities,
  computeUserTokenStats,
  hasActiveUserTokenFilters,
  mapUserTokenDoc,
  normalizeUserTokenFilters,
} from "../../../lib/userTokensDashboard";
import { requireDashboardAccess } from "../../../lib/requireAuth";
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;
const BATCH_SIZE = 200;
const MAX_SCAN_DOCS = 5000;
const DELETE_BATCH_LIMIT = 400;
const DELETE_CONFIRM_TEXT = "STERGE TOKENS";

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

function normalizeIdList(value) {
  if (Array.isArray(value)) {
    return [...new Set(value.map((item) => String(item || "").trim()).filter(Boolean))];
  }

  if (typeof value === "string") {
    return [...new Set(value.split(/[\n,;]+/).map((item) => item.trim()).filter(Boolean))];
  }

  return [];
}

function readBody(req) {
  if (!req.body) return {};
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  if (typeof req.body === "object") {
    return req.body;
  }
  return {};
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

async function scanUserTokens({
  db,
  cursor = null,
  limit = DEFAULT_LIMIT,
  filters = {},
  collectAllMatches = false,
}) {
  const normalizedFilters = normalizeUserTokenFilters(filters);
  const filtersActive = hasActiveUserTokenFilters(normalizedFilters);
  const matched = [];
  const scannedRows = [];
  let scanCursor = cursor || null;
  let scannedCount = 0;
  let scanTruncated = false;
  let lastDocId = null;

  if (!filtersActive && !collectAllMatches) {
    const docs = await fetchUserTokenBatch(db, cursor || null, limit);
    docs.forEach((docSnap) => {
      const row = mapUserTokenDoc(docSnap);
      matched.push(row);
      scannedRows.push(row);
    });
    return {
      matchedRows: matched,
      scannedRows,
      scannedCount: docs.length,
      scanTruncated: false,
      lastDocId: docs.length > 0 ? docs[docs.length - 1].id : null,
      filters: normalizedFilters,
      filtersActive,
    };
  }

  while (scannedCount < MAX_SCAN_DOCS) {
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
      if (!filtersActive || applyUserTokenFilters([row], normalizedFilters).length > 0) {
        matched.push(row);
      }
    });

    if (!collectAllMatches && matched.length >= limit) {
      break;
    }

    if (docs.length < batchSize) {
      break;
    }
  }

  if (scannedCount >= MAX_SCAN_DOCS) {
    scanTruncated = true;
  }

  return {
    matchedRows: matched,
    scannedRows,
    scannedCount,
    scanTruncated,
    lastDocId,
    filters: normalizedFilters,
    filtersActive,
  };
}

function buildPreviewPayload(plan, scanResult, requestId, filters) {
  return {
    mode: plan.mode,
    collectionCount: plan.collectionCount,
    matchedCount: plan.matchedCount,
    selectedCount: plan.selectedCount,
    excludedCount: plan.excludedCount,
    deleteCount: plan.deleteCount,
    invalidSelectedCount: plan.invalidSelectedCount,
    scanTruncated: scanResult.scanTruncated,
    scannedCount: scanResult.scannedCount,
    filters,
    requestId,
  };
}

async function handleGet(req, res, requestId) {
  const limit = parseLimit(readQueryParam(req.query, "limit"));
  const cursor = readQueryParam(req.query, "cursor");
  const includeStats = readQueryParam(req.query, "stats") === "1";
  const filters = normalizeUserTokenFilters({
    search: readQueryParam(req.query, "search"),
    city: readQueryParam(req.query, "city"),
    cityIn: readQueryParam(req.query, "cityIn"),
    cityNotIn: readQueryParam(req.query, "cityNotIn"),
    modelFilter: readQueryParam(req.query, "modelFilter") || "all",
    disabledOnly: readQueryParam(req.query, "disabledOnly"),
    missingName: readQueryParam(req.query, "missingName"),
    missingCity: readQueryParam(req.query, "missingCity"),
  });

  const db = getAdminDb();
  const scanResult = await scanUserTokens({
    db,
    cursor,
    limit,
    filters,
    collectAllMatches: false,
  });

  const pageTokens = scanResult.matchedRows.slice(0, limit);
  const nextCursor = scanResult.lastDocId && pageTokens.length === limit ? scanResult.lastDocId : null;
  const hasMore = Boolean(nextCursor);
  const stats = computeUserTokenStats(includeStats ? scanResult.scannedRows : pageTokens);
  const cities = collectDistinctCities(scanResult.scannedRows);

  console.info("[dashboard/user-tokens]", {
    requestId,
    method: "GET",
    limit,
    cursor: cursor || null,
    filters,
    filtersActive: scanResult.filtersActive,
    returned: pageTokens.length,
    scannedCount: scanResult.scannedCount,
    scanTruncated: scanResult.scanTruncated,
  });

  return res.status(200).json({
    tokens: pageTokens,
    total: pageTokens.length,
    nextCursor,
    hasMore,
    stats,
    cities,
    scanTruncated: scanResult.scanTruncated,
    scannedCount: scanResult.scannedCount,
    requestId,
  });
}

async function handlePreview(req, res, requestId) {
  const body = readBody(req);
  if (body.action !== "previewDelete") {
    return res.status(400).json({ error: "Invalid action", requestId });
  }

  const mode =
    body.mode === "delete_selected" ? "delete_selected" : "delete_all_except_selected";
  const filters = normalizeUserTokenFilters(body.filters || {});
  const selectedIds = normalizeIdList(body.selectedIds);
  const excludedIds = normalizeIdList(body.excludedIds);
  const db = getAdminDb();
  const scanResult = await scanUserTokens({
    db,
    filters: mode === "delete_all_except_selected" ? {} : filters,
    collectAllMatches: true,
  });
  const plan = buildUserTokenBulkDeletePlan(scanResult.matchedRows, {
    mode,
    selectedIds,
    excludedIds,
  });

  console.info("[dashboard/user-tokens]", {
    requestId,
    method: "POST",
    action: body.action,
    mode,
    filters,
    collectionCount: plan.collectionCount,
    matchedCount: plan.matchedCount,
    excludedCount: plan.excludedCount,
    deleteCount: plan.deleteCount,
    invalidSelectedCount: plan.invalidSelectedCount,
    scannedCount: scanResult.scannedCount,
    scanTruncated: scanResult.scanTruncated,
  });

  return res.status(200).json(buildPreviewPayload(plan, scanResult, requestId, filters));
}

async function commitDeleteBatches(db, ids) {
  let deletedCount = 0;
  for (let index = 0; index < ids.length; index += DELETE_BATCH_LIMIT) {
    const chunk = ids.slice(index, index + DELETE_BATCH_LIMIT);
    const batch = db.batch();
    chunk.forEach((id) => {
      batch.delete(db.collection("userTokens").doc(id));
    });
    await batch.commit();
    deletedCount += chunk.length;
  }
  return deletedCount;
}

async function handleDelete(req, res, requestId) {
  const body = readBody(req);
  if (body.action !== "bulkDelete") {
    return res.status(400).json({ error: "Invalid action", requestId });
  }

  const mode =
    body.mode === "delete_selected" ? "delete_selected" : "delete_all_except_selected";
  const filters = normalizeUserTokenFilters(body.filters || {});
  const selectedIds = normalizeIdList(body.selectedIds);
  const excludedIds = normalizeIdList(body.excludedIds);
  const confirmText = String(body.confirmText || "").trim();
  const previewScanTruncated = body.previewScanTruncated === true;

  if (confirmText !== DELETE_CONFIRM_TEXT) {
    return res.status(400).json({
      error: "Invalid confirmation text",
      expectedConfirmText: DELETE_CONFIRM_TEXT,
      requestId,
    });
  }

  if (previewScanTruncated) {
    return res.status(409).json({
      error: "Refine filters before bulk delete",
      scanTruncated: true,
      requestId,
    });
  }

  const db = getAdminDb();
  const scanResult = await scanUserTokens({
    db,
    filters: mode === "delete_all_except_selected" ? {} : filters,
    collectAllMatches: true,
  });
  const plan = buildUserTokenBulkDeletePlan(scanResult.matchedRows, {
    mode,
    selectedIds,
    excludedIds,
  });

  if (scanResult.scanTruncated) {
    return res.status(409).json({
      error: "Refine filters before bulk delete",
      ...buildPreviewPayload(plan, scanResult, requestId, filters),
    });
  }

  const deletedCount = await commitDeleteBatches(
    db,
    plan.deletableRows.map((row) => row.id)
  );

  console.info("[dashboard/user-tokens]", {
    requestId,
    method: "DELETE",
    action: body.action,
    mode,
    filters,
    collectionCount: plan.collectionCount,
    matchedCount: plan.matchedCount,
    excludedCount: plan.excludedCount,
    deleteCount: plan.deleteCount,
    invalidSelectedCount: plan.invalidSelectedCount,
    deletedCount,
  });

  return res.status(200).json({
    ...buildPreviewPayload(plan, scanResult, requestId, filters),
    deletedCount,
  });
}

export default async function handler(req, res) {
  const requestId = buildRequestId();
  res.setHeader("X-Request-Id", requestId);

  try {
    requireDashboardAccess(req);
  } catch (error) {
    return res
      .status(error?.statusCode || 401)
      .json({ error: "Unauthorized", requestId });
  }

  try {
    if (req.method === "GET") {
      return await handleGet(req, res, requestId);
    }
    if (req.method === "POST") {
      return await handlePreview(req, res, requestId);
    }
    if (req.method === "DELETE") {
      return await handleDelete(req, res, requestId);
    }

    res.setHeader("Allow", "GET, POST, DELETE");
    return res.status(405).json({ error: "Method not allowed", requestId });
  } catch (err) {
    console.error("[dashboard/user-tokens] handler error", {
      requestId,
      method: req.method,
      message: err?.message || err,
    });
    return res.status(500).json({
      error: "Failed to process user tokens request",
      requestId,
      detail: process.env.NODE_ENV === "development" ? err?.message : undefined,
    });
  }
}
