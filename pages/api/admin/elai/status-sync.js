import { requireDashboardAccess } from "../../../../lib/requireAuth";
import {
  applyLanguageUpdate,
  loadVarianteCartiRecord,
  loadVarianteCartiRecords,
  saveVarianteCartiRecord,
} from "../../../../lib/elaiRtdb";
import { getElaiVideo } from "../../../../lib/elaiApi";
import { ensureElaiMeta, mapElaiVideoToLanguageInfo, normalizeElaiStatus } from "../../../../utils/elaiStatusUtils";

const DEFAULT_LIMIT = 200;
const MAX_LIMIT = 200;
const DEFAULT_STALE_HOURS = 6;
const DEFAULT_VERBOSE_LIMIT = 80;
const MAX_VERBOSE_LIMIT = 300;

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

function parseVerboseLimit(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return DEFAULT_VERBOSE_LIMIT;
  return Math.max(1, Math.min(MAX_VERBOSE_LIMIT, Math.trunc(parsed)));
}

function truncateText(value, maxLen = 220) {
  if (typeof value !== "string") return value;
  if (value.length <= maxLen) return value;
  return `${value.slice(0, maxLen)}...`;
}

function readNestedValue(object, path) {
  if (!object || typeof object !== "object") return undefined;
  const parts = path.split(".");
  let current = object;
  for (const part of parts) {
    if (!current || typeof current !== "object") return undefined;
    current = current[part];
  }
  return current;
}

function extractDebugRawStatus(payload) {
  const candidates = [
    payload?.status,
    payload?.state,
    payload?.render_status,
    payload?.renderStatus,
    readNestedValue(payload, "video.status"),
    readNestedValue(payload, "data.status"),
    readNestedValue(payload, "data.video.status"),
    readNestedValue(payload, "result.status"),
    readNestedValue(payload, "result.video.status"),
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) return candidate.trim();
  }

  return null;
}

function getPollDecision(rawInfo, staleMs) {
  const info = ensureElaiMeta(rawInfo);
  if (!info._id) {
    return {
      shouldPoll: false,
      reason: "missing_video_id",
      status: normalizeElaiStatus(info.elaiStatus),
    };
  }

  const status = normalizeElaiStatus(info.elaiStatus);
  if (status !== "ready") {
    return {
      shouldPoll: true,
      reason: "status_not_ready",
      status,
    };
  }

  if (!info.lastElaiSyncAt) {
    return {
      shouldPoll: true,
      reason: "ready_without_last_sync",
      status,
    };
  }

  const ageMs = Date.now() - parseMs(info.lastElaiSyncAt);
  if (ageMs >= staleMs) {
    return {
      shouldPoll: true,
      reason: "ready_but_stale",
      status,
      ageMs,
    };
  }

  return {
    shouldPoll: false,
    reason: "ready_and_fresh",
    status,
    ageMs,
  };
}

export default async function handler(req, res) {
  const requestId = `sync_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const startedAtMs = Date.now();
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
  const verbose = body?.verbose === undefined ? true : Boolean(body.verbose);
  const verboseLimit = parseVerboseLimit(body?.verboseLimit);
  const trace = [];
  let traceOmitted = 0;

  function addTrace(event, payload = {}) {
    if (!verbose) return;
    if (trace.length >= verboseLimit) {
      traceOmitted += 1;
      return;
    }
    const entry = {
      ts: new Date().toISOString(),
      requestId,
      event,
      ...payload,
    };
    trace.push(entry);
    console.log("[admin.elai.status-sync] trace", entry);
  }

  console.log("[admin.elai.status-sync] start", {
    requestId,
    staleHours,
    limit,
    hasTargets: Array.isArray(body?.targets) && body.targets.length > 0,
    targetsCount: Array.isArray(body?.targets) ? body.targets.length : 0,
    verbose,
    verboseLimit,
  });

  const recordsMap = new Map();
  const targets = [];
  const skippedTargets = [];

  try {
    if (Array.isArray(body.targets) && body.targets.length > 0) {
      for (const target of body.targets) {
        const recordId = Number(target?.recordId);
        const lang = typeof target?.lang === "string" ? target.lang : "";
        const videoId = typeof target?.videoId === "string" ? target.videoId : "";
        if (!recordId || !lang || !videoId) {
          const skipItem = {
            reason: "invalid_target_input",
            recordId,
            lang,
            videoId: videoId || null,
          };
          skippedTargets.push(skipItem);
          addTrace("target_skip", skipItem);
          continue;
        }

        if (!recordsMap.has(recordId)) {
          const record = await loadVarianteCartiRecord(recordId);
          if (record) {
            recordsMap.set(recordId, record);
          } else {
            const skipItem = {
              reason: "record_not_found",
              recordId,
              lang,
              videoId,
            };
            skippedTargets.push(skipItem);
            addTrace("target_skip", skipItem);
            continue;
          }
        }

        const record = recordsMap.get(recordId);
        const info = ensureElaiMeta(record?.info?.[lang]);
        if (!record) {
          const skipItem = {
            reason: "record_not_loaded",
            recordId,
            lang,
            videoId,
          };
          skippedTargets.push(skipItem);
          addTrace("target_skip", skipItem);
          continue;
        }
        if (!info._id) {
          const skipItem = {
            reason: "missing_local_video_id",
            recordId,
            lang,
            requestedVideoId: videoId,
          };
          skippedTargets.push(skipItem);
          addTrace("target_skip", skipItem);
          continue;
        }

        targets.push({
          recordId,
          lang,
          videoId: info._id,
          lastSyncMs: parseMs(info.lastElaiSyncAt),
        });
        addTrace("target_added", {
          source: "manual_targets",
          recordId,
          lang,
          requestedVideoId: videoId,
          localVideoId: info._id,
          currentStatus: info.elaiStatus,
        });
      }
    } else {
      const records = await loadVarianteCartiRecords();
      addTrace("records_loaded", { recordsCount: records.length });
      for (const record of records) {
        recordsMap.set(record.id, record);
        for (const [lang, rawInfo] of Object.entries(record.info || {})) {
          const info = ensureElaiMeta(rawInfo);
          const decision = getPollDecision(rawInfo, staleMs);
          if (!decision.shouldPoll) {
            if (skippedTargets.length < 80) {
              skippedTargets.push({
                reason: decision.reason,
                recordId: record.id,
                lang,
                status: decision.status,
                videoId: info._id || null,
                ageMs: decision.ageMs || null,
              });
            }
            addTrace("target_skip", {
              reason: decision.reason,
              recordId: record.id,
              lang,
              status: decision.status,
              videoId: info._id || null,
              ageMs: decision.ageMs || null,
            });
            continue;
          }

          if (!info._id) {
            const skipItem = {
              reason: "missing_video_id_after_decision",
              recordId: record.id,
              lang,
              status: decision.status,
            };
            skippedTargets.push(skipItem);
            addTrace("target_skip", skipItem);
            continue;
          }

          targets.push({
            recordId: record.id,
            lang,
            videoId: info._id,
            lastSyncMs: parseMs(info.lastElaiSyncAt),
          });
          addTrace("target_added", {
            source: "auto_discovery",
            recordId: record.id,
            lang,
            videoId: info._id,
            reason: decision.reason,
            currentStatus: decision.status,
            ageMs: decision.ageMs || null,
          });
        }
      }
    }

    const sortedTargets = [...targets].sort((a, b) => {
      const aMs = Number.isFinite(a?.lastSyncMs) ? a.lastSyncMs : 0;
      const bMs = Number.isFinite(b?.lastSyncMs) ? b.lastSyncMs : 0;
      return aMs - bMs;
    });
    const limitedTargets = sortedTargets.slice(0, limit);
    if (targets.length > limitedTargets.length) {
      addTrace("target_limit_applied", {
        totalTargets: targets.length,
        limitedTargets: limitedTargets.length,
        droppedByLimit: targets.length - limitedTargets.length,
      });
    }

    addTrace("target_summary", {
      totalTargets: targets.length,
      limitedTargets: limitedTargets.length,
      skippedTargets: skippedTargets.length,
      loadedRecords: recordsMap.size,
      strategy: "oldest_last_sync_first",
    });

    const touchedRecordIds = new Set();
    let processed = 0;
    let updated = 0;
    const errors = [];
    const debugSamples = [];

    for (const target of limitedTargets) {
      const record = recordsMap.get(target.recordId);
      if (!record) {
        addTrace("process_skip", {
          reason: "record_missing_in_map",
          recordId: target.recordId,
          lang: target.lang,
          videoId: target.videoId,
        });
        continue;
      }

      const currentInfo = ensureElaiMeta(record.info?.[target.lang]);
      if (!currentInfo._id) {
        addTrace("process_skip", {
          reason: "current_info_missing_video_id",
          recordId: target.recordId,
          lang: target.lang,
          videoId: target.videoId,
        });
        continue;
      }

      addTrace("elai_fetch_start", {
        recordId: target.recordId,
        lang: target.lang,
        videoId: currentInfo._id,
        currentStatus: currentInfo.elaiStatus,
        hasUrl: Boolean(currentInfo.url),
        lastElaiSyncAt: currentInfo.lastElaiSyncAt || null,
      });

      const fetchStartedAtMs = Date.now();
      const result = await getElaiVideo(currentInfo._id);
      const fetchDurationMs = Date.now() - fetchStartedAtMs;
      processed += 1;

      let nextInfo;
      if (result.ok && result?.data && typeof result.data === "object") {
        nextInfo = mapElaiVideoToLanguageInfo(result.data, currentInfo, nowIso);
        if (debugSamples.length < 10) {
          debugSamples.push({
            recordId: target.recordId,
            lang: target.lang,
            videoId: currentInfo._id,
            rawStatus: extractDebugRawStatus(result.data),
            mappedStatus: nextInfo.elaiStatus,
            hasUrl: Boolean(nextInfo.url),
          });
        }
        addTrace("elai_fetch_ok", {
          recordId: target.recordId,
          lang: target.lang,
          videoId: currentInfo._id,
          statusCode: result.status,
          rawStatus: extractDebugRawStatus(result.data),
          mappedStatus: nextInfo.elaiStatus,
          hasUrl: Boolean(nextInfo.url),
          fetchDurationMs,
          responseKeys: Object.keys(result.data || {}).slice(0, 12),
        });
      } else {
        nextInfo = {
          ...currentInfo,
          elaiError: result.errorMessage,
          lastElaiSyncAt: nowIso,
        };
        addTrace("elai_fetch_fail", {
          recordId: target.recordId,
          lang: target.lang,
          videoId: currentInfo._id,
          statusCode: result.status,
          ok: result.ok,
          error: truncateText(result.errorMessage),
          hasDataObject: Boolean(result?.data && typeof result.data === "object"),
          fetchDurationMs,
          rawTextSample: truncateText(result?.rawText),
        });
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
      addTrace("record_saved", { recordId });
    }

    const errorsByStatus = errors.reduce((acc, item) => {
      const key = String(item?.statusCode || "unknown");
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    const totalDurationMs = Date.now() - startedAtMs;

    console.log("[admin.elai.status-sync] done", {
      requestId,
      candidates: targets.length,
      limitedCandidates: limitedTargets.length,
      processed,
      updated,
      touchedRecords: touchedRecordIds.size,
      errorsCount: errors.length,
      errorsByStatus,
      skippedTargets: skippedTargets.length,
      debugSamples,
      traceCount: trace.length,
      traceOmitted,
      totalDurationMs,
    });

    const payload = {
      requestId,
      staleHours,
      candidates: targets.length,
      limitedCandidates: limitedTargets.length,
      processed,
      updated,
      errors,
      errorsByStatus,
      skippedTargets,
      touchedRecords: touchedRecordIds.size,
      debugSamples,
      totalDurationMs,
    };

    if (verbose) {
      payload.trace = trace;
      payload.traceOmitted = traceOmitted;
      payload.verboseLimit = verboseLimit;
    }

    return res.status(200).json(payload);
  } catch (error) {
    console.error("[admin.elai.status-sync] fail", {
      requestId,
      message: error?.message || "unknown_error",
      stack: error?.stack || null,
      totalDurationMs: Date.now() - startedAtMs,
    });
    return res.status(500).json({ error: "Failed to sync Elai statuses" });
  }
}
