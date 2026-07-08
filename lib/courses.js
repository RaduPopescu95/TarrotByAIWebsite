import {
  hasAnyLocalizedVideoUrl,
  resolveLibraryEmbedSrc,
} from "./videoLibraryPublic";
import { SITE_LOCALES } from "./siteLocales";

const DEFAULT_LOCALE = "ro";
const EN_LOCALE = "en";

export const COURSE_PLATFORMS = ["youtube", "vimeo", "bunny"];

/** Course default is vimeo (legacy); video library defaults to youtube. */
export function normalizeCoursePlatform(platform) {
  if (platform === "vimeo" || platform === "youtube" || platform === "bunny") return platform;
  return "vimeo";
}

/** Text/content fallback order: requested → RO → EN. */
export function buildCourseLocaleCandidates(locale, fallback = DEFAULT_LOCALE) {
  const normalized = normalizeLocale(locale, fallback);
  return Array.from(new Set([normalized, DEFAULT_LOCALE, EN_LOCALE]));
}

export function resolveDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === "string") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  if (value?.toDate) return value.toDate();
  if (value?.seconds) return new Date(value.seconds * 1000);
  if (value?._seconds) return new Date(value._seconds * 1000);
  return null;
}

export function formatCoursePrice(price, currency = "RON", locale = "ro-RO") {
  if (typeof price !== "number" || !Number.isFinite(price)) return "—";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency || "RON",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(price);
}

/**
 * Normalizes a locale string to a primary language subtag (BCP47 segment before `-`).
 * Video library keys in Firestore must match this shape (e.g. use `zh`, not `zh-tw`).
 */
export function normalizeLocale(value, fallback = DEFAULT_LOCALE) {
  if (typeof value !== "string" || !value.trim()) return fallback;
  const normalized = value.trim().toLowerCase().replace("_", "-");
  const [base] = normalized.split("-");
  return base || fallback;
}

export function readSingleQueryValue(value) {
  if (Array.isArray(value)) return value[0];
  return value;
}

export function parseQueryBoolean(value) {
  const rawValue = readSingleQueryValue(value);
  if (typeof rawValue === "boolean") return rawValue;
  if (typeof rawValue !== "string") return null;
  const normalized = rawValue.trim().toLowerCase();
  if (normalized === "true" || normalized === "1") return true;
  if (normalized === "false" || normalized === "0") return false;
  return null;
}

export function parseQueryPositiveLimit(value, max = 100) {
  const rawValue = readSingleQueryValue(value);
  if (rawValue === undefined || rawValue === null || rawValue === "") return null;
  const parsed = Number(rawValue);
  if (!Number.isInteger(parsed) || parsed <= 0) return null;
  return Math.min(parsed, max);
}

function readLocalizedField(entry, field) {
  if (!entry || typeof entry !== "object" || Array.isArray(entry)) return null;
  const value = entry[field];
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function normalizeDurationMinutes(value) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) return null;
  return parsed;
}

function normalizeLocalizedCurriculumLessons(lessons = []) {
  if (!Array.isArray(lessons)) return [];

  return lessons
    .map((lesson) => {
      if (!lesson || typeof lesson !== "object" || Array.isArray(lesson)) return null;
      const id = typeof lesson.id === "string" ? lesson.id.trim() : "";
      if (!id) return null;

      return {
        id,
        title: readLocalizedField(lesson, "title"),
        summary: readLocalizedField(lesson, "summary"),
      };
    })
    .filter(Boolean);
}

function buildLocalizedLessonsMap(localeEntry) {
  const normalized = normalizeLocalizedCurriculumLessons(localeEntry?.curriculumLessons);
  return new Map(normalized.map((lesson) => [lesson.id, lesson]));
}

function readLocalizedLessonField(localizedLessonsMap, lessonId, field) {
  if (!localizedLessonsMap || !(localizedLessonsMap instanceof Map)) return null;
  const lesson = localizedLessonsMap.get(lessonId);
  if (!lesson) return null;
  const value = lesson[field];
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

export function sanitizeCurriculumLessons(lessons = []) {
  if (!Array.isArray(lessons)) return [];

  const sanitized = lessons
    .map((lesson, index) => {
      if (!lesson || typeof lesson !== "object" || Array.isArray(lesson)) return null;
      const rawId = typeof lesson.id === "string" ? lesson.id.trim() : "";
      const rawTitle = typeof lesson.title === "string" ? lesson.title.trim() : "";
      const rawSummary = typeof lesson.summary === "string" ? lesson.summary.trim() : "";
      const order =
        typeof lesson.order === "number" && Number.isFinite(lesson.order)
          ? Math.trunc(lesson.order)
          : index;

      return {
        id: rawId || `lesson-${index + 1}`,
        title: rawTitle,
        durationMinutes: normalizeDurationMinutes(lesson.durationMinutes),
        summary: rawSummary,
        isCompleted: lesson.isCompleted === true,
        order,
        _index: index,
      };
    })
    .filter(Boolean);

  sanitized.sort((left, right) => {
    if (left.order === right.order) return left._index - right._index;
    return left.order - right.order;
  });

  return sanitized.map((lesson, index) => ({
    id: lesson.id,
    title: lesson.title,
    durationMinutes: lesson.durationMinutes,
    summary: lesson.summary,
    isCompleted: lesson.isCompleted,
    order: index,
  }));
}

export function resolveCourseCategoryName(category, locale = DEFAULT_LOCALE) {
  if (!category || typeof category !== "object") return "";
  const locales = category.locales;
  for (const candidate of buildCourseLocaleCandidates(locale)) {
    const localized =
      locales?.[candidate] && typeof locales[candidate] === "string"
        ? locales[candidate].trim()
        : "";
    if (localized) return localized;
  }
  return typeof category.name === "string" ? category.name.trim() : "";
}

function readMediaLocaleVideoUrl(mediaLocales, localeCode) {
  if (!mediaLocales || typeof mediaLocales !== "object") return null;
  const entry = mediaLocales[localeCode];
  if (!entry || typeof entry !== "object") return null;
  const videoUrl = typeof entry.videoUrl === "string" ? entry.videoUrl.trim() : "";
  if (videoUrl) return videoUrl;
  const legacyVimeo = typeof entry.vimeoUrl === "string" ? entry.vimeoUrl.trim() : "";
  return legacyVimeo || null;
}

/** @deprecated use readMediaLocaleVideoUrl */
function readMediaLocaleVimeoUrl(mediaLocales, localeCode) {
  return readMediaLocaleVideoUrl(mediaLocales, localeCode);
}

/** Normalizes courseMedia + legacy vimeo fields into a video-library-shaped row. */
export function normalizeCourseMediaForRead(mediaData = null, courseData = {}) {
  const platform = normalizeCoursePlatform(mediaData?.platform);
  const rootVideoUrl =
    (typeof mediaData?.videoUrl === "string" && mediaData.videoUrl.trim()) ||
    (typeof mediaData?.vimeoUrl === "string" && mediaData.vimeoUrl.trim()) ||
    (typeof courseData?.vimeoUrl === "string" ? courseData.vimeoUrl.trim() : "") ||
    "";

  const locales = {};
  const rawLocales = mediaData?.locales;
  if (rawLocales && typeof rawLocales === "object") {
    for (const code of Object.keys(rawLocales)) {
      const normalizedCode = normalizeLocale(code, code);
      const url = readMediaLocaleVideoUrl(rawLocales, normalizedCode);
      if (url) {
        locales[normalizedCode] = { videoUrl: url };
      }
    }
  }

  return { platform, videoUrl: rootVideoUrl, locales };
}

function buildPlaybackResult(platform, videoUrl, localeUsed, source, triedLocales = []) {
  const embedSrc = resolveLibraryEmbedSrc(platform, videoUrl);
  if (!embedSrc) return null;
  const vimeoId = platform === "vimeo" ? extractVimeoId(videoUrl) : null;
  return {
    platform,
    provider: platform,
    videoUrl,
    embedSrc,
    vimeoId,
    localeUsed,
    source,
    triedLocales,
  };
}

/**
 * Resolves course playback for the requested locale (YouTube / Vimeo / Bunny).
 * Priority: courseMedia.locales[locale] → ro → en → root videoUrl → legacy courseData.vimeoUrl.
 */
export function resolveCoursePlaybackSource(mediaData = null, courseData = {}, locale = DEFAULT_LOCALE) {
  const row = normalizeCourseMediaForRead(mediaData, courseData);
  const platform = row.platform;
  const candidates = buildCourseLocaleCandidates(locale);
  const triedLocales = [];

  if (hasAnyLocalizedVideoUrl(row)) {
    for (const candidate of candidates) {
      triedLocales.push(candidate);
      const localeUrl = readMediaLocaleVideoUrl(row.locales, candidate);
      if (localeUrl) {
        const hit = buildPlaybackResult(platform, localeUrl, candidate, "courseMedia.locales", triedLocales);
        if (hit) return hit;
      }
    }
  }

  if (row.videoUrl) {
    const hit = buildPlaybackResult(platform, row.videoUrl, DEFAULT_LOCALE, "courseMedia.root", triedLocales);
    if (hit) return hit;
  }

  const legacyCourseUrl =
    typeof courseData?.vimeoUrl === "string" ? courseData.vimeoUrl.trim() : "";
  if (legacyCourseUrl && platform === "vimeo") {
    const hit = buildPlaybackResult(
      "vimeo",
      legacyCourseUrl,
      DEFAULT_LOCALE,
      "course.legacy",
      triedLocales
    );
    if (hit) return hit;
  }

  return {
    platform,
    provider: platform,
    videoUrl: null,
    embedSrc: null,
    vimeoId: null,
    localeUsed: normalizeLocale(locale, DEFAULT_LOCALE),
    source: "none",
    triedLocales,
  };
}

/**
 * Locales where the course has localized title and/or valid playback for that language.
 * Used by course detail language picker (web + mobile).
 * Uses explicit locale entries only (no RO/EN fallback chain) so single-locale courses stay hidden.
 */
export function resolveCourseAvailableLocales(courseData = {}, mediaData = null) {
  const row = normalizeCourseMediaForRead(mediaData, courseData);
  const platform = row.platform;
  const available = [];

  const hasExplicitTitle = (localeCode) => {
    const locales = courseData?.locales;
    if (locales && typeof locales === "object") {
      const title = readLocalizedField(locales[localeCode], "title");
      if (title) return true;
    }
    if (localeCode === DEFAULT_LOCALE) {
      return typeof courseData.title === "string" && courseData.title.trim().length > 0;
    }
    return false;
  };

  const hasExplicitPlayback = (localeCode) => {
    const localeUrl = readMediaLocaleVideoUrl(mediaData?.locales, localeCode);
    if (localeUrl && resolveLibraryEmbedSrc(platform, localeUrl)) {
      return true;
    }
    if (localeCode === DEFAULT_LOCALE && row.videoUrl) {
      return Boolean(resolveLibraryEmbedSrc(platform, row.videoUrl));
    }
    return false;
  };

  for (const lc of SITE_LOCALES) {
    if (hasExplicitTitle(lc) || hasExplicitPlayback(lc)) {
      available.push(lc);
    }
  }

  if (available.length === 0) {
    const rootTitle = typeof courseData.title === "string" ? courseData.title.trim() : "";
    if (rootTitle) {
      return [DEFAULT_LOCALE];
    }
    return [];
  }

  return available.sort((a, b) => a.localeCompare(b));
}

/** Builds courseMedia.locales map from admin localeVideoUrls input. */
export function buildCourseMediaLocales(
  localeVideoUrls = {},
  rootVideoUrl = "",
  platform = "vimeo"
) {
  if (!localeVideoUrls || typeof localeVideoUrls !== "object" || Array.isArray(localeVideoUrls)) {
    return {};
  }

  const normalizedPlatform = normalizeCoursePlatform(platform);
  const locales = {};
  for (const [rawCode, rawUrl] of Object.entries(localeVideoUrls)) {
    const code = normalizeLocale(rawCode, "");
    if (!code) continue;
    const url = typeof rawUrl === "string" ? rawUrl.trim() : "";
    if (!url || !resolveLibraryEmbedSrc(normalizedPlatform, url)) continue;
    locales[code] = { videoUrl: url };
  }

  const rootUrl = typeof rootVideoUrl === "string" ? rootVideoUrl.trim() : "";
  if (
    rootUrl &&
    resolveLibraryEmbedSrc(normalizedPlatform, rootUrl) &&
    !locales[DEFAULT_LOCALE]
  ) {
    locales[DEFAULT_LOCALE] = { videoUrl: rootUrl };
  }

  return locales;
}

/** Flat map locale → videoUrl for admin edit forms. */
export function extractLocaleVideoUrlsFromMedia(mediaData = null, rootVideoUrl = "") {
  const result = {};
  const rootUrl =
    (typeof mediaData?.videoUrl === "string" && mediaData.videoUrl.trim()) ||
    (typeof mediaData?.vimeoUrl === "string" && mediaData.vimeoUrl.trim()) ||
    (typeof rootVideoUrl === "string" ? rootVideoUrl.trim() : "");
  if (rootUrl) {
    result[DEFAULT_LOCALE] = rootUrl;
  }

  const mediaLocales =
    mediaData?.locales && typeof mediaData.locales === "object" ? mediaData.locales : null;
  if (mediaLocales) {
    for (const [code] of Object.entries(mediaLocales)) {
      const normalizedCode = normalizeLocale(code, code);
      const url = readMediaLocaleVideoUrl(mediaLocales, normalizedCode);
      if (url) {
        result[normalizedCode] = url;
      }
    }
  }

  return result;
}

/** @deprecated alias — use extractLocaleVideoUrlsFromMedia */
export const extractLocaleVimeoUrlsFromMedia = extractLocaleVideoUrlsFromMedia;

export function isValidCourseVideoUrl(platform, url) {
  const normalizedPlatform = normalizeCoursePlatform(platform);
  const trimmed = typeof url === "string" ? url.trim() : "";
  if (!trimmed) return false;
  return Boolean(resolveLibraryEmbedSrc(normalizedPlatform, trimmed));
}

export function resolveCourseLocaleFields(data = {}, locale = DEFAULT_LOCALE) {
  const locales = data?.locales;
  const localeCandidates = buildCourseLocaleCandidates(locale);
  const resolved = {
    title: null,
    description: null,
    notesContent: null,
    contactContent: null,
  };

  for (const candidate of localeCandidates) {
    const entry = locales?.[candidate];
    if (!resolved.title) resolved.title = readLocalizedField(entry, "title");
    if (!resolved.description) resolved.description = readLocalizedField(entry, "description");
    if (!resolved.notesContent) resolved.notesContent = readLocalizedField(entry, "notesContent");
    if (!resolved.contactContent)
      resolved.contactContent = readLocalizedField(entry, "contactContent");
  }

  return {
    title: resolved.title || (typeof data.title === "string" ? data.title : ""),
    description: resolved.description || (typeof data.description === "string" ? data.description : ""),
    notesContent: resolved.notesContent || (typeof data.notesContent === "string" ? data.notesContent : ""),
    contactContent:
      resolved.contactContent || (typeof data.contactContent === "string" ? data.contactContent : ""),
  };
}

export function resolveLocalizedCurriculumLessons(data = {}, locale = DEFAULT_LOCALE) {
  const baseLessons = sanitizeCurriculumLessons(data.curriculumLessons);
  const locales = data?.locales;
  const localeCandidates = buildCourseLocaleCandidates(locale);
  const localizedLessonMaps = localeCandidates.map((candidate) =>
    buildLocalizedLessonsMap(locales?.[candidate])
  );

  return baseLessons.map((lesson) => {
    let localizedTitle = null;
    let localizedSummary = null;

    for (const localizedMap of localizedLessonMaps) {
      if (!localizedTitle) {
        localizedTitle = readLocalizedLessonField(localizedMap, lesson.id, "title");
      }
      if (!localizedSummary) {
        localizedSummary = readLocalizedLessonField(localizedMap, lesson.id, "summary");
      }
      if (localizedTitle && localizedSummary) break;
    }

    return {
      ...lesson,
      title: localizedTitle || lesson.title,
      summary: localizedSummary || lesson.summary,
    };
  });
}

export function isCourseVisible(course, nowMs = Date.now()) {
  if (!course) return false;
  if (course.status === "published") return true;
  if (course.status === "scheduled") {
    const scheduledAt = resolveDate(course.scheduledAt);
    return scheduledAt ? scheduledAt.getTime() <= nowMs : false;
  }
  return false;
}

export function extractVimeoId(url) {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.includes("vimeo.com")) return null;
    const parts = parsed.pathname.split("/").filter(Boolean);
    const last = parts[parts.length - 1] || "";
    return /^\d+$/.test(last) ? last : null;
  } catch (_) {
    return null;
  }
}

export function toSafeCourse(courseId, data = {}, locale = DEFAULT_LOCALE, options = {}) {
  const includeDetailContent = options?.includeDetailContent === true;
  const localized = resolveCourseLocaleFields(data, locale);
  const thumbnailUrl =
    typeof data.thumbnailUrl === "string" && data.thumbnailUrl.trim().length > 0
      ? data.thumbnailUrl.trim()
      : null;
  const vimeoPreviewThumbnailUrl =
    typeof data.vimeoPreviewThumbnailUrl === "string" &&
    data.vimeoPreviewThumbnailUrl.trim().length > 0
      ? data.vimeoPreviewThumbnailUrl.trim()
      : null;
  const vimeoPreviewVideoId =
    typeof data.vimeoPreviewVideoId === "string" && /^\d+$/.test(data.vimeoPreviewVideoId.trim())
      ? data.vimeoPreviewVideoId.trim()
      : null;

  const safeCourse = {
    id: courseId,
    title: localized.title,
    description: localized.description,
    categoryIds: Array.isArray(data.categoryIds) ? data.categoryIds : [],
    price: typeof data.price === "number" ? data.price : 0,
    currency: typeof data.currency === "string" ? data.currency : "RON",
    status: typeof data.status === "string" ? data.status : "draft",
    featuredOnHome: data.featuredOnHome === true,
    scheduledAt: data.scheduledAt ?? null,
    hasCustomThumbnail: Boolean(thumbnailUrl),
    thumbnailUrl: thumbnailUrl || vimeoPreviewThumbnailUrl || null,
    hasVimeoPreview: Boolean(vimeoPreviewThumbnailUrl || vimeoPreviewVideoId),
    previewVimeoId: vimeoPreviewVideoId,
    updatedAt: data.updatedAt ?? null,
  };

  if (includeDetailContent) {
    return {
      ...safeCourse,
      curriculumLessons: resolveLocalizedCurriculumLessons(data, locale),
      notesContent: localized.notesContent || "",
      contactContent: localized.contactContent || "",
    };
  }

  return safeCourse;
}

/**
 * Removes playable preview metadata for callers without course entitlement.
 * Static thumbnails remain available via thumbnailUrl.
 */
export function applyCoursePreviewAccessGate(safeCourse, hasAccess) {
  if (!safeCourse || hasAccess === true) {
    return safeCourse;
  }

  return {
    ...safeCourse,
    previewVimeoId: null,
    hasVimeoPreview: false,
  };
}

/**
 * Course detail text (curriculum, notes, contact) is public before purchase — it is
 * orientational. The full course video stays gated by /api/courses/[id]/playback.
 */
export function applyCourseDetailContentGate(safeCourse, _hasAccess) {
  return safeCourse || null;
}

/**
 * Public list/home responses. The preview teaser stays visible for everyone
 * (marketing); paid content is protected by the playback entitlement gate, not
 * by hiding the listing thumbnail.
 */
export function toSafeCourseForPublicCatalog(courseId, data = {}, locale = DEFAULT_LOCALE) {
  return toSafeCourse(courseId, data, locale);
}
