import { normalizeLocale, parseQueryPositiveLimit, readSingleQueryValue } from "../../../lib/courses";
import { getAdminDb } from "../../../lib/firebaseAdmin";
import { setDynamicPublicCacheHeaders } from "../../../lib/httpCache";
import { isSubscriptionSystemEnabled } from "../../../lib/globalSettings";
import { loadPublicArticles } from "../../../lib/publicArticlesSimple";
import { loadPremiumVideoLibraryRows, loadPremiumVideoLibraryVideos } from "../../../lib/loadPremiumVideoLibrary";
import { hasPremiumAccess } from "../../../lib/premiumAccess";
import { getOptionalAuth } from "../../../lib/requireAuth";
import { firestoreTsToMillis } from "../../../lib/videoLibraryPublic";

const DEFAULT_ARTICLES_LIMIT = 3;
const DEFAULT_VIDEOS_LIMIT = 6;
const MAX_HOME_LIMIT = 20;

function buildRequestId() {
  return `content_home_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

const normalizeHomeLimit = (rawValue, fallback) => {
  const parsed = parseQueryPositiveLimit(rawValue, MAX_HOME_LIMIT);
  if (parsed == null) return fallback;
  return parsed;
};

function getNextVideoPublishAtMs(rows, nowMs) {
  let nextValue = null;
  for (const row of rows) {
    const publishMs = firestoreTsToMillis(row?.publishAt);
    if (!Number.isFinite(publishMs) || publishMs <= nowMs) continue;
    if (nextValue == null || publishMs < nextValue) {
      nextValue = publishMs;
    }
  }
  return nextValue;
}

export default async function handler(req, res) {
  const requestId = buildRequestId();
  res.setHeader("X-Request-Id", requestId);

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed", requestId });
  }

  const hasAuthHeader = typeof req.headers?.authorization === "string" && req.headers.authorization.trim() !== "";
  const decoded = await getOptionalAuth(req);
  const uid = decoded?.uid || null;

  try {
    const localeRaw = readSingleQueryValue(req.query.locale);
    const locale = normalizeLocale(localeRaw, "ro");
    const articlesLimit = normalizeHomeLimit(req.query.articlesLimit, DEFAULT_ARTICLES_LIMIT);
    const videosLimit = normalizeHomeLimit(req.query.videosLimit, DEFAULT_VIDEOS_LIMIT);

    let premiumActive = false;
    if (uid) {
      const db = getAdminDb();
      const userSnap = await db.collection("Users").doc(uid).get();
      if (userSnap.exists) {
        premiumActive = hasPremiumAccess(userSnap.data() || {});
      }
    }

    const clientRaw = readSingleQueryValue(req.query.client);
    const isWebClient = typeof clientRaw === "string" && clientRaw.trim().toLowerCase() === "web";
    const subscriptionEnabled = await isSubscriptionSystemEnabled();
    if (!subscriptionEnabled && !isWebClient) {
      premiumActive = true;
    }

    const [articlesPayload, videos, videoRows] = await Promise.all([
      loadPublicArticles({
        locale,
        limit: articlesLimit,
      }),
      loadPremiumVideoLibraryVideos({
        locale,
        premiumActive,
        previewLimit: videosLimit,
      }),
      loadPremiumVideoLibraryRows(),
    ]);

    const nowMs = Date.now();
    const nextVideoPublishAtMs = getNextVideoPublishAtMs(videoRows, nowMs);
    const nextArticlePublishAtMs =
      typeof articlesPayload?.nextPublishAtMs === "number" ? articlesPayload.nextPublishAtMs : null;
    const nextPublishAtMs = [nextArticlePublishAtMs, nextVideoPublishAtMs]
      .filter((value) => Number.isFinite(value) && value > nowMs)
      .sort((a, b) => a - b)[0] || null;

    let cacheTtlSec = 0;
    if (uid || hasAuthHeader) {
      res.setHeader("Cache-Control", "private, no-store, max-age=0");
    } else {
      const cacheMeta = setDynamicPublicCacheHeaders(res, {
        nowMs,
        nextPublishAtMs,
        maxAgeSeconds: 60,
        staleWhileRevalidateSeconds: 60,
      });
      cacheTtlSec = cacheMeta.cacheTtlSec;
    }

    return res.status(200).json({
      locale,
      articles: articlesPayload?.articles || [],
      videos: Array.isArray(videos) ? videos : [],
      nextCursor: articlesPayload?.nextCursor || null,
      premiumActive,
      loggedIn: Boolean(uid),
      generatedAt: new Date(nowMs).toISOString(),
      cacheTtlSec,
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
