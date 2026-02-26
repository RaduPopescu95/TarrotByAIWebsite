import {
  applyLanguageUpdate,
  findLanguagesForVideoId,
  loadVarianteCartiRecords,
  saveVarianteCartiRecord,
} from "../../../lib/elaiRtdb";
import {
  extractElaiErrorMessage,
  mapElaiVideoToLanguageInfo,
  normalizeElaiStatus,
} from "../../../utils/elaiStatusUtils";

function getEventType(body) {
  return String(
    body?.event || body?.type || body?.eventType || body?.action || body?.trigger || ""
  ).toLowerCase();
}

function getVideoPayload(body) {
  return body?.video || body?.data?.video || body?.data || body;
}

function getVideoId(body, videoPayload) {
  return String(
    videoPayload?._id || videoPayload?.id || body?.video_id || body?.videoId || ""
  ).trim();
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end("Method Not Allowed");
  }

  const expectedSecret = process.env.ELAI_WEBHOOK_SECRET;
  if (expectedSecret) {
    const incoming =
      req.headers?.["x-elai-webhook-secret"] ||
      req.headers?.["x-webhook-secret"] ||
      req.headers?.["x-elai-signature"];
    if (!incoming || incoming !== expectedSecret) {
      return res.status(401).json({ error: "Invalid webhook secret" });
    }
  }

  const body = req.body || {};
  const eventType = getEventType(body);
  const payload = getVideoPayload(body);
  const videoId = getVideoId(body, payload);

  if (!videoId) {
    return res.status(400).json({ error: "Missing video id in webhook payload" });
  }

  try {
    const records = await loadVarianteCartiRecords();
    const touchedByRecordId = new Map();
    const nowIso = new Date().toISOString();

    for (const record of records) {
      const matches = findLanguagesForVideoId(record, videoId);
      if (!matches.length) continue;

      let mutableRecord = record;
      for (const match of matches) {
        let nextInfo = mapElaiVideoToLanguageInfo(payload, match.info, nowIso);

        if (eventType === "video_finished") {
          nextInfo = {
            ...nextInfo,
            elaiStatus: "ready",
            isRendering: false,
            elaiError: "",
          };
        }

        if (eventType === "video_error") {
          const inferred = normalizeElaiStatus(payload?.status);
          nextInfo = {
            ...nextInfo,
            elaiStatus: inferred === "unknown" ? "error" : inferred,
            isRendering: false,
            elaiError: extractElaiErrorMessage(payload?.error || body?.error || payload?.message),
          };
        }

        mutableRecord = applyLanguageUpdate(mutableRecord, match.lang, nextInfo);
      }

      touchedByRecordId.set(mutableRecord.id, mutableRecord);
    }

    for (const record of touchedByRecordId.values()) {
      await saveVarianteCartiRecord(record);
    }

    return res.status(200).json({
      ok: true,
      eventType,
      videoId,
      updatedRecords: touchedByRecordId.size,
    });
  } catch (error) {
    console.error("[elai.webhook] fail", {
      message: error?.message || "unknown_error",
      eventType,
      videoId,
    });
    return res.status(500).json({ error: "Webhook processing failed" });
  }
}
