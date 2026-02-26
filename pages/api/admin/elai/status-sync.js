import { requireDashboardAccess } from "../../../../lib/requireAuth";
import {
  applyLanguageUpdate,
  loadVarianteCartiRecord,
  loadVarianteCartiRecords,
  saveVarianteCartiRecord,
} from "../../../../lib/elaiRtdb";
import { getElaiVideo } from "../../../../lib/elaiApi";
import { ensureElaiMeta, mapElaiVideoToLanguageInfo, normalizeElaiStatus } from "../../../../utils/elaiStatusUtils";

const DEFAULT_LIMIT = 120;
const MAX_LIMIT = 200;
const DEFAULT_STALE_HOURS = 6;

function parseLimit(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return DEFAULT_LIMIT;
  return Math.max(1, Math.min(MAX_LIMIT, Math.trunc(parsed)));
}

function parseStaleHours(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_STALE_HOURS;
  return parsed;
}

function parseMs(isoString) {
  const ms = new Date(isoString).getTime();
  return Number.isFinite(ms) ? ms : 0;
}

function shouldPollLanguage(rawInfo, staleMs) {
  const info = ensureElaiMeta(rawInfo);
  if (!info._id) return false;
  const status = normalizeElaiStatus(info.elaiStatus);
  if (status !== "ready") return true;
  if (!info.lastElaiSyncAt) return true;
  return Date.now() - parseMs(info.lastElaiSyncAt) >= staleMs;
}

export default async function handler(req, res) {
  try {
    requireDashboardAccess(req);
  } catch (err) {
    return res.status(err.statusCode || 401).json({ error: err.message });
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end("Method Not Allowed");
  }

  const body = req.body || {};
  const nowIso = new Date().toISOString();
  const staleHours = parseStaleHours(body?.staleHours);
  const staleMs = staleHours * 60 * 60 * 1000;
  const limit = parseLimit(body?.limit);

  const recordsMap = new Map();
  const targets = [];

  try {
    if (Array.isArray(body.targets) && body.targets.length > 0) {
      for (const target of body.targets) {
        const recordId = Number(target?.recordId);
        const lang = typeof target?.lang === "string" ? target.lang : "";
        const videoId = typeof target?.videoId === "string" ? target.videoId : "";
        if (!recordId || !lang || !videoId) continue;

        if (!recordsMap.has(recordId)) {
          const record = await loadVarianteCartiRecord(recordId);
          if (record) recordsMap.set(recordId, record);
        }

        const record = recordsMap.get(recordId);
        const info = ensureElaiMeta(record?.info?.[lang]);
        if (!record || !info._id) continue;

        targets.push({ recordId, lang, videoId: info._id });
      }
    } else {
      const records = await loadVarianteCartiRecords();
      for (const record of records) {
        recordsMap.set(record.id, record);
        for (const [lang, rawInfo] of Object.entries(record.info || {})) {
          if (!shouldPollLanguage(rawInfo, staleMs)) continue;
          const info = ensureElaiMeta(rawInfo);
          targets.push({ recordId: record.id, lang, videoId: info._id });
        }
      }
    }

    const limitedTargets = targets.slice(0, limit);
    const touchedRecordIds = new Set();
    let processed = 0;
    let updated = 0;
    const errors = [];

    for (const target of limitedTargets) {
      const record = recordsMap.get(target.recordId);
      if (!record) continue;

      const currentInfo = ensureElaiMeta(record.info?.[target.lang]);
      if (!currentInfo._id) continue;

      const result = await getElaiVideo(currentInfo._id);
      processed += 1;

      let nextInfo;
      if (result.ok && result?.data?._id) {
        nextInfo = mapElaiVideoToLanguageInfo(result.data, currentInfo, nowIso);
      } else {
        nextInfo = {
          ...currentInfo,
          elaiError: result.errorMessage,
          lastElaiSyncAt: nowIso,
        };
      }

      const nextRecord = applyLanguageUpdate(record, target.lang, nextInfo);
      recordsMap.set(target.recordId, nextRecord);
      touchedRecordIds.add(target.recordId);
      updated += 1;

      if (!result.ok) {
        errors.push({
          recordId: target.recordId,
          lang: target.lang,
          videoId: currentInfo._id,
          statusCode: result.status,
          error: result.errorMessage,
        });
      }
    }

    for (const recordId of touchedRecordIds) {
      await saveVarianteCartiRecord(recordsMap.get(recordId));
    }

    return res.status(200).json({
      staleHours,
      candidates: targets.length,
      processed,
      updated,
      errors,
      touchedRecords: touchedRecordIds.size,
    });
  } catch (error) {
    console.error("[admin.elai.status-sync] fail", {
      message: error?.message || "unknown_error",
    });
    return res.status(500).json({ error: "Failed to sync Elai statuses" });
  }
}
