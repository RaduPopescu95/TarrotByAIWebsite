const DEFAULT_LOCALE = "ro";

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

export function resolveCourseLocaleFields(data = {}, locale = DEFAULT_LOCALE) {
  const normalizedLocale = normalizeLocale(locale, DEFAULT_LOCALE);
  const locales = data?.locales;
  const localeCandidates = [normalizedLocale, DEFAULT_LOCALE];
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
      curriculumLessons: sanitizeCurriculumLessons(data.curriculumLessons),
      notesContent: localized.notesContent || "",
      contactContent: localized.contactContent || "",
    };
  }

  return safeCourse;
}
