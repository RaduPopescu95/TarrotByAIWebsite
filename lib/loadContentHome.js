import { normalizeLocale, parseQueryPositiveLimit } from "./courses";
import { getAdminDb } from "./firebaseAdmin";
import { isSubscriptionSystemEnabled } from "./globalSettings";
import { loadPublicArticles } from "./publicArticles";
import { loadPremiumVideoLibraryRows, loadPremiumVideoLibraryVideos, loadFeaturedHomeVideos } from "./loadPremiumVideoLibrary";
import { hasPremiumAccess } from "./premiumAccess";
import { getNextVideoTransitionAtMs } from "./videoReleaseSchedule";
import { withFirestoreCostLog } from "./firestoreCostLogger";

export const DEFAULT_ARTICLES_LIMIT = 3;
export const DEFAULT_VIDEOS_LIMIT = 6;
export const MAX_HOME_LIMIT = 20;

export const normalizeHomeLimit = (rawValue, fallback) => {
  const parsed = parseQueryPositiveLimit(rawValue, MAX_HOME_LIMIT);
  if (parsed == null) return fallback;
  return parsed;
};

/**
 * Shared home content loader for `/api/content/home` and SSR pages.
 */
export async function loadContentHome({
  locale = "ro",
  articlesLimit = DEFAULT_ARTICLES_LIMIT,
  videosLimit = DEFAULT_VIDEOS_LIMIT,
  client = null,
  uid = null,
} = {}) {
  const normalizedLocale = normalizeLocale(locale, "ro");

  let premiumActive = false;
  if (uid) {
    const db = getAdminDb();
    const userSnap = await withFirestoreCostLog(
      {
        page: "api.content.home",
        queryName: "Users.premium_by_uid",
        operationType: "document",
      },
      () => db.collection("Users").doc(uid).get()
    );
    if (userSnap.exists) {
      premiumActive = hasPremiumAccess(userSnap.data() || {});
    }
  }

  const isWebClient = typeof client === "string" && client.trim().toLowerCase() === "web";
  const subscriptionEnabled = await isSubscriptionSystemEnabled();
  if (!subscriptionEnabled && !isWebClient) {
    premiumActive = true;
  }

  const [articlesPayload, featuredVideos, videoRows] = await Promise.all([
    loadPublicArticles({
      locale: normalizedLocale,
      limit: articlesLimit,
    }),
    loadFeaturedHomeVideos({
      locale: normalizedLocale,
      premiumActive,
      webClient: isWebClient,
    }),
    loadPremiumVideoLibraryRows(),
  ]);

  const featuredIds = new Set(
    (Array.isArray(featuredVideos) ? featuredVideos : [])
      .map((video) => (typeof video?.id === "string" ? video.id.trim() : ""))
      .filter(Boolean)
  );

  const videos = await loadPremiumVideoLibraryVideos({
    locale: normalizedLocale,
    premiumActive,
    previewLimit: videosLimit,
    webClient: isWebClient,
    excludeIds: featuredIds,
  });

  const nowMs = Date.now();
  const nextVideoPublishAtMs = getNextVideoTransitionAtMs(videoRows, nowMs);
  const nextArticlePublishAtMs =
    typeof articlesPayload?.nextPublishAtMs === "number" ? articlesPayload.nextPublishAtMs : null;
  const nextPublishAtMs =
    [nextArticlePublishAtMs, nextVideoPublishAtMs]
      .filter((value) => Number.isFinite(value) && value > nowMs)
      .sort((a, b) => a - b)[0] || null;

  return {
    locale: normalizedLocale,
    articles: articlesPayload?.articles || [],
    featuredVideos: Array.isArray(featuredVideos) ? featuredVideos : [],
    videos: Array.isArray(videos) ? videos : [],
    nextCursor: articlesPayload?.nextCursor || null,
    premiumActive,
    loggedIn: Boolean(uid),
    nextPublishAtMs,
    generatedAt: new Date(nowMs).toISOString(),
  };
}
