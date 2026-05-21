import moment from "moment";
import { getAdminDb } from "./firebaseAdmin";

const COLLECTION = "BlogArticole";
const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 50;
const SEARCH_FETCH_LIMIT = 200;

const readSingleQueryValue = (value) => (Array.isArray(value) ? value[0] : value);

export const normalizeArticleLocale = (value, fallback = "ro") => {
  if (typeof value !== "string" || !value.trim()) return fallback;
  const [base] = value.trim().toLowerCase().replace("_", "-").split("-");
  return base || fallback;
};

export const parseArticleLimit = (value, fallback = DEFAULT_LIMIT) => {
  const raw = readSingleQueryValue(value);
  if (raw === undefined || raw === null || raw === "") return fallback;
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed <= 0) return fallback;
  return Math.min(parsed, MAX_LIMIT);
};

const serializeFirestoreValue = (value) => {
  if (!value) return value;
  if (value instanceof Date) return value.toISOString();
  if (typeof value?.toDate === "function") return value.toDate().toISOString();
  if (Array.isArray(value)) return value.map(serializeFirestoreValue);
  if (typeof value === "object") {
    const out = {};
    for (const [key, val] of Object.entries(value)) {
      out[key] = serializeFirestoreValue(val);
    }
    return out;
  }
  return value;
};

const parseArticleDateTime = (article) => {
  const now = new Date();
  const hasScheduledDate = Boolean(article?.dataProgramata);
  const hasScheduledTime = Boolean(article?.timpProgramat);
  const fallbackDate = article?.firstUploadDate || moment(now).format("YYYY-MM-DD");
  const fallbackTime = article?.firstUploadtime || "00:00";

  const dateStr = hasScheduledDate
    ? String(article.dataProgramata)
    : hasScheduledTime
      ? moment(now).format("YYYY-MM-DD")
      : String(fallbackDate);
  const timeStr = hasScheduledTime
    ? String(article.timpProgramat)
    : hasScheduledDate
      ? "00:00"
      : String(fallbackTime);

  const parsed = moment(
    `${dateStr} ${timeStr}`.trim(),
    [
      "DD-MM-YYYY HH:mm",
      "YYYY-MM-DD HH:mm",
      "DD.MM.YYYY HH:mm",
      "DD/MM/YYYY HH:mm",
      "DD-MM-YYYY",
      "YYYY-MM-DD",
    ],
    true
  );

  if (parsed.isValid()) return parsed.toDate();

  try {
    const partsDash = String(dateStr).split("-");
    const isYearFirst = partsDash?.[0]?.length === 4;
    const normalizedDate = isYearFirst ? String(dateStr) : partsDash.reverse().join("-");
    const fallbackParsed = new Date(`${normalizedDate}T${timeStr}:00`);
    return Number.isNaN(fallbackParsed.getTime()) ? null : fallbackParsed;
  } catch (_) {
    return null;
  }
};

export const isArticleVisibleNow = (article) => {
  const hasScheduledFields = Boolean(article?.dataProgramata || article?.timpProgramat);
  const scheduledDateTime = parseArticleDateTime(article);
  if (!scheduledDateTime || Number.isNaN(scheduledDateTime.getTime())) {
    return !hasScheduledFields;
  }
  return scheduledDateTime <= new Date();
};

const sortArticlesNewestFirst = (articles) =>
  [...articles].sort((left, right) => {
    const leftDate = parseArticleDateTime(left);
    const rightDate = parseArticleDateTime(right);
    const leftMs = leftDate?.getTime?.() || 0;
    const rightMs = rightDate?.getTime?.() || 0;
    return rightMs - leftMs;
  });

const getLocalizedArticleName = (article, locale) => {
  const mappedLocale =
    locale === "hi" ? "hu" : locale === "id" ? "ru" : locale === "ru" ? "rusa" : locale;
  const value = article?.info?.[mappedLocale]?.nume;
  return typeof value === "string" ? value : "";
};

const docToArticle = (docSnap) => ({
  id: docSnap.id,
  ...serializeFirestoreValue(docSnap.data() || {}),
});

export async function loadPublicArticles({
  limit = DEFAULT_LIMIT,
  category,
  search,
  cursor,
  locale = "ro",
} = {}) {
  const db = getAdminDb();
  const normalizedLimit = parseArticleLimit(limit);
  const normalizedLocale = normalizeArticleLocale(locale);
  const normalizedCategory =
    typeof category === "string" && category.trim() && category !== "All"
      ? category.trim()
      : null;
  const normalizedSearch = typeof search === "string" ? search.trim().toLowerCase() : "";

  let queryRef = db.collection(COLLECTION).orderBy("firstUploadTimestamp", "desc");
  if (normalizedCategory) {
    queryRef = queryRef.where("categorie", "==", normalizedCategory);
  }

  if (cursor && typeof cursor === "string" && cursor.trim() && !normalizedSearch) {
    const cursorSnap = await db.collection(COLLECTION).doc(cursor.trim()).get();
    if (cursorSnap.exists) {
      queryRef = queryRef.startAfter(cursorSnap);
    }
  }

  queryRef = queryRef.limit(normalizedSearch ? SEARCH_FETCH_LIMIT : normalizedLimit);
  const snap = await queryRef.get();
  let articles = snap.docs.map(docToArticle).filter(isArticleVisibleNow);

  if (normalizedSearch) {
    articles = articles.filter((article) =>
      getLocalizedArticleName(article, normalizedLocale).toLowerCase().includes(normalizedSearch)
    );
  }

  articles = sortArticlesNewestFirst(articles);
  if (normalizedSearch) {
    articles = articles.slice(0, normalizedLimit);
  }

  return {
    articles,
    nextCursor: snap.docs.length > 0 ? snap.docs[snap.docs.length - 1].id : null,
    locale: normalizedLocale,
  };
}
