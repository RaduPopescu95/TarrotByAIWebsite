import { extractVimeoId } from "./courses";
import { sortVideoDocsForPublic } from "./videoLibrarySort";
import {
  isVideoPublishScheduled,
  normalizeVideoPlatform,
  resolveBunnyThumbnailFromVideoUrl,
  resolveLibraryEmbedSrc,
  resolveRowVideoSource,
  resolveVideoLocaleStrings,
} from "./videoLibraryPublic";
import { getYoutubeVideoId } from "../utils/youtubeLinkUtils";

function resolvePublicThumbnailUrl(row, platform, effectiveVideoUrl) {
  const fromDoc = typeof row.thumbnailUrl === "string" ? row.thumbnailUrl.trim() : "";
  if (fromDoc) return fromDoc;

  const url = typeof effectiveVideoUrl === "string" ? effectiveVideoUrl.trim() : "";

  if (platform === "bunny") {
    const bunnyThumb = resolveBunnyThumbnailFromVideoUrl(platform, url);
    return bunnyThumb || null;
  }

  if (platform === "vimeo" && url) {
    const id = extractVimeoId(url);
    if (!id) return null;
    return `https://vumbnail.com/${id}.jpg`;
  }

  if (!url || platform !== "youtube") return null;

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

  const rawVideoUrl = resolveRowVideoSource(row, locale);

  let embedSrc = null;
  const platform = normalizeVideoPlatform(row.platform);

  if (canPlay && rawVideoUrl) {
    embedSrc = resolveLibraryEmbedSrc(platform, rawVideoUrl);
  }

  let lockedReason = null;
  if (!canPlay) {
    lockedReason = "premium_required";
  } else if (!embedSrc) {
    lockedReason = "source_invalid";
  }

  const thumbnailUrl = resolvePublicThumbnailUrl(row, platform, rawVideoUrl);

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
