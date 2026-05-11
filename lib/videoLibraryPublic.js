import { extractVimeoId, normalizeLocale } from "./courses";
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

/** Clips created strictly before this instant are excluded from /premium spotlight; matches YouTube/Vimeo “treat as free” workaround cutoff on /videouri. */
export const VIDEO_LIBRARY_PREMIUM_SPOTLIGHT_MIN_CREATED_MS = Date.UTC(2026, 4, 2, 0, 0, 0);

/** @param {{ createdAt?: unknown; updatedAt?: unknown }} row */
export function isVideoCreatedBeforePremiumSpotlightCutoff(row) {
  if (!row || typeof row !== "object") return false;
  const ms = firestoreTsToMillis(row.createdAt) ?? firestoreTsToMillis(row.updatedAt);
  if (ms == null) return false;
  return ms < VIDEO_LIBRARY_PREMIUM_SPOTLIGHT_MIN_CREATED_MS;
}

export function isVideoPublishScheduled(value, nowMs) {
  const ms = firestoreTsToMillis(value);
  if (ms == null) return false;
  return ms > nowMs;
}

const BUNNY_VIDEO_UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function getDefaultBunnyLibraryId() {
  if (typeof process === "undefined" || !process.env) return null;
  const v = process.env.NEXT_PUBLIC_BUNNY_STREAM_LIBRARY_ID;
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

/**
 * Resolve Bunny library + video id for a safe embed URL.
 * Accepts: embed/play URLs on player.mediadelivery.net or iframe.mediadelivery.net,
 * video.bunnycdn.com/play URLs, `libraryId/videoId`, or bare video UUID when NEXT_PUBLIC_BUNNY_STREAM_LIBRARY_ID is set.
 *
 * @param {string} videoUrl
 * @returns {{ libraryId: string, videoId: string } | null}
 */
export function extractBunnyEmbedParts(videoUrl) {
  if (typeof videoUrl !== "string" || !videoUrl.trim()) return null;
  const trimmed = videoUrl.trim();

  const slashOnly = trimmed.match(
    /^([^/\s]+)\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\/?$/i
  );
  if (slashOnly) {
    return { libraryId: slashOnly[1], videoId: slashOnly[2] };
  }

  if (BUNNY_VIDEO_UUID_RE.test(trimmed)) {
    const lib = getDefaultBunnyLibraryId();
    if (!lib) return null;
    return { libraryId: lib, videoId: trimmed };
  }

  let url;
  try {
    if (trimmed.startsWith("//")) {
      url = new URL(`https:${trimmed}`);
    } else {
      url = new URL(trimmed);
    }
  } catch (_) {
    try {
      url = new URL(`https://${trimmed}`);
    } catch {
      return null;
    }
  }

  const host = url.hostname.toLowerCase();

  if (host === "player.mediadelivery.net" || host === "iframe.mediadelivery.net") {
    const embedMatch = url.pathname.match(/^\/embed\/([^/]+)\/([^/?#]+)\/?$/);
    if (embedMatch) return { libraryId: embedMatch[1], videoId: embedMatch[2] };

    const playMatch = url.pathname.match(/^\/play\/([^/]+)\/([^/?#]+)\/?$/);
    if (playMatch) return { libraryId: playMatch[1], videoId: playMatch[2] };
  }

  if (host === "video.bunnycdn.com") {
    const playMatch = url.pathname.match(/^\/play\/([^/]+)\/([^/?#]+)\/?$/);
    if (playMatch) return { libraryId: playMatch[1], videoId: playMatch[2] };
  }

  return null;
}

function getBunnyStreamCdnHostname() {
  if (typeof process === "undefined" || !process.env) return "";
  const v = process.env.NEXT_PUBLIC_BUNNY_STREAM_CDN_HOSTNAME;
  if (typeof v !== "string" || !v.trim()) return "";
  return v.trim().replace(/^https?:\/\//i, "").replace(/\/$/, "");
}

/**
 * Public poster thumbnail for Bunny Stream grid cards (when Firestore thumbnailUrl is empty).
 * Prefer NEXT_PUBLIC_BUNNY_STREAM_CDN_HOSTNAME ({pull_zone}.b-cdn.net per Bunny docs); otherwise tries Bunny CDN thumbnail route.
 *
 * @param {string} platform
 * @param {string} effectiveVideoUrl
 * @returns {string | null}
 */
export function resolveBunnyThumbnailFromVideoUrl(platform, effectiveVideoUrl) {
  if (platform !== "bunny") return null;
  const trimmed = typeof effectiveVideoUrl === "string" ? effectiveVideoUrl.trim() : "";
  if (!trimmed) return null;
  const parts = extractBunnyEmbedParts(trimmed);
  if (!parts) return null;

  const cdnHost = getBunnyStreamCdnHostname();
  if (cdnHost) {
    return `https://${cdnHost}/${parts.videoId}/thumbnail.jpg`;
  }

  return `https://thumbnail.mediadelivery.net/${parts.libraryId}/${parts.videoId}/thumbnail.jpg`;
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

export function normalizeVideoPlatform(platform) {
  return platform === "vimeo" || platform === "youtube" || platform === "bunny" ? platform : "youtube";
}

function localeEntryHasVideoUrl(entry) {
  if (!entry || typeof entry !== "object") return false;
  const v = entry.videoUrl;
  return typeof v === "string" && v.trim().length > 0;
}

/** True if any locales.* blob has non-empty videoUrl (strict per-locale mode). */
export function hasAnyLocalizedVideoUrl(row) {
  const locales = row?.locales;
  if (!locales || typeof locales !== "object") return false;
  return Object.keys(locales).some((k) => localeEntryHasVideoUrl(locales[k]));
}

/**
 * Raw playback URL string for viewer locale, or "" if none / wrong locale for strict docs.
 * Keys in `row.locales` must match normalized locales (base language code only — same rule as `normalizeLocale` in courses.js).
 * @param {object} row Firestore-shaped video doc
 * @param {string} localeNorm lowercase base locale code (e.g. "ro")
 */
export function resolveRowVideoSource(row, localeNorm) {
  const L =
    typeof localeNorm === "string" && localeNorm.trim()
      ? localeNorm.trim().toLowerCase().replace("_", "-").split("-")[0]
      : "ro";
  const root = typeof row.videoUrl === "string" ? row.videoUrl.trim() : "";

  if (!hasAnyLocalizedVideoUrl(row)) {
    return root;
  }
  const locales = row.locales;
  const blob = locales[L];
  if (blob && typeof blob.videoUrl === "string" && blob.videoUrl.trim()) {
    return blob.videoUrl.trim();
  }
  return "";
}

/**
 * Denormalized root videoUrl: prefer ordered locales then first non-empty.
 * @param {Record<string, { videoUrl?: string }>} locales
 * @param {string[]} orderedLocaleIds
 */
export function deriveRootVideoUrlFromLocales(locales, orderedLocaleIds = []) {
  if (!locales || typeof locales !== "object") return "";
  const order = [...orderedLocaleIds];
  if (order.length === 0) {
    order.push("ro");
  }
  for (const lc of order) {
    const u = locales[lc]?.videoUrl;
    if (typeof u === "string" && u.trim()) return u.trim();
  }
  for (const key of Object.keys(locales)) {
    const u = locales[key]?.videoUrl;
    if (typeof u === "string" && u.trim()) return u.trim();
  }
  return "";
}

/** True iff row resolves to a playable embed for the given viewer locale. */
export function rowHasValidEmbedForLocale(row, localeRaw) {
  const localeNorm = normalizeLocale(localeRaw, "ro");
  const platform = normalizeVideoPlatform(row.platform);
  const raw = resolveRowVideoSource(row, localeNorm);
  if (!raw) return false;
  return Boolean(resolveLibraryEmbedSrc(platform, raw));
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
