import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "../../../../lib/firebaseAdmin";
import { requireDashboardAccess } from "../../../../lib/requireAuth";
import { renderElaiVideo } from "../../../../lib/elaiApi";
import {
  applyLanguageUpdate,
  loadVarianteCartiRecord,
  saveVarianteCartiRecord,
} from "../../../../lib/elaiRtdb";
import { canRerenderElaiStatus, ensureElaiMeta } from "../../../../utils/elaiStatusUtils";

const MAX_RETRIES = 2;
const COOLDOWN_MS = 6 * 60 * 60 * 1000;
const MAX_ATTEMPTS = 3;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseTimeMs(value) {
  const ms = new Date(value).getTime();
  return Number.isFinite(ms) ? ms : 0;
}

async function renderWith429Backoff(videoId) {
  let attempt = 0;
  while (attempt <= MAX_RETRIES) {
    const result = await renderElaiVideo(videoId);
    if (result.status !== 429) {
      return { ...result, backoffRetries: attempt };
    }

    if (attempt === MAX_RETRIES) {
      return { ...result, backoffRetries: attempt };
    }

    const waitMs = 1000 * (attempt + 1);
    await sleep(waitMs);
    attempt += 1;
  }

  return {
    ok: false,
    status: 500,
    data: null,
    errorMessage: "Unexpected retry flow",
    backoffRetries: MAX_RETRIES,
  };
}

async function writeAuditLog(db, payload) {
  try {
    await db.collection("elaiRerenderAudit").add({
      ...payload,
      createdAt: FieldValue.serverTimestamp(),
      createdAtMs: Date.now(),
    });
  } catch (error) {
    console.error("[admin.elai.rerender] audit_fail", {
      message: error?.message || "unknown_error",
    });
  }
}

export default async function handler(req, res) {
  let dashboardAccess;
  try {
    dashboardAccess = requireDashboardAccess(req);
  } catch (err) {
    return res.status(err.statusCode || 401).json({ error: err.message });
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end("Method Not Allowed");
  }

  const targets = Array.isArray(req.body?.targets) ? req.body.targets : [];
  if (targets.length === 0) {
    return res.status(400).json({ error: "No rerender targets supplied" });
  }

  const db = getAdminDb();
  const recordsMap = new Map();
  const touchedRecordIds = new Set();
  const results = [];

  let attempted = 0;
  let succeeded = 0;
  let failed = 0;
  let stoppedByQuota = false;

  try {
    for (const target of targets) {
      if (stoppedByQuota) {
        results.push({
          ...target,
          ok: false,
          skipped: true,
          reason: "Skipped because a previous target returned 402 quota error",
        });
        continue;
      }

      const recordId = Number(target?.recordId);
      const lang = typeof target?.lang === "string" ? target.lang : "";

      if (!recordId || !lang) {
        failed += 1;
        results.push({ ...target, ok: false, reason: "Invalid target payload" });
        continue;
      }

      if (!recordsMap.has(recordId)) {
        const record = await loadVarianteCartiRecord(recordId);
        if (record) recordsMap.set(recordId, record);
      }

      const record = recordsMap.get(recordId);
      if (!record) {
        failed += 1;
        results.push({ ...target, ok: false, reason: "Record not found" });
        continue;
      }

      const info = ensureElaiMeta(record?.info?.[lang]);
      if (!info._id) {
        failed += 1;
        results.push({ ...target, ok: false, reason: "Video id missing on language" });
        continue;
      }

      if (target?.videoId && target.videoId !== info._id) {
        failed += 1;
        results.push({ ...target, ok: false, reason: "Target videoId does not match record data" });
        continue;
      }

      if (!canRerenderElaiStatus(info.elaiStatus)) {
        failed += 1;
        results.push({
          ...target,
          ok: false,
          reason: `Status ${info.elaiStatus || "unknown"} is not eligible for rerender`,
        });
        continue;
      }

      if (info.rerenderAttempts >= MAX_ATTEMPTS) {
        failed += 1;
        results.push({
          ...target,
          ok: false,
          reason: `Max rerender attempts reached (${MAX_ATTEMPTS})`,
        });
        continue;
      }

      const lastAttemptMs = parseTimeMs(info.lastRenderAttemptAt);
      if (lastAttemptMs && Date.now() - lastAttemptMs < COOLDOWN_MS) {
        failed += 1;
        results.push({
          ...target,
          ok: false,
          reason: "Cooldown active (minimum 6h between retries)",
        });
        continue;
      }

      attempted += 1;
      const renderResult = await renderWith429Backoff(info._id);

      if (!renderResult.ok) {
        failed += 1;

        if (renderResult.status === 402) {
          stoppedByQuota = true;
        }

        results.push({
          ...target,
          ok: false,
          statusCode: renderResult.status,
          backoffRetries: renderResult.backoffRetries,
          reason: renderResult.errorMessage,
        });

        await writeAuditLog(db, {
          action: "rerender_attempt",
          ok: false,
          statusCode: renderResult.status,
          reason: renderResult.errorMessage,
          backoffRetries: renderResult.backoffRetries,
          recordId,
          lang,
          videoId: info._id,
          actor: {
            granted: Boolean(dashboardAccess?.granted),
            expiresAt: dashboardAccess?.expiresAt || null,
          },
        });
        continue;
      }

      const nowIso = new Date().toISOString();
      const nextInfo = {
        ...info,
        isRendering: true,
        elaiStatus: "rendering",
        elaiError: "",
        lastRenderAttemptAt: nowIso,
        lastElaiSyncAt: nowIso,
        rerenderAttempts: info.rerenderAttempts + 1,
      };

      const nextRecord = applyLanguageUpdate(record, lang, nextInfo);
      recordsMap.set(recordId, nextRecord);
      touchedRecordIds.add(recordId);

      succeeded += 1;
      results.push({
        ...target,
        ok: true,
        statusCode: renderResult.status,
        backoffRetries: renderResult.backoffRetries,
      });

      await writeAuditLog(db, {
        action: "rerender_attempt",
        ok: true,
        statusCode: renderResult.status,
        reason: "Render request accepted",
        backoffRetries: renderResult.backoffRetries,
        recordId,
        lang,
        videoId: info._id,
        actor: {
          granted: Boolean(dashboardAccess?.granted),
          expiresAt: dashboardAccess?.expiresAt || null,
        },
      });
    }

    for (const recordId of touchedRecordIds) {
      const record = recordsMap.get(recordId);
      if (record) {
        await saveVarianteCartiRecord(record);
      }
    }

    return res.status(200).json({
      attempted,
      succeeded,
      failed,
      stoppedByQuota,
      touchedRecords: touchedRecordIds.size,
      results,
    });
  } catch (error) {
    console.error("[admin.elai.rerender] fail", {
      message: error?.message || "unknown_error",
    });
    return res.status(500).json({ error: "Failed to execute rerender batch" });
  }
}
