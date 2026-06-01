const ts = (ms) => ({ toMillis: () => ms });

const makeDocSnap = (id, data, exists = true) => ({
  id,
  exists,
  data: () => data,
});

const makeQuerySnap = (docs) => ({
  forEach: (callback) => docs.forEach(callback),
});

const buildDb = ({ manifest, chunks = {}, rows = [], docRows = {} } = {}) => {
  const setCalls = [];
  const docsById = new Map();
  rows.forEach((row) => docsById.set(row.id, row));
  Object.entries(docRows).forEach(([id, data]) => docsById.set(id, { id, ...data }));

  const runQuery = (filters, limit = null) => {
    let results = [...docsById.values()];
    for (const [field, op, value] of filters) {
      if (op !== "==") continue;
      results = results.filter((row) => row?.[field] === value);
    }
    if (typeof limit === "number" && limit > 0) {
      results = results.slice(0, limit);
    }
    return makeQuerySnap(results.map((row) => makeDocSnap(row.id, row)));
  };

  const makeWhereChain = (filters = []) => ({
    where: jest.fn((field, op, value) => makeWhereChain([...filters, [field, op, value]])),
    limit: jest.fn((value) => ({
      get: jest.fn(async () => runQuery(filters, value)),
    })),
    get: jest.fn(async () => runQuery(filters)),
  });

  const db = {
    setCalls,
    collection: jest.fn((name) => ({
      doc: jest.fn((id) => ({
        get: jest.fn(async () => {
          if (name === "internalCaches" && id === "videoLibraryPublic") {
            return manifest
              ? makeDocSnap(id, manifest, true)
              : makeDocSnap(id, null, false);
          }
          if (name === "internalCaches" && chunks[id]) {
            return makeDocSnap(id, chunks[id], true);
          }
          if (name === "videosVideoModule" && docsById.has(id)) {
            return makeDocSnap(id, docsById.get(id), true);
          }
          return makeDocSnap(id, null, false);
        }),
        set: jest.fn(async (payload) => {
          setCalls.push({ name, id, payload });
        }),
      })),
      where: jest.fn((field, op, value) => makeWhereChain([[field, op, value]])),
    })),
  };
  return db;
};

const loadWithDb = async (db) => {
  jest.resetModules();
  jest.doMock("../firebaseAdmin", () => ({
    getAdminDb: () => db,
  }));
  return import("../loadPremiumVideoLibrary");
};

describe("loadPremiumVideoLibrary", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.VIDEO_LIBRARY_CACHE_TTL_MS = "1";
  });

  it("reads materialized manifest and chunks when valid", async () => {
    const db = buildDb({
      manifest: {
        version: 1,
        rowCount: 1,
        chunkCount: 1,
        chunkDocIds: ["videoLibraryPublic__chunk_0"],
      },
      chunks: {
        videoLibraryPublic__chunk_0: {
          version: 1,
          rows: [
            {
              id: "v1",
              title: "Cached",
              platform: "youtube",
              videoUrl: "https://youtu.be/abc123",
              isPublished: true,
              createdAt: ts(Date.UTC(2026, 4, 3)),
            },
          ],
        },
      },
    });
    const { loadPremiumVideoLibraryVideos } = await loadWithDb(db);

    const videos = await loadPremiumVideoLibraryVideos({
      locale: "ro",
      premiumActive: true,
    });

    expect(videos).toHaveLength(1);
    expect(videos[0]).toEqual(expect.objectContaining({ id: "v1", title: "Cached" }));
    expect(db.setCalls).toHaveLength(0);
  });

  it("rebuilds materialized cache when manifest is missing", async () => {
    const db = buildDb({
      rows: [
        {
          id: "v2",
          title: "Fresh",
          platform: "youtube",
          videoUrl: "https://youtu.be/fresh1",
          isPublished: true,
          createdAt: ts(Date.UTC(2026, 4, 4)),
        },
      ],
    });
    const { loadPremiumVideoLibraryVideos } = await loadWithDb(db);

    const videos = await loadPremiumVideoLibraryVideos({
      locale: "ro",
      premiumActive: true,
    });

    expect(videos.map((video) => video.id)).toEqual(["v2"]);
    expect(db.setCalls.map((call) => call.id)).toContain("videoLibraryPublic");
    expect(db.setCalls.map((call) => call.id)).toContain("videoLibraryPublic__chunk_0");
  });

  it("filters future publish dates and premium spotlight rows", async () => {
    const now = Date.UTC(2026, 4, 20);
    jest.spyOn(Date, "now").mockReturnValue(now);
    const db = buildDb({
      manifest: {
        version: 1,
        rowCount: 3,
        chunkCount: 1,
        chunkDocIds: ["videoLibraryPublic__chunk_0"],
      },
      chunks: {
        videoLibraryPublic__chunk_0: {
          version: 1,
          rows: [
            {
              id: "free",
              title: "Free",
              platform: "youtube",
              videoUrl: "https://youtu.be/free1",
              isPublished: true,
              isPremium: false,
              createdAt: ts(now),
            },
            {
              id: "premium-new",
              title: "Premium New",
              platform: "youtube",
              videoUrl: "https://youtu.be/premium1",
              isPublished: true,
              isPremium: true,
              createdAt: ts(Date.UTC(2026, 4, 3)),
            },
            {
              id: "future",
              title: "Future",
              platform: "youtube",
              videoUrl: "https://youtu.be/future1",
              isPublished: true,
              isPremium: true,
              publishAt: ts(now + 10_000),
              createdAt: ts(now + 5),
            },
          ],
        },
      },
    });
    const { loadPremiumVideoLibraryVideos } = await loadWithDb(db);

    const videos = await loadPremiumVideoLibraryVideos({
      locale: "ro",
      premiumActive: false,
      premiumSpotlightOnly: true,
    });

    expect(videos.map((video) => video.id)).toEqual(["premium-new"]);
    expect(videos[0]).toEqual(
      expect.objectContaining({
        canPlay: false,
        lockedReason: "premium_required",
      })
    );
    (Date.now).mockRestore();
  });

  it("loads a single published video row by id without reading internalCaches", async () => {
    const db = buildDb({
      docRows: {
        v1: {
          title: "Direct",
          platform: "youtube",
          videoUrl: "https://youtu.be/direct1",
          isPublished: true,
          category: "Tarot",
          createdAt: ts(Date.UTC(2026, 4, 3)),
        },
      },
    });
    const { loadPremiumVideoLibraryRowById } = await loadWithDb(db);

    const row = await loadPremiumVideoLibraryRowById("v1");
    expect(row).toEqual(
      expect.objectContaining({
        id: "v1",
        title: "Direct",
        isPublished: true,
      })
    );
    expect(db.collection).toHaveBeenCalledWith("videosVideoModule");
  });

  it("loads related videos by category without reading the full materialized cache", async () => {
    const db = buildDb({
      docRows: {
        main: {
          title: "Main",
          platform: "youtube",
          videoUrl: "https://youtu.be/main1",
          isPublished: true,
          category: "Tarot",
          createdAt: ts(Date.UTC(2026, 4, 3)),
        },
        related: {
          title: "Related",
          platform: "youtube",
          videoUrl: "https://youtu.be/related1",
          isPublished: true,
          category: "Tarot",
          createdAt: ts(Date.UTC(2026, 4, 2)),
        },
        other: {
          title: "Other",
          platform: "youtube",
          videoUrl: "https://youtu.be/other1",
          isPublished: true,
          category: "Noroc",
          createdAt: ts(Date.UTC(2026, 4, 1)),
        },
      },
    });
    const { loadPremiumVideoRelatedRows } = await loadWithDb(db);

    const related = await loadPremiumVideoRelatedRows({
      category: "Tarot",
      excludeId: "main",
      locale: "ro",
      limit: 12,
    });

    expect(related.map((row) => row.id)).toEqual(["related"]);
  });
});
