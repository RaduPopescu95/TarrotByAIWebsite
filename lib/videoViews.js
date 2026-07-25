import { createHash } from "crypto";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "./firebaseAdmin";
import { getVideoLikeSummary } from "./videoLikes";

export const VIDEO_MODULE_COLLECTION = "videosVideoModule";
export const VIDEO_VIEW_DEBOUNCE_COLLECTION = "videoViewDebounce";
export const VIDEO_VIEW_DAILY_COLLECTION = "videoViewDaily";
export const VIEW_DEBOUNCE_MS = 30 * 60 * 1000;
export const VIEW_DAY_TIMEZONE = "Europe/Bucharest";

const INTERNAL_VIDEO_DOC_IDS = new Set(["_meta", "_publicCache"]);
const VALID_RANGES = new Set(["today", "7d", "30d", "all"]);
const VALID_PLATFORMS = new Set(["bunny", "youtube", "vimeo"]);

function normalizeId(value) {
  return typeof value === "string" ? value.trim() : "";
}

export function normalizeViewsCount(value) {
  const count = Number(value);
  if (!Number.isFinite(count) || count <= 0) return 0;
  return Math.floor(count);
}

function trimIp(value) {
  if (typeof value !== "string") return "";
  return value.trim();
}

/**
 * Prefer authenticated uid; otherwise a stable hash of the client IP.
 * Returns empty string when neither is available (caller should skip counting).
 */
export function buildVideoViewViewerKey({ uid, clientIp } = {}) {
  const normalizedUid = normalizeId(uid);
  if (normalizedUid) return `uid_${normalizedUid}`;

  const ip = trimIp(clientIp);
  if (!ip) return "";

  const digest = createHash("sha256").update(ip).digest("hex").slice(0, 24);
  return `ip_${digest}`;
}

export function buildVideoViewDebounceDocId(videoId, viewerKey) {
  const normalizedVideoId = normalizeId(videoId);
  const normalizedViewerKey = normalizeId(viewerKey);
  if (!normalizedVideoId || !normalizedViewerKey) {
    throw new Error("videoId and viewerKey are required");
  }
  return `${normalizedVideoId}__${normalizedViewerKey}`;
}

/** Calendar day in Europe/Bucharest as YYYY-MM-DD. */
export function formatViewDayKey(nowMs = Date.now()) {
  const ms = Number.isFinite(Number(nowMs)) ? Number(nowMs) : Date.now();
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: VIEW_DAY_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(ms));
  const year = parts.find((p) => p.type === "year")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  const day = parts.find((p) => p.type === "day")?.value;
  return `${year}-${month}-${day}`;
}

export function buildVideoViewDailyDocId(videoId, day) {
  const normalizedVideoId = normalizeId(videoId);
  const normalizedDay = normalizeId(day);
  if (!normalizedVideoId || !normalizedDay) {
    throw new Error("videoId and day are required");
  }
  return `${normalizedVideoId}_${normalizedDay}`;
}

export function resolveClientIpFromRequest(req) {
  const forwarded = req?.headers?.["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.trim()) {
    return forwarded.split(",")[0].trim();
  }
  if (Array.isArray(forwarded) && forwarded[0]) {
    return String(forwarded[0]).trim();
  }
  const remote = req?.socket?.remoteAddress;
  return typeof remote === "string" && remote.trim() ? remote.trim() : null;
}

/**
 * Shift a YYYY-MM-DD day key by `deltaDays` in calendar terms (Bucharest date string arithmetic via UTC noon).
 */
export function shiftViewDayKey(dayKey, deltaDays) {
  const day = normalizeId(dayKey);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return day;
  const [y, m, d] = day.split("-").map((n) => Number(n));
  const utc = Date.UTC(y, m - 1, d, 12, 0, 0);
  const shifted = new Date(utc + Number(deltaDays) * 24 * 60 * 60 * 1000);
  const yy = shifted.getUTCFullYear();
  const mm = String(shifted.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(shifted.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

export function resolveViewRangeBounds(rangeRaw, nowMs = Date.now()) {
  const range = VALID_RANGES.has(rangeRaw) ? rangeRaw : "7d";
  const toDay = formatViewDayKey(nowMs);
  if (range === "all") {
    return { range, fromDay: null, toDay };
  }
  if (range === "today") {
    return { range, fromDay: toDay, toDay };
  }
  const daysBack = range === "30d" ? 29 : 6;
  return { range, fromDay: shiftViewDayKey(toDay, -daysBack), toDay };
}

/**
 * @param {Array<{ videoId?: string, viewsCount?: unknown }>} dailyDocs
 * @returns {Map<string, number>}
 */
export function sumDailyViewsByVideo(dailyDocs) {
  const map = new Map();
  if (!Array.isArray(dailyDocs)) return map;
  for (const doc of dailyDocs) {
    const videoId = normalizeId(doc?.videoId);
    if (!videoId || INTERNAL_VIDEO_DOC_IDS.has(videoId)) continue;
    const next = normalizeViewsCount(doc?.viewsCount);
    if (next <= 0) continue;
    map.set(videoId, (map.get(videoId) || 0) + next);
  }
  return map;
}

export function mapVideoModuleToViewRow(docSnapOrData, viewsCountOverride = null) {
  const isSnap = docSnapOrData && typeof docSnapOrData.id === "string" && typeof docSnapOrData.data === "function";
  const id = isSnap ? docSnapOrData.id : normalizeId(docSnapOrData?.id || docSnapOrData?.videoId);
  const data = isSnap ? docSnapOrData.data() || {} : docSnapOrData || {};
  if (!id || INTERNAL_VIDEO_DOC_IDS.has(id)) return null;
  const viewsCount =
    viewsCountOverride != null
      ? normalizeViewsCount(viewsCountOverride)
      : normalizeViewsCount(data.viewsCount);
  return {
    videoId: id,
    title: typeof data.title === "string" ? data.title : "",
    platform: typeof data.platform === "string" ? data.platform : "",
    category: typeof data.category === "string" ? data.category : "",
    isPublished: data.isPublished === true,
    viewsCount,
  };
}

export function filterAndSortVideoViewRows(rows, { search = "", platform = "" } = {}) {
  const q = typeof search === "string" ? search.trim().toLowerCase() : "";
  const platformFilter =
    typeof platform === "string" && VALID_PLATFORMS.has(platform.trim().toLowerCase())
      ? platform.trim().toLowerCase()
      : "";

  let list = Array.isArray(rows) ? rows.filter(Boolean) : [];
  if (platformFilter) {
    list = list.filter((row) => String(row.platform || "").toLowerCase() === platformFilter);
  }
  if (q) {
    list = list.filter((row) =>
      [row.title, row.videoId, row.category, row.platform]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }
  list.sort((a, b) => {
    const diff = normalizeViewsCount(b.viewsCount) - normalizeViewsCount(a.viewsCount);
    if (diff !== 0) return diff;
    return String(a.title || "").localeCompare(String(b.title || ""), "ro");
  });
  return list;
}

export function buildVideoViewsSummary(rows) {
  const list = Array.isArray(rows) ? rows : [];
  const totalViews = list.reduce((sum, row) => sum + normalizeViewsCount(row.viewsCount), 0);
  const withViews = list.filter((row) => normalizeViewsCount(row.viewsCount) > 0);
  const top = withViews[0] || null;
  return {
    totalViews,
    videoCount: withViews.length,
    topVideo: top
      ? { videoId: top.videoId, title: top.title, viewsCount: top.viewsCount }
      : null,
  };
}

export const CHART_ALL_RANGE_DAYS = 90;

/** Inclusive list of YYYY-MM-DD keys from fromDay through toDay. */
export function enumerateViewDayKeys(fromDay, toDay) {
  const from = normalizeId(fromDay);
  const to = normalizeId(toDay);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) return [];
  if (from > to) return [];
  const days = [];
  let cursor = from;
  for (let i = 0; i < 400; i += 1) {
    days.push(cursor);
    if (cursor === to) break;
    cursor = shiftViewDayKey(cursor, 1);
  }
  return days;
}

/**
 * Previous inclusive window of the same length ending the day before `fromDay`.
 */
export function resolvePreviousViewRangeBounds(fromDay, toDay) {
  const days = enumerateViewDayKeys(fromDay, toDay);
  if (days.length === 0) {
    return { fromDay: null, toDay: null, dayCount: 0 };
  }
  const dayCount = days.length;
  const prevToDay = shiftViewDayKey(normalizeId(fromDay), -1);
  const prevFromDay = shiftViewDayKey(prevToDay, -(dayCount - 1));
  return { fromDay: prevFromDay, toDay: prevToDay, dayCount };
}

/**
 * @param {Array<{ videoId?: string, day?: string, viewsCount?: unknown }>} dailyDocs
 * @param {Set<string>|null} allowedVideoIds
 * @returns {Map<string, number>}
 */
export function sumDailyViewsByDay(dailyDocs, allowedVideoIds = null) {
  const allowed = allowedVideoIds instanceof Set ? allowedVideoIds : null;
  const map = new Map();
  if (!Array.isArray(dailyDocs)) return map;
  for (const doc of dailyDocs) {
    const videoId = normalizeId(doc?.videoId);
    const day = normalizeId(doc?.day);
    if (!videoId || !day || INTERNAL_VIDEO_DOC_IDS.has(videoId)) continue;
    if (allowed && !allowed.has(videoId)) continue;
    const next = normalizeViewsCount(doc?.viewsCount);
    if (next <= 0) continue;
    map.set(day, (map.get(day) || 0) + next);
  }
  return map;
}

export function buildViewsDaySeries(fromDay, toDay, dailyDocs, allowedVideoIds = null) {
  const byDay = sumDailyViewsByDay(dailyDocs, allowedVideoIds);
  return enumerateViewDayKeys(fromDay, toDay).map((day) => ({
    day,
    views: byDay.get(day) || 0,
  }));
}

export function sumSeriesViews(series) {
  if (!Array.isArray(series)) return 0;
  return series.reduce((sum, point) => sum + normalizeViewsCount(point?.views), 0);
}

export function buildTopVideos(rows, limit = 10) {
  const capped = Math.max(0, Math.floor(Number(limit)) || 0);
  return filterAndSortVideoViewRows(Array.isArray(rows) ? rows : [])
    .filter((row) => normalizeViewsCount(row.viewsCount) > 0)
    .slice(0, capped)
    .map((row) => ({
      videoId: row.videoId,
      title: row.title || "",
      viewsCount: normalizeViewsCount(row.viewsCount),
    }));
}

async function loadVideoMetaByIds(db, videoIds) {
  const metaById = new Map();
  const ids = Array.isArray(videoIds) ? videoIds.filter(Boolean) : [];
  const chunkSize = 100;
  for (let i = 0; i < ids.length; i += chunkSize) {
    const chunk = ids.slice(i, i + chunkSize);
    const refs = chunk.map((id) => db.collection(VIDEO_MODULE_COLLECTION).doc(id));
    if (typeof db.getAll === "function") {
      const snaps = await db.getAll(...refs);
      for (const snap of snaps) {
        if (!snap.exists) continue;
        metaById.set(snap.id, snap.data() || {});
      }
    } else {
      await Promise.all(
        chunk.map(async (id) => {
          const snap = await db.collection(VIDEO_MODULE_COLLECTION).doc(id).get();
          if (snap.exists) metaById.set(id, snap.data() || {});
        })
      );
    }
  }
  return metaById;
}

async function queryDailyDocsInRange(db, fromDay, toDay) {
  if (!fromDay || !toDay) return [];
  let query = db.collection(VIDEO_VIEW_DAILY_COLLECTION).where("day", ">=", fromDay);
  query = query.where("day", "<=", toDay);
  const dailySnap = await query.get();
  return dailySnap.docs.map((d) => ({ id: d.id, ...(d.data() || {}) }));
}

/**
 * Load daily docs for one video by constructed doc ids (no composite index).
 */
export async function queryDailyDocsForVideoInRange(db, videoId, fromDay, toDay) {
  const normalizedVideoId = normalizeId(videoId);
  if (!normalizedVideoId || !fromDay || !toDay) return [];
  const days = enumerateViewDayKeys(fromDay, toDay);
  if (days.length === 0) return [];

  const docs = [];
  const chunkSize = 100;
  for (let i = 0; i < days.length; i += chunkSize) {
    const chunk = days.slice(i, i + chunkSize);
    const refs = chunk.map((day) =>
      db.collection(VIDEO_VIEW_DAILY_COLLECTION).doc(buildVideoViewDailyDocId(normalizedVideoId, day))
    );
    if (typeof db.getAll === "function") {
      const snaps = await db.getAll(...refs);
      for (const snap of snaps) {
        if (!snap.exists) continue;
        docs.push({ id: snap.id, ...(snap.data() || {}) });
      }
    } else {
      await Promise.all(
        chunk.map(async (day) => {
          const snap = await db
            .collection(VIDEO_VIEW_DAILY_COLLECTION)
            .doc(buildVideoViewDailyDocId(normalizedVideoId, day))
            .get();
          if (snap.exists) docs.push({ id: snap.id, ...(snap.data() || {}) });
        })
      );
    }
  }
  return docs;
}

/**
 * Sum views in a day range for videos matching search/platform (loads meta as needed).
 */
export async function sumFilteredDailyViewsInRange({
  fromDay,
  toDay,
  search = "",
  platform = "",
  db = getAdminDb(),
  metaById = null,
} = {}) {
  if (!fromDay || !toDay) return 0;
  const dailyDocs = await queryDailyDocsInRange(db, fromDay, toDay);
  const byVideo = sumDailyViewsByVideo(dailyDocs);
  const videoIds = Array.from(byVideo.keys());
  const meta =
    metaById instanceof Map
      ? metaById
      : await loadVideoMetaByIds(db, videoIds);
  const missing = videoIds.filter((id) => !meta.has(id));
  if (missing.length > 0) {
    const loaded = await loadVideoMetaByIds(db, missing);
    for (const [id, data] of loaded) meta.set(id, data);
  }
  const rows = videoIds
    .map((videoId) =>
      mapVideoModuleToViewRow({ id: videoId, ...(meta.get(videoId) || {}) }, byVideo.get(videoId) || 0)
    )
    .filter(Boolean);
  const filtered = filterAndSortVideoViewRows(rows, { search, platform });
  return buildVideoViewsSummary(filtered).totalViews;
}

/**
 * Counts at most one library detail view per viewer per video within VIEW_DEBOUNCE_MS.
 * Safe no-op when videoId/viewer is missing or the video document does not exist.
 */
export async function recordVideoLibraryView({
  videoId,
  uid = null,
  clientIp = null,
  nowMs = Date.now(),
  db = getAdminDb(),
} = {}) {
  const normalizedVideoId = normalizeId(videoId);
  const viewerKey = buildVideoViewViewerKey({ uid, clientIp });
  if (!normalizedVideoId || !viewerKey) {
    return { counted: false, reason: "missing_viewer_or_video" };
  }

  const day = formatViewDayKey(nowMs);
  const debounceId = buildVideoViewDebounceDocId(normalizedVideoId, viewerKey);
  const dailyId = buildVideoViewDailyDocId(normalizedVideoId, day);
  const videoRef = db.collection(VIDEO_MODULE_COLLECTION).doc(normalizedVideoId);
  const debounceRef = db.collection(VIDEO_VIEW_DEBOUNCE_COLLECTION).doc(debounceId);
  const dailyRef = db.collection(VIDEO_VIEW_DAILY_COLLECTION).doc(dailyId);

  return db.runTransaction(async (transaction) => {
    const [videoSnap, debounceSnap] = await Promise.all([
      transaction.get(videoRef),
      transaction.get(debounceRef),
    ]);

    if (!videoSnap.exists) {
      return { counted: false, reason: "video_not_found" };
    }

    if (debounceSnap.exists) {
      const expiresAtMs = Number(debounceSnap.data()?.expiresAtMs);
      if (Number.isFinite(expiresAtMs) && expiresAtMs > nowMs) {
        return { counted: false, reason: "debounced" };
      }
    }

    const expiresAtMs = nowMs + VIEW_DEBOUNCE_MS;
    transaction.set(
      videoRef,
      {
        viewsCount: FieldValue.increment(1),
        viewsUpdatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    transaction.set(debounceRef, {
      videoId: normalizedVideoId,
      viewerKey,
      expiresAtMs,
      updatedAtMs: nowMs,
      updatedAt: FieldValue.serverTimestamp(),
    });
    transaction.set(
      dailyRef,
      {
        videoId: normalizedVideoId,
        day,
        viewsCount: FieldValue.increment(1),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return { counted: true, expiresAtMs, day };
  });
}

/**
 * Load admin stats rows for a range. Pure join/filter helpers stay unit-tested;
 * this function performs Firestore reads.
 */
export async function loadVideoViewsDashboard({
  range = "7d",
  search = "",
  platform = "",
  nowMs = Date.now(),
  db = getAdminDb(),
} = {}) {
  const bounds = resolveViewRangeBounds(range, nowMs);
  let rows = [];
  let chartDailyDocs = [];
  let seriesFromDay = bounds.fromDay;
  let seriesToDay = bounds.toDay;
  const metaById = new Map();

  if (bounds.range === "all") {
    const snapshot = await db.collection(VIDEO_MODULE_COLLECTION).get();
    rows = snapshot.docs
      .map((docSnap) => mapVideoModuleToViewRow(docSnap))
      .filter(Boolean);
    for (const docSnap of snapshot.docs) {
      if (!INTERNAL_VIDEO_DOC_IDS.has(docSnap.id)) {
        metaById.set(docSnap.id, docSnap.data() || {});
      }
    }
    seriesToDay = bounds.toDay;
    seriesFromDay = shiftViewDayKey(seriesToDay, -(CHART_ALL_RANGE_DAYS - 1));
    chartDailyDocs = await queryDailyDocsInRange(db, seriesFromDay, seriesToDay);
  } else {
    chartDailyDocs = await queryDailyDocsInRange(db, bounds.fromDay, bounds.toDay);
    const byVideo = sumDailyViewsByVideo(chartDailyDocs);
    const videoIds = Array.from(byVideo.keys());
    const loadedMeta = await loadVideoMetaByIds(db, videoIds);
    for (const [id, data] of loadedMeta) metaById.set(id, data);

    rows = videoIds
      .map((videoId) => {
        const meta = metaById.get(videoId) || {};
        return mapVideoModuleToViewRow(
          { id: videoId, ...meta },
          byVideo.get(videoId) || 0
        );
      })
      .filter(Boolean);
  }

  const filtered = filterAndSortVideoViewRows(rows, { search, platform });
  const summary = buildVideoViewsSummary(filtered);
  const allowedVideoIds = new Set(filtered.map((row) => row.videoId));
  const series = buildViewsDaySeries(
    seriesFromDay,
    seriesToDay,
    chartDailyDocs,
    allowedVideoIds
  );
  const seriesDayCount = series.length || 1;
  const seriesViewsTotal =
    bounds.range === "all" ? sumSeriesViews(series) : summary.totalViews;
  const avgViewsPerDay =
    Math.round((seriesViewsTotal / seriesDayCount) * 10) / 10;

  const previousBounds = resolvePreviousViewRangeBounds(seriesFromDay, seriesToDay);
  const previousTotalViews = await sumFilteredDailyViewsInRange({
    fromDay: previousBounds.fromDay,
    toDay: previousBounds.toDay,
    search,
    platform,
    db,
    metaById,
  });

  return {
    range: bounds.range,
    fromDay: bounds.fromDay,
    toDay: bounds.toDay,
    seriesFromDay,
    seriesToDay,
    ...summary,
    previousTotalViews,
    avgViewsPerDay,
    series,
    topVideos: buildTopVideos(filtered, 10),
    rows: filtered,
  };
}

/**
 * Admin detail stats for a single video.
 * @throws {{ statusCode: number, message: string }} when video is missing
 */
export async function loadVideoViewsDetail({
  videoId,
  range = "7d",
  nowMs = Date.now(),
  db = getAdminDb(),
} = {}) {
  const normalizedVideoId = normalizeId(videoId);
  if (!normalizedVideoId || INTERNAL_VIDEO_DOC_IDS.has(normalizedVideoId)) {
    const error = new Error("Video not found");
    error.statusCode = 404;
    throw error;
  }

  const videoSnap = await db.collection(VIDEO_MODULE_COLLECTION).doc(normalizedVideoId).get();
  if (!videoSnap.exists) {
    const error = new Error("Video not found");
    error.statusCode = 404;
    throw error;
  }

  const videoData = videoSnap.data() || {};
  const mapped = mapVideoModuleToViewRow({ id: normalizedVideoId, ...videoData });
  const viewsCountLifetime = normalizeViewsCount(videoData.viewsCount);
  const bounds = resolveViewRangeBounds(range, nowMs);

  let seriesFromDay = bounds.fromDay;
  let seriesToDay = bounds.toDay;
  if (bounds.range === "all") {
    seriesToDay = bounds.toDay;
    seriesFromDay = shiftViewDayKey(seriesToDay, -(CHART_ALL_RANGE_DAYS - 1));
  }

  const allowedVideoIds = new Set([normalizedVideoId]);
  const chartDailyDocs = await queryDailyDocsForVideoInRange(
    db,
    normalizedVideoId,
    seriesFromDay,
    seriesToDay
  );
  const series = buildViewsDaySeries(
    seriesFromDay,
    seriesToDay,
    chartDailyDocs,
    allowedVideoIds
  );
  const seriesViews = sumSeriesViews(series);
  const seriesDayCount = series.length || 1;
  const avgViewsPerDay = Math.round((seriesViews / seriesDayCount) * 10) / 10;

  const previousBounds = resolvePreviousViewRangeBounds(seriesFromDay, seriesToDay);
  const previousDocs = await queryDailyDocsForVideoInRange(
    db,
    normalizedVideoId,
    previousBounds.fromDay,
    previousBounds.toDay
  );
  const previousTotalViews = sumSeriesViews(
    buildViewsDaySeries(
      previousBounds.fromDay,
      previousBounds.toDay,
      previousDocs,
      allowedVideoIds
    )
  );

  let likesCount = 0;
  try {
    const likeSummary = await getVideoLikeSummary(normalizedVideoId, null, db);
    likesCount = normalizeViewsCount(likeSummary?.likesCount);
  } catch {
    likesCount = 0;
  }

  return {
    video: {
      videoId: normalizedVideoId,
      title: mapped?.title || "",
      platform: mapped?.platform || "",
      category: mapped?.category || "",
      isPublished: mapped?.isPublished === true,
      viewsCountLifetime,
    },
    range: bounds.range,
    fromDay: bounds.fromDay,
    toDay: bounds.toDay,
    seriesFromDay,
    seriesToDay,
    totalViews: bounds.range === "all" ? viewsCountLifetime : seriesViews,
    seriesViews,
    previousTotalViews,
    avgViewsPerDay,
    series,
    likesCount,
  };
}
