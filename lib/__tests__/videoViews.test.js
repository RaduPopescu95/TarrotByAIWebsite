jest.mock("firebase-admin/firestore", () => ({
  FieldValue: {
    serverTimestamp: jest.fn(() => "server-timestamp"),
    increment: jest.fn((n) => ({ __increment: n })),
  },
}));

import { FieldValue } from "firebase-admin/firestore";
import {
  VIEW_DEBOUNCE_MS,
  buildVideoViewDailyDocId,
  buildVideoViewDebounceDocId,
  buildVideoViewViewerKey,
  buildVideoViewsSummary,
  filterAndSortVideoViewRows,
  formatViewDayKey,
  normalizeViewsCount,
  recordVideoLibraryView,
  resolveClientIpFromRequest,
  resolveViewRangeBounds,
  shiftViewDayKey,
  sumDailyViewsByVideo,
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
    expect(normalizeViewsCount(-1)).toBe(0);
    expect(normalizeViewsCount("12")).toBe(12);
    expect(normalizeViewsCount("bad")).toBe(0);
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
        nowMs,
        db,
      })
    ).resolves.toEqual({ counted: true, expiresAtMs: nowMs + VIEW_DEBOUNCE_MS, day });

    expect(FieldValue.increment).toHaveBeenCalledWith(1);
    expect(transaction.set).toHaveBeenCalledWith(
      expect.objectContaining({ collectionName: "videosVideoModule" }),
      expect.objectContaining({ viewsCount: { __increment: 1 } }),
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
});
