import { readSingleQueryValue } from "../../../lib/courses";
import { setDynamicPublicCacheHeaders } from "../../../lib/httpCache";
import {
  DEFAULT_ARTICLES_LIMIT,
  DEFAULT_VIDEOS_LIMIT,
  loadContentHome,
  normalizeHomeLimit,
} from "../../../lib/loadContentHome";
import { getOptionalAuth } from "../../../lib/requireAuth";
import { withFirestoreReadTelemetry } from "../../../lib/firestoreCostLogger";
import { normalizeAppPlatform } from "../../../lib/appPlatform";

function buildRequestId() {
  return `content_home_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

async function handler(req, res) {
  const requestId = buildRequestId();
  res.setHeader("X-Request-Id", requestId);

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed", requestId });
  }

  const hasAuthHeader =
    typeof req.headers?.authorization === "string" && req.headers.authorization.trim() !== "";
  const decoded = await getOptionalAuth(req);
  const uid = decoded?.uid || null;

  try {
    const localeRaw = readSingleQueryValue(req.query.locale);
    const clientRaw = readSingleQueryValue(req.query.client);
    const appPlatform = normalizeAppPlatform(req.query.appPlatform);
    const articlesLimit = normalizeHomeLimit(req.query.articlesLimit, DEFAULT_ARTICLES_LIMIT);
    const videosLimit = normalizeHomeLimit(req.query.videosLimit, DEFAULT_VIDEOS_LIMIT);

    const payload = await loadContentHome({
      locale: localeRaw,
      articlesLimit,
      videosLimit,
      client: clientRaw,
      appPlatform,
      uid,
    });

    const nowMs = Date.now();
    let cacheTtlSec = 0;
    if (uid || hasAuthHeader) {
      res.setHeader("Cache-Control", "private, no-store, max-age=0");
    } else {
      const cacheMeta = setDynamicPublicCacheHeaders(res, {
        nowMs,
        nextPublishAtMs: payload.nextPublishAtMs,
        maxAgeSeconds: 300,
        staleWhileRevalidateSeconds:
          payload.nextPublishAtMs != null ? 0 : 600,
      });
      cacheTtlSec = cacheMeta.cacheTtlSec;
    }

    return res.status(200).json({
      ...payload,
      cacheTtlSec,
      requestId,
    });
  } catch (error) {
    console.error("[content.home] failed", {
      requestId,
      message: error?.message || String(error),
      query: req.query || {},
    });
    return res.status(500).json({ error: "Failed to load home content", requestId });
  }
}

export default withFirestoreReadTelemetry("/api/content/home", handler);
