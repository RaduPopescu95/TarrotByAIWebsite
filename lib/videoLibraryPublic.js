import { extractVimeoId } from "./courses";
import { getYoutubeEmbedUrl } from "../utils/youtubeLinkUtils";

export function firestoreTsToMillis(value) {
  if (!value) return null;
  try {
    if (typeof value.toMillis === "function") return value.toMillis();
    if (typeof value.toDate === "function") return value.toDate().getTime();
    if (typeof value.seconds === "number") return value.seconds * 1000;
    if (typeof value._seconds === "number") return value._seconds * 1000;
  } catch (_) {}
  return null;
}

export function isVideoPublishScheduled(value, nowMs) {
  const ms = firestoreTsToMillis(value);
  if (ms == null) return false;
  return ms > nowMs;
}

/**
 * Bunny Stream iframe embed host + path `/embed/:libraryId/:videoId` only (no arbitrary src).
 *
 * @param {string} videoUrl
 * @returns {{ libraryId: string, videoId: string } | null}
 */
export function extractBunnyEmbedParts(videoUrl) {
  if (typeof videoUrl !== "string" || !videoUrl.trim()) return null;
  const trimmed = videoUrl.trim();
  let url;
  try {
    url = new URL(trimmed);
  } catch (_) {
    try {
      url = new URL(`https://${trimmed}`);
    } catch {
      return null;
    }
  }
  if (url.hostname.toLowerCase() !== "player.mediadelivery.net") return null;
  const pathMatch = url.pathname.match(/^\/embed\/([^/]+)\/([^/?#]+)\/?$/);
  if (!pathMatch) return null;
  return { libraryId: pathMatch[1], videoId: pathMatch[2] };
}

/**
 * Safe embed URL for iframe src (never return raw arbitrary URL).
 */
export function resolveLibraryEmbedSrc(platform, videoUrl) {
  if (typeof videoUrl !== "string" || !videoUrl.trim()) return null;
  const trimmed = videoUrl.trim();
  if (platform === "youtube") {
    return getYoutubeEmbedUrl(trimmed);
  }
  if (platform === "vimeo") {
    const id = extractVimeoId(trimmed);
    if (!id) return null;
    return `https://player.vimeo.com/video/${id}`;
  }
  if (platform === "bunny") {
    const parts = extractBunnyEmbedParts(trimmed);
    if (!parts) return null;
    return `https://player.mediadelivery.net/embed/${parts.libraryId}/${parts.videoId}`;
  }
  return null;
}

export function resolveVideoLocaleStrings(locales, baseTitle, baseDescription, locale) {
  const base = typeof baseTitle === "string" ? baseTitle : "";
  const descBase = typeof baseDescription === "string" ? baseDescription : "";
  if (!locales || typeof locales !== "object") {
    return { title: base, description: descBase };
  }
  const blob = locales[locale];
  if (blob && typeof blob === "object") {
    const title = typeof blob.title === "string" && blob.title.trim() ? blob.title : base;
    const description =
      typeof blob.description === "string" ? blob.description : descBase || undefined;
    return { title: title || base, description: description ?? descBase };
  }
  return { title: base, description: descBase };
}
