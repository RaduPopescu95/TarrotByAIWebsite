import {
  buildCourseMediaLocales,
  extractLocaleVideoUrlsFromMedia,
  extractVimeoId,
  normalizeCourseMediaForRead,
  normalizeCoursePlatform,
} from "./courses";

export function mergeCourseMediaInput(input = {}) {
  const localeVideoUrls =
    input.localeVideoUrls && typeof input.localeVideoUrls === "object"
      ? input.localeVideoUrls
      : input.localeVimeoUrls && typeof input.localeVimeoUrls === "object"
        ? input.localeVimeoUrls
        : undefined;
  const platform = normalizeCoursePlatform(input.platform);
  const rootVideoUrl =
    typeof input.videoUrl === "string"
      ? input.videoUrl.trim()
      : typeof input.vimeoUrl === "string"
        ? input.vimeoUrl.trim()
        : "";
  return { localeVideoUrls, platform, rootVideoUrl };
}

export function attachCourseMediaFields(course, media) {
  const normalized = normalizeCourseMediaForRead(media, course);
  const localeVideoUrls = extractLocaleVideoUrlsFromMedia(media, normalized.videoUrl);
  const vimeoId =
    normalized.platform === "vimeo" && normalized.videoUrl
      ? extractVimeoId(normalized.videoUrl)
      : null;

  return {
    ...course,
    platform: normalized.platform,
    videoUrl: normalized.videoUrl,
    vimeoUrl: normalized.videoUrl,
    vimeoId,
    localeVideoUrls,
    localeVimeoUrls: localeVideoUrls,
  };
}

export function buildCourseMediaPayload({ platform, rootVideoUrl, localeVideoUrls }) {
  const normalizedPlatform = normalizeCoursePlatform(platform);
  const locales = localeVideoUrls
    ? buildCourseMediaLocales(localeVideoUrls, rootVideoUrl, normalizedPlatform)
    : {};

  return {
    platform: normalizedPlatform,
    videoUrl: rootVideoUrl || null,
    ...(Object.keys(locales).length > 0 ? { locales } : {}),
  };
}
