import { buildScheduledDate, resolveArticleScheduledAt } from "./articleSchedule";

function dateLikeToMs(value) {
  if (!value) return null;
  if (value instanceof Date) {
    const ms = value.getTime();
    return Number.isNaN(ms) ? null : ms;
  }
  if (typeof value === "string" || typeof value === "number") {
    const ms = Date.parse(String(value));
    return Number.isNaN(ms) ? null : ms;
  }
  if (typeof value?.toDate === "function") {
    const dateValue = value.toDate();
    const ms = dateValue?.getTime?.();
    return Number.isFinite(ms) ? ms : null;
  }
  if (typeof value === "object" && typeof value.seconds === "number") {
    return value.seconds * 1000;
  }
  return null;
}

function parseRoDateTimeMs(dateStr, timeStr) {
  if (!dateStr || !timeStr) return null;
  try {
    const [dd, mm, yyyy] = String(dateStr).split("-").map(Number);
    const [hh, min] = String(timeStr).split(":").map(Number);
    if ([dd, mm, yyyy, hh, min].some((part) => !Number.isFinite(part))) return null;
    const ms = new Date(yyyy, mm - 1, dd, hh, min).getTime();
    return Number.isNaN(ms) ? null : ms;
  } catch (_) {
    return null;
  }
}

/** Newest-first sort key for dashboard blog articles. */
export function getBlogArticleSortMs(article) {
  if (!article || typeof article !== "object") return 0;

  const scheduledMs =
    dateLikeToMs(article.scheduledAtTs) ??
    parseRoDateTimeMs(article.dataProgramata, article.timpProgramat);

  if (scheduledMs != null) return scheduledMs;

  const uploadMs =
    parseRoDateTimeMs(article.firstUploadDate, article.firstUploadtime) ??
    parseRoDateTimeMs(article.firstUploadDate, article.firstUploadTime) ??
    dateLikeToMs(article.firstUploadTimestamp);

  if (uploadMs != null) return uploadMs;

  try {
    const resolved = resolveArticleScheduledAt(article);
    const ms = resolved?.getTime?.();
    if (Number.isFinite(ms)) return ms;
  } catch (_) {}

  try {
    const built = buildScheduledDate({
      dataProgramata: article.dataProgramata || "",
      timpProgramat: article.timpProgramat || "",
      fallbackDate: article.firstUploadTimestamp || null,
    });
    const ms = built?.getTime?.();
    if (Number.isFinite(ms)) return ms;
  } catch (_) {}

  return 0;
}

export function sortBlogArticlesDesc(articles = []) {
  return [...articles].sort(
    (left, right) => getBlogArticleSortMs(right) - getBlogArticleSortMs(left)
  );
}

export function mergeBlogArticlesDesc(existing = [], incoming = []) {
  const byDocumentId = new Map();

  for (const item of [...existing, ...incoming]) {
    if (!item) continue;
    const key = item.documentId || item.id;
    if (key == null) continue;
    byDocumentId.set(String(key), item);
  }

  return sortBlogArticlesDesc(Array.from(byDocumentId.values()));
}
