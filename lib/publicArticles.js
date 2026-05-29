import { getAdminDb } from "./firebaseAdmin";
import { withFirestoreCostLog } from "./firestoreCostLogger";
import { buildScheduledDate, toDateFromUnknown } from "./articleSchedule";

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

const resolveArticleSortDate = (article) =>
  toDateFromUnknown(article?.scheduledAtTs) ||
  buildScheduledDate({
    dataProgramata: article?.dataProgramata,
    timpProgramat: article?.timpProgramat,
    fallbackDate: article?.firstUploadTimestamp || null,
  }) ||
  new Date(0);

const sortArticlesNewestFirst = (articles) =>
  [...articles].sort((left, right) => {
    const leftDate = resolveArticleSortDate(left);
    const rightDate = resolveArticleSortDate(right);
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
  const now = new Date();
  const buildBaseQuery = () => {
    let queryRef = db
      .collection(COLLECTION)
      .where("scheduledAtTs", "<=", now)
      .orderBy("scheduledAtTs", "desc");
    if (normalizedCategory) {
      queryRef = queryRef.where("categorie", "==", normalizedCategory);
    }
    return queryRef;
  };

  const cursorValue =
    cursor && typeof cursor === "string" && cursor.trim() ? cursor.trim() : null;
  let cursorSnap = null;
  if (cursorValue) {
    cursorSnap = await withFirestoreCostLog(
      {
        page: "api.articles",
        locale: normalizedLocale,
        queryName: "BlogArticole.cursor",
        isrRevalidateSeconds: 300,
      },
      () => db.collection(COLLECTION).doc(cursorValue).get()
    );
    if (!cursorSnap.exists) {
      cursorSnap = null;
    }
  }

  // Search mode: fetch visible-now set and filter by text.
  if (normalizedSearch) {
    const queryRef = buildBaseQuery().limit(SEARCH_FETCH_LIMIT);
    const snap = await withFirestoreCostLog(
      {
        page: "api.articles",
        locale: normalizedLocale,
        queryName: "BlogArticole.publicList",
        isrRevalidateSeconds: 300,
      },
      () => queryRef.get()
    );

    let articles = snap.docs.map(docToArticle).filter((article) =>
      getLocalizedArticleName(article, normalizedLocale).toLowerCase().includes(normalizedSearch)
    );

    articles = sortArticlesNewestFirst(articles).slice(0, normalizedLimit);

    return {
      articles,
      nextCursor: null,
      locale: normalizedLocale,
    };
  }

  let queryRef = buildBaseQuery();
  if (cursorSnap) {
    queryRef = queryRef.startAfter(cursorSnap);
  }
  queryRef = queryRef.limit(normalizedLimit);
  const snap = await withFirestoreCostLog(
    {
      page: "api.articles",
      locale: normalizedLocale,
      queryName: "BlogArticole.publicList",
      isrRevalidateSeconds: 300,
    },
    () => queryRef.get()
  );

  const articles = snap.docs.map(docToArticle);

  return {
    articles: sortArticlesNewestFirst(articles),
    nextCursor: snap.docs.length > 0 ? snap.docs[snap.docs.length - 1].id : null,
    locale: normalizedLocale,
  };
}
