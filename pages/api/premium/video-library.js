import { normalizeLocale, readSingleQueryValue } from "../../../lib/courses";
import { setDynamicPublicCacheHeaders } from "../../../lib/httpCache";
import { loadPremiumVideoLibraryRows, loadPremiumVideoLibraryVideos } from "../../../lib/loadPremiumVideoLibrary";
import { getOptionalAuth } from "../../../lib/requireAuth";
import { firestoreTsToMillis } from "../../../lib/videoLibraryPublic";
import { resolvePublicVideoLibraryPremiumActive } from "../../../lib/videoLibraryAccess";

function buildRequestId() {
  return `vl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

const getNextPublishAtMs = (rows, nowMs) => {
  let nextValue = null;
  for (const row of rows) {
    const publishMs = firestoreTsToMillis(row?.publishAt);
    if (!Number.isFinite(publishMs) || publishMs <= nowMs) continue;
    if (nextValue == null || publishMs < nextValue) {
      nextValue = publishMs;
    }
  }
  return nextValue;
};

export default async function handler(req, res) {
  const requestId = buildRequestId();
  res.setHeader("X-Request-Id", requestId);

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed", requestId });
  }

  const decoded = await getOptionalAuth(req);
  const uid = decoded?.uid || null;

  try {
    const localeRaw = readSingleQueryValue(req.query.locale);
    const locale = normalizeLocale(
      typeof localeRaw === "string" ? localeRaw : undefined,
      "ro"
    );

    const scopeRaw = readSingleQueryValue(req.query.scope);
    const premiumSpotlightOnly = scopeRaw === "premium_zone";

    const premiumActive = await resolvePublicVideoLibraryPremiumActive();

    const [videos, rowsForMeta] = await Promise.all([
      loadPremiumVideoLibraryVideos({
        locale,
        premiumActive,
        premiumSpotlightOnly,
      }),
      loadPremiumVideoLibraryRows(),
    ]);

    const nowMs = Date.now();
    const cacheMeta = setDynamicPublicCacheHeaders(res, {
      nowMs,
      nextPublishAtMs: getNextPublishAtMs(rowsForMeta, nowMs),
      maxAgeSeconds: 300,
      staleWhileRevalidateSeconds: 600,
    });

    const responsePayload = {
      videos,
      locale,
      premiumActive,
      loggedIn: Boolean(uid),
      generatedAt: new Date(nowMs).toISOString(),
      cacheTtlSec: cacheMeta.cacheTtlSec,
    };
    console.info("[premium.video-library] success", {
      requestId,
      uid: uid || null,
      locale,
      scope: scopeRaw || null,
      videosCount: Array.isArray(videos) ? videos.length : 0,
      cacheTtlSec: cacheMeta.cacheTtlSec,
      publicCache: true,
    });
    return res.status(200).json(responsePayload);
  } catch (error) {
    console.error("[premium.video-library] failed", {
      requestId,
      message: error?.message || String(error),
      stackTop: typeof error?.stack === "string" ? error.stack.split("\n").slice(0, 3).join(" | ") : null,
      uid: uid || null,
      query: req.query || {},
    });
    return res.status(500).json({ error: "Failed to load video library", requestId });
  }
}
