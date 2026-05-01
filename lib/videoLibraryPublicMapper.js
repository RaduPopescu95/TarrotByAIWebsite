import { sortVideoDocsForPublic } from "./videoLibrarySort";
import {
  isVideoPublishScheduled,
  resolveLibraryEmbedSrc,
  resolveVideoLocaleStrings,
} from "./videoLibraryPublic";
import { getYoutubeVideoId } from "../utils/youtubeLinkUtils";

function resolvePublicThumbnailUrl(row, platform) {
  const fromDoc = typeof row.thumbnailUrl === "string" ? row.thumbnailUrl.trim() : "";
  if (fromDoc) return fromDoc;

  const url = typeof row.videoUrl === "string" ? row.videoUrl.trim() : "";
  if (!url || platform !== "youtube") return null;
  if (url.includes("list=")) return null;

  const id = getYoutubeVideoId(url);
  if (!id) return null;
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}

/**
 * @param {FirebaseFirestore.QuerySnapshot} snapshot
 * @param {number} [nowMs]
 * @returns {object[]} rows with id, sorted for public display
 */
export function collectAndSortPublishedVideos(snapshot, nowMs = Date.now()) {
  const rawList = [];
  snapshot.forEach((docSnap) => {
    if (docSnap.id === "_meta") return;
    const row = docSnap.data() || {};
    if (!row.isPublished) return;
    if (isVideoPublishScheduled(row.publishAt, nowMs)) return;
    rawList.push({
      ...row,
      id: docSnap.id,
    });
  });
  return sortVideoDocsForPublic(rawList);
}

/**
 * @param {object} row Must include id (Firestore doc id).
 * @param {{ locale: string; premiumActive: boolean }} ctx
 */
export function mapVideoRowToPublicDto(row, { locale, premiumActive }) {
  const requiresPremium = row.isPremium === true;
  const canPlay = !requiresPremium || premiumActive;

  const { title, description } = resolveVideoLocaleStrings(
    row.locales,
    row.title,
    row.description,
    locale
  );

  let embedSrc = null;
  const platform =
    row.platform === "vimeo" || row.platform === "youtube" || row.platform === "bunny"
      ? row.platform
      : "youtube";

  if (canPlay && typeof row.videoUrl === "string") {
    embedSrc = resolveLibraryEmbedSrc(platform, row.videoUrl);
  }

  let lockedReason = null;
  if (!canPlay) {
    lockedReason = "premium_required";
  } else if (!embedSrc) {
    lockedReason = "source_invalid";
  }

  const thumbnailUrl = resolvePublicThumbnailUrl(row, platform);

  return {
    id: row.id,
    title: title || "",
    description: typeof description === "string" ? description : "",
    category: typeof row.category === "string" ? row.category : "",
    thumbnailUrl,
    platform,
    durationSeconds: typeof row.durationSeconds === "number" ? row.durationSeconds : null,
    order: typeof row.order === "number" ? row.order : null,
    canPlay,
    isPremium: requiresPremium,
    embedSrc,
    lockedReason,
  };
}
