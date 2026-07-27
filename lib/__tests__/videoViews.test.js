jest.mock("firebase-admin/firestore", () => ({
  FieldValue: {
    serverTimestamp: jest.fn(() => "server-timestamp"),
    increment: jest.fn((n) => ({ __increment: n })),
  },
}));

jest.mock("../videoLikes", () => ({
  getVideoLikeSummary: jest.fn(async () => ({ likesCount: 4 })),
}));

import { FieldValue } from "firebase-admin/firestore";
import { getVideoLikeSummary } from "../videoLikes";
import {
  VIEW_DEBOUNCE_MS,
  buildTopVideos,
  buildVideoViewDailyDocId,
  buildVideoViewDailyLocaleDocId,
  buildVideoViewDebounceDocId,
  buildVideoViewViewerKey,
  buildVideoViewsSummary,
  buildViewsByLocaleFromMap,
  buildViewsDaySeries,
  enumerateViewDayKeys,
  filterAndSortVideoViewRows,
  formatViewDayKey,
  loadVideoViewsDetail,
  normalizeViewLocale,
  normalizeViewsCount,
  queryDailyDocsForVideoInRange,
  recordVideoLibraryView,
  resolveClientIpFromRequest,
  resolvePreviousViewRangeBounds,
  resolveViewRangeBounds,
  shiftViewDayKey,
  sumDailyViewsByDay,
  sumDailyViewsByLocale,
  sumDailyViewsByVideo,
  sumSeriesViews,
} from "../videoViews";

function makeDb({
  videoExists = true,
  debounceExists = false,
  expiresAtMs = null,
} = {}) {
  const store = {
    video: videoExists ? { isPublished: true, viewsCount: 0 } : null,
    debounce: debounceExists
      ? { expiresAtMs: expiresAtMs ?? Date.now() + VIEW_DEBOUNCE_MS }
      : null,
    daily: null,
  };

  const refs = new Map();
  const makeRef = (collectionName, id) => {
    const key = `${collectionName}/${id}`;
    if (!refs.has(key)) refs.set(key, { collectionName, id });
    return refs.get(key);
  };

  const transaction = {
    get: jest.fn(async (ref) => {
      if (ref.collectionName === "videosVideoModule") {
        return {
          exists: Boolean(store.video),
          data: () => store.video,
        };
      }
      if (ref.collectionName === "videoViewDebounce") {
        return {
          exists: Boolean(store.debounce),
          data: () => store.debounce,
        };
      }
      if (ref.collectionName === "videoViewDaily") {
        return {
          exists: Boolean(store.daily),
          data: () => store.daily,
        };
      }
      return { exists: false, data: () => ({}) };
    }),
    set: jest.fn((ref, data) => {
      if (ref.collectionName === "videosVideoModule") {
        store.video = { ...(store.video || {}), ...data };
      }
      if (ref.collectionName === "videoViewDebounce") {
        store.debounce = { ...(store.debounce || {}), ...data };
      }
      if (ref.collectionName === "videoViewDaily") {
        store.daily = { ...(store.daily || {}), ...data };
      }
    }),
  };

  const db = {
    collection: jest.fn((collectionName) => ({
      doc: jest.fn((id) => makeRef(collectionName, id)),
    })),
    runTransaction: jest.fn(async (callback) => callback(transaction)),
  };

  return { db, transaction, store };
}

describe("videoViews", () => {
  it("builds stable viewer keys for uid and IP", () => {
    expect(buildVideoViewViewerKey({ uid: "user-1" })).toBe("uid_user-1");
    expect(buildVideoViewViewerKey({ uid: "user-1", clientIp: "1.2.3.4" })).toBe(
      "uid_user-1"
    );
    const a = buildVideoViewViewerKey({ clientIp: "1.2.3.4" });
    const b = buildVideoViewViewerKey({ clientIp: "1.2.3.4" });
    expect(a).toMatch(/^ip_[a-f0-9]{24}$/);
    expect(a).toBe(b);
    expect(buildVideoViewViewerKey({})).toBe("");
  });

  it("builds debounce/daily doc ids and normalizes counters", () => {
    expect(buildVideoViewDebounceDocId("video-1", "uid_user-1")).toBe(
      "video-1__uid_user-1"
    );
    expect(buildVideoViewDailyDocId("video-1", "2026-07-23")).toBe(
      "video-1_2026-07-23"
    );
    expect(buildVideoViewDailyLocaleDocId("video-1", "2026-07-23", "en")).toBe(
      "video-1_2026-07-23_en"
    );
    expect(normalizeViewsCount(-1)).toBe(0);
    expect(normalizeViewsCount("12")).toBe(12);
    expect(normalizeViewsCount("bad")).toBe(0);
    expect(normalizeViewLocale("EN-US")).toBe("en");
    expect(normalizeViewLocale("")).toBe("");
  });

  it("formats Bucharest day keys and shifts them", () => {
    // 2023-12-31 22:30 UTC = 2024-01-01 00:30 Bucharest (EET, UTC+2)
    const day = formatViewDayKey(Date.UTC(2023, 11, 31, 22, 30, 0));
    expect(day).toBe("2024-01-01");
    expect(shiftViewDayKey("2024-01-01", -1)).toBe("2023-12-31");
    expect(shiftViewDayKey("2024-01-01", -6)).toBe("2023-12-26");
  });

  it("resolves range bounds for today/7d/30d/all", () => {
    const nowMs = Date.UTC(2024, 0, 10, 12, 0, 0); // mid-day UTC → still Jan 10 in Bucharest
    const today = formatViewDayKey(nowMs);
    expect(resolveViewRangeBounds("today", nowMs)).toEqual({
      range: "today",
      fromDay: today,
      toDay: today,
    });
    expect(resolveViewRangeBounds("7d", nowMs)).toEqual({
      range: "7d",
      fromDay: shiftViewDayKey(today, -6),
      toDay: today,
    });
    expect(resolveViewRangeBounds("30d", nowMs)).toEqual({
      range: "30d",
      fromDay: shiftViewDayKey(today, -29),
      toDay: today,
    });
    expect(resolveViewRangeBounds("all", nowMs)).toEqual({
      range: "all",
      fromDay: null,
      toDay: today,
    });
    expect(resolveViewRangeBounds("weird", nowMs).range).toBe("7d");
  });

  it("resolves client IP from x-forwarded-for", () => {
    expect(
      resolveClientIpFromRequest({
        headers: { "x-forwarded-for": "10.0.0.1, 10.0.0.2" },
      })
    ).toBe("10.0.0.1");
    expect(
      resolveClientIpFromRequest({
        headers: {},
        socket: { remoteAddress: "127.0.0.1" },
      })
    ).toBe("127.0.0.1");
  });

  it("increments lifetime + daily and writes debounce on first view", async () => {
    const nowMs = Date.UTC(2024, 5, 15, 12, 0, 0);
    const day = formatViewDayKey(nowMs);
    const { db, transaction } = makeDb({ videoExists: true, debounceExists: false });

    await expect(
      recordVideoLibraryView({
        videoId: "video-1",
        uid: "user-1",
        locale: "en",
        nowMs,
        db,
      })
    ).resolves.toEqual({
      counted: true,
      expiresAtMs: nowMs + VIEW_DEBOUNCE_MS,
      day,
      locale: "en",
    });

    expect(FieldValue.increment).toHaveBeenCalledWith(1);
    expect(transaction.set).toHaveBeenCalledWith(
      expect.objectContaining({ collectionName: "videosVideoModule" }),
      expect.objectContaining({
        viewsCount: { __increment: 1 },
        "viewsByLocale.en": { __increment: 1 },
      }),
      { merge: true }
    );
    expect(transaction.set).toHaveBeenCalledWith(
      expect.objectContaining({ collectionName: "videoViewDebounce" }),
      expect.objectContaining({
        videoId: "video-1",
        viewerKey: "uid_user-1",
        expiresAtMs: nowMs + VIEW_DEBOUNCE_MS,
      })
    );
    expect(transaction.set).toHaveBeenCalledWith(
      expect.objectContaining({
        collectionName: "videoViewDaily",
        id: `video-1_${day}`,
      }),
      expect.objectContaining({
        videoId: "video-1",
        day,
        viewsCount: { __increment: 1 },
      }),
      { merge: true }
    );
    expect(transaction.set).toHaveBeenCalledWith(
      expect.objectContaining({
        collectionName: "videoViewDailyLocale",
        id: `video-1_${day}_en`,
      }),
      expect.objectContaining({
        videoId: "video-1",
        day,
        locale: "en",
        viewsCount: { __increment: 1 },
      }),
      { merge: true }
    );
  });

  it("does not double-count within the debounce window (language switch)", async () => {
    const nowMs = 1_700_000_000_000;
    const { db, transaction } = makeDb({
      videoExists: true,
      debounceExists: true,
      expiresAtMs: nowMs + 10 * 60 * 1000,
    });

    await expect(
      recordVideoLibraryView({
        videoId: "video-1",
        uid: "user-1",
        nowMs,
        db,
      })
    ).resolves.toEqual({ counted: false, reason: "debounced" });

    expect(transaction.set).not.toHaveBeenCalled();
  });

  it("counts again after debounce expires", async () => {
    const nowMs = 1_700_000_000_000;
    const { db, transaction } = makeDb({
      videoExists: true,
      debounceExists: true,
      expiresAtMs: nowMs - 1,
    });

    await expect(
      recordVideoLibraryView({
        videoId: "video-1",
        uid: "user-1",
        nowMs,
        db,
      })
    ).resolves.toEqual(
      expect.objectContaining({ counted: true, expiresAtMs: nowMs + VIEW_DEBOUNCE_MS })
    );

    expect(transaction.set).toHaveBeenCalled();
  });

  it("counts different viewers separately", async () => {
    const nowMs = 1_700_000_000_000;
    const first = makeDb({ videoExists: true, debounceExists: false });
    await recordVideoLibraryView({
      videoId: "video-1",
      uid: "user-a",
      nowMs,
      db: first.db,
    });

    const second = makeDb({ videoExists: true, debounceExists: false });
    await expect(
      recordVideoLibraryView({
        videoId: "video-1",
        uid: "user-b",
        nowMs,
        db: second.db,
      })
    ).resolves.toEqual(
      expect.objectContaining({ counted: true, expiresAtMs: nowMs + VIEW_DEBOUNCE_MS })
    );
  });

  it("is a no-op for missing videoId/viewer or missing video doc", async () => {
    const { db: emptyDb, transaction: emptyTx } = makeDb();
    await expect(recordVideoLibraryView({ videoId: "", uid: "u1", db: emptyDb })).resolves.toEqual({
      counted: false,
      reason: "missing_viewer_or_video",
    });
    await expect(
      recordVideoLibraryView({ videoId: "video-1", clientIp: null, db: emptyDb })
    ).resolves.toEqual({
      counted: false,
      reason: "missing_viewer_or_video",
    });
    expect(emptyTx.set).not.toHaveBeenCalled();

    const missing = makeDb({ videoExists: false });
    await expect(
      recordVideoLibraryView({
        videoId: "video-1",
        uid: "user-1",
        db: missing.db,
      })
    ).resolves.toEqual({ counted: false, reason: "video_not_found" });
    expect(missing.transaction.set).not.toHaveBeenCalled();
  });

  it("aggregates daily docs per video", () => {
    const map = sumDailyViewsByVideo([
      { videoId: "a", viewsCount: 2 },
      { videoId: "a", viewsCount: 3 },
      { videoId: "b", viewsCount: 1 },
      { videoId: "", viewsCount: 9 },
      { videoId: "_meta", viewsCount: 5 },
    ]);
    expect(map.get("a")).toBe(5);
    expect(map.get("b")).toBe(1);
    expect(map.has("_meta")).toBe(false);
  });

  it("aggregates daily docs per locale and from lifetime maps", () => {
    expect(
      sumDailyViewsByLocale(
        [
          { videoId: "a", locale: "ro", viewsCount: 2 },
          { videoId: "a", locale: "en", viewsCount: 3 },
          { videoId: "b", locale: "ro", viewsCount: 1 },
          { videoId: "c", locale: "en", viewsCount: 4 },
        ],
        new Set(["a", "b"])
      )
    ).toEqual([
      { locale: "en", viewsCount: 3 },
      { locale: "ro", viewsCount: 3 },
    ]);
    expect(buildViewsByLocaleFromMap({ ro: 10, en: 2, de: 0, "": 5 })).toEqual([
      { locale: "ro", viewsCount: 10 },
      { locale: "en", viewsCount: 2 },
    ]);
  });

  it("filters, sorts rows and builds summary", () => {
    const rows = filterAndSortVideoViewRows(
      [
        { videoId: "1", title: "Alpha", platform: "bunny", category: "X", viewsCount: 2 },
        { videoId: "2", title: "Beta clip", platform: "youtube", category: "Y", viewsCount: 10 },
        { videoId: "3", title: "Gamma", platform: "bunny", category: "Z", viewsCount: 10 },
      ],
      { search: "a", platform: "bunny" }
    );
    expect(rows.map((r) => r.videoId)).toEqual(["3", "1"]);
    const summary = buildVideoViewsSummary(rows);
    expect(summary.totalViews).toBe(12);
    expect(summary.videoCount).toBe(2);
    expect(summary.topVideo).toEqual({
      videoId: "3",
      title: "Gamma",
      viewsCount: 10,
    });
  });

  it("enumerates day keys and previous equal-length window", () => {
    expect(enumerateViewDayKeys("2024-01-08", "2024-01-10")).toEqual([
      "2024-01-08",
      "2024-01-09",
      "2024-01-10",
    ]);
    expect(resolvePreviousViewRangeBounds("2024-01-08", "2024-01-10")).toEqual({
      fromDay: "2024-01-05",
      toDay: "2024-01-07",
      dayCount: 3,
    });
    expect(resolvePreviousViewRangeBounds("2024-01-10", "2024-01-10")).toEqual({
      fromDay: "2024-01-09",
      toDay: "2024-01-09",
      dayCount: 1,
    });
  });

  it("builds a daily series with zeros and optional video filter", () => {
    const docs = [
      { videoId: "a", day: "2024-01-08", viewsCount: 2 },
      { videoId: "a", day: "2024-01-10", viewsCount: 5 },
      { videoId: "b", day: "2024-01-09", viewsCount: 7 },
      { videoId: "b", day: "2024-01-10", viewsCount: 1 },
    ];
    expect(sumDailyViewsByDay(docs).get("2024-01-10")).toBe(6);
    expect(sumDailyViewsByDay(docs, new Set(["a"])).get("2024-01-10")).toBe(5);

    const series = buildViewsDaySeries("2024-01-08", "2024-01-10", docs, new Set(["a"]));
    expect(series).toEqual([
      { day: "2024-01-08", views: 2 },
      { day: "2024-01-09", views: 0 },
      { day: "2024-01-10", views: 5 },
    ]);
    expect(sumSeriesViews(series)).toBe(7);
  });

  it("builds top videos limited and sorted", () => {
    const top = buildTopVideos(
      [
        { videoId: "1", title: "Low", viewsCount: 2 },
        { videoId: "2", title: "High", viewsCount: 20 },
        { videoId: "3", title: "Mid", viewsCount: 8 },
        { videoId: "4", title: "Zero", viewsCount: 0 },
      ],
      2
    );
    expect(top).toEqual([
      { videoId: "2", title: "High", viewsCount: 20 },
      { videoId: "3", title: "Mid", viewsCount: 8 },
    ]);
  });

  it("loads daily docs for one video by constructed ids", async () => {
    const store = new Map([
      [
        "videoViewDaily/video-1_2024-01-08",
        { videoId: "video-1", day: "2024-01-08", viewsCount: 3 },
      ],
      [
        "videoViewDaily/video-1_2024-01-10",
        { videoId: "video-1", day: "2024-01-10", viewsCount: 5 },
      ],
    ]);
    const db = {
      collection: (name) => ({
        doc: (id) => ({
          path: `${name}/${id}`,
          id,
          get: async () => {
            const data = store.get(`${name}/${id}`);
            return { exists: Boolean(data), id, data: () => data };
          },
        }),
      }),
      getAll: async (...refs) =>
        refs.map((ref) => {
          const data = store.get(ref.path);
          return { exists: Boolean(data), id: ref.id, data: () => data };
        }),
    };

    const docs = await queryDailyDocsForVideoInRange(
      db,
      "video-1",
      "2024-01-08",
      "2024-01-10"
    );
    expect(docs).toHaveLength(2);
    expect(sumSeriesViews(buildViewsDaySeries("2024-01-08", "2024-01-10", docs, new Set(["video-1"])))).toBe(
      8
    );
  });

  it("loads per-video detail with series, previous window and likes", async () => {
    getVideoLikeSummary.mockResolvedValueOnce({ likesCount: 9 });
    const nowMs = Date.UTC(2024, 0, 10, 12, 0, 0);
    const today = formatViewDayKey(nowMs);
    const fromDay = shiftViewDayKey(today, -6);
    const store = new Map();
    store.set(`videosVideoModule/video-1`, {
      title: "Clip A",
      platform: "bunny",
      category: "Astro",
      isPublished: true,
      viewsCount: 100,
      viewsByLocale: { ro: 70, en: 30 },
    });
    // current window: last day has 4 views
    store.set(`videoViewDaily/video-1_${today}`, {
      videoId: "video-1",
      day: today,
      viewsCount: 4,
    });
    // previous equal window: one day with 2 views
    const prevTo = shiftViewDayKey(fromDay, -1);
    store.set(`videoViewDaily/video-1_${prevTo}`, {
      videoId: "video-1",
      day: prevTo,
      viewsCount: 2,
    });
    store.set(`videoViewDailyLocale/video-1_${today}_ro`, {
      videoId: "video-1",
      day: today,
      locale: "ro",
      viewsCount: 3,
    });
    store.set(`videoViewDailyLocale/video-1_${today}_en`, {
      videoId: "video-1",
      day: today,
      locale: "en",
      viewsCount: 1,
    });

    const db = {
      collection: (name) => ({
        doc: (id) => ({
          path: `${name}/${id}`,
          id,
          get: async () => {
            const data = store.get(`${name}/${id}`);
            return { exists: Boolean(data), id, data: () => data };
          },
        }),
        where() {
          return this;
        },
        get: async () => {
          const docs = [];
          for (const [key, data] of store) {
            if (!key.startsWith(`${name}/`)) continue;
            if (name === "videoViewDailyLocale") {
              if (data.videoId !== "video-1") continue;
              if (data.day < fromDay || data.day > today) continue;
            }
            docs.push({
              id: key.slice(name.length + 1),
              data: () => data,
            });
          }
          return { docs };
        },
      }),
      getAll: async (...refs) =>
        refs.map((ref) => {
          const data = store.get(ref.path);
          return { exists: Boolean(data), id: ref.id, data: () => data };
        }),
    };

    const detail = await loadVideoViewsDetail({
      videoId: "video-1",
      range: "7d",
      nowMs,
      db,
    });

    expect(detail.video).toEqual({
      videoId: "video-1",
      title: "Clip A",
      platform: "bunny",
      category: "Astro",
      isPublished: true,
      viewsCountLifetime: 100,
      viewsByLocaleLifetime: [
        { locale: "ro", viewsCount: 70 },
        { locale: "en", viewsCount: 30 },
      ],
    });
    expect(detail.totalViews).toBe(4);
    expect(detail.seriesViews).toBe(4);
    expect(detail.previousTotalViews).toBe(2);
    expect(detail.likesCount).toBe(9);
    expect(detail.series).toHaveLength(7);
    expect(detail.series[detail.series.length - 1]).toEqual({ day: today, views: 4 });
    expect(detail.viewsByLocale).toEqual([
      { locale: "ro", viewsCount: 3 },
      { locale: "en", viewsCount: 1 },
    ]);
  });

  it("returns 404 for missing video detail", async () => {
    const db = {
      collection: () => ({
        doc: (id) => ({
          id,
          get: async () => ({ exists: false, id, data: () => null }),
        }),
      }),
    };
    await expect(
      loadVideoViewsDetail({ videoId: "missing", range: "7d", db })
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});
