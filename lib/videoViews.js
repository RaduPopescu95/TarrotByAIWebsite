import { createHash } from "crypto";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "./firebaseAdmin";

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

  if (bounds.range === "all") {
    const snapshot = await db.collection(VIDEO_MODULE_COLLECTION).get();
    rows = snapshot.docs
      .map((docSnap) => mapVideoModuleToViewRow(docSnap))
      .filter(Boolean);
  } else {
    let query = db.collection(VIDEO_VIEW_DAILY_COLLECTION).where("day", ">=", bounds.fromDay);
    if (bounds.toDay) {
      query = query.where("day", "<=", bounds.toDay);
    }
    const dailySnap = await query.get();
    const dailyDocs = dailySnap.docs.map((d) => ({ id: d.id, ...(d.data() || {}) }));
    const byVideo = sumDailyViewsByVideo(dailyDocs);
    const videoIds = Array.from(byVideo.keys());
    const metaById = new Map();

    // Firestore getAll supports up to 100 refs per call in practice; chunk.
    const chunkSize = 100;
    for (let i = 0; i < videoIds.length; i += chunkSize) {
      const chunk = videoIds.slice(i, i + chunkSize);
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

    rows = videoIds.map((videoId) => {
      const meta = metaById.get(videoId) || {};
      return mapVideoModuleToViewRow(
        { id: videoId, ...meta },
        byVideo.get(videoId) || 0
      );
    }).filter(Boolean);
  }

  const filtered = filterAndSortVideoViewRows(rows, { search, platform });
  const summary = buildVideoViewsSummary(filtered);
  return {
    range: bounds.range,
    fromDay: bounds.fromDay,
    toDay: bounds.toDay,
    ...summary,
    rows: filtered,
  };
}
