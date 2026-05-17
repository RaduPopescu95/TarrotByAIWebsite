import { normalizeLocale, readSingleQueryValue } from "../../../lib/courses";
import { getAdminDb } from "../../../lib/firebaseAdmin";
import { isSubscriptionSystemEnabled } from "../../../lib/globalSettings";
import { loadPremiumVideoLibraryVideos } from "../../../lib/loadPremiumVideoLibrary";
import { hasPremiumAccess } from "../../../lib/premiumAccess";
import { getOptionalAuth } from "../../../lib/requireAuth";

function buildRequestId() {
  return `vl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
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
  let premiumActive = false;

  if (uid || hasAuthHeader) {
    res.setHeader("Cache-Control", "private, no-store, max-age=0");
  } else {
    res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
  }

  try {
    const db = getAdminDb();
    if (uid) {
      const userSnap = await db.collection("Users").doc(uid).get();
      if (userSnap.exists) {
        premiumActive = hasPremiumAccess(userSnap.data() || {});
      }
    }

    const clientRaw = readSingleQueryValue(req.query.client);
    const isWebClient =
      typeof clientRaw === "string" && clientRaw.trim().toLowerCase() === "web";
    const subscriptionEnabled = await isSubscriptionSystemEnabled();
    if (!subscriptionEnabled && !isWebClient) {
      premiumActive = true;
    }

    const localeRaw = readSingleQueryValue(req.query.locale);
    const locale = normalizeLocale(
      typeof localeRaw === "string" ? localeRaw : undefined,
      "ro"
    );

    const scopeRaw = readSingleQueryValue(req.query.scope);
    const premiumSpotlightOnly = scopeRaw === "premium_zone";

    const videos = await loadPremiumVideoLibraryVideos({
      locale,
      premiumActive,
      premiumSpotlightOnly,
    });

    const responsePayload = {
      videos,
      locale,
      premiumActive,
      loggedIn: Boolean(uid),
    };
    console.info("[premium.video-library] success", {
      requestId,
      uid: uid || null,
      client: isWebClient ? "web" : "default",
      locale,
      scope: scopeRaw || null,
      videosCount: Array.isArray(videos) ? videos.length : 0,
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
