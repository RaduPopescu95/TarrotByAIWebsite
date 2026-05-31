const makeDocSnap = (id, data, exists = true) => ({
  id,
  exists,
  data: () => data,
});

const makeQuerySnap = (docs) => ({
  docs,
  size: docs.length,
  forEach: (callback) => docs.forEach(callback),
});

const getScheduledMsFromData = (data) => {
  if (data?.scheduledAtTs) {
    const ms = new Date(data.scheduledAtTs).getTime();
    if (Number.isFinite(ms)) return ms;
  }
  return 0;
};

const buildDb = ({ manifest, chunks = {}, sourceRows = [] } = {}) => {
  const setCalls = [];
  const db = {
    setCalls,
    collection: jest.fn((name) => ({
      doc: jest.fn((id) => ({
        get: jest.fn(async () => {
          if (name === "internalCaches" && id === "articlesPublic") {
            return manifest ? makeDocSnap(id, manifest, true) : makeDocSnap(id, null, false);
          }
          if (name === "internalCaches" && chunks[id]) {
            return makeDocSnap(id, chunks[id], true);
          }
          return makeDocSnap(id, null, false);
        }),
        set: jest.fn(async (payload) => {
          setCalls.push({ name, id, payload });
        }),
      })),
      get: jest.fn(async () =>
        makeQuerySnap(sourceRows.map((row) => makeDocSnap(row.id, row)))
      ),
    })),
  };
  return db;
};

const buildQueryDb = ({ articles = [] } = {}) => {
  const articleMap = new Map(
    articles.map((entry) => [entry.id, entry.data ?? entry])
  );
  let fullCollectionGetCount = 0;

  const filterRows = (filters, limitVal, startAfterId) => {
    let rows = articles.map((entry) => ({
      id: entry.id,
      data: entry.data ?? entry,
      scheduledAtMs: getScheduledMsFromData(entry.data ?? entry),
    }));

    for (const filter of filters) {
      if (filter.field === "categorie" && filter.op === "==") {
        rows = rows.filter(
          (row) => (row.data.categorie || row.data.categoryKey) === filter.value
        );
      }
      if (filter.field === "scheduledAtTs" && filter.op === "<=") {
        const maxMs = filter.value.toDate().getTime();
        rows = rows.filter((row) => row.scheduledAtMs <= maxMs);
      }
      if (filter.field === "scheduledAtTs" && filter.op === ">") {
        const minMs = filter.value.toDate().getTime();
        rows = rows.filter((row) => row.scheduledAtMs > minMs);
      }
      if (filter.field === "id" && filter.op === "==") {
        rows = rows.filter((row) => String(row.data.id) === String(filter.value));
      }
    }

    rows.sort((left, right) => right.scheduledAtMs - left.scheduledAtMs);

    if (startAfterId) {
      const cursorIndex = rows.findIndex((row) => row.id === startAfterId);
      if (cursorIndex >= 0) {
        rows = rows.slice(cursorIndex + 1);
      }
    }

    return rows.slice(0, limitVal).map((row) => makeDocSnap(row.id, row.data));
  };

  const makeQueryBuilder = (filters = []) => {
    let limitVal = 50;
    let startAfterSnap = null;
    const builder = {
      where: jest.fn((field, op, value) =>
        makeQueryBuilder([...filters, { field, op, value }])
      ),
      orderBy: jest.fn(() => builder),
      limit: jest.fn((value) => {
        limitVal = value;
        return builder;
      }),
      startAfter: jest.fn((snap) => {
        startAfterSnap = snap;
        return builder;
      }),
      get: jest.fn(async () =>
        makeQuerySnap(filterRows(filters, limitVal, startAfterSnap?.id || null))
      ),
    };
    return builder;
  };

  const db = {
    fullCollectionGetCount: () => fullCollectionGetCount,
    collection: jest.fn((name) => {
      if (name !== "BlogArticole") {
        return {
          doc: jest.fn(() => ({
            get: jest.fn(async () => makeDocSnap("", null, false)),
            set: jest.fn(async () => {}),
          })),
          get: jest.fn(async () => makeQuerySnap([])),
        };
      }

      return {
        doc: jest.fn((id) => ({
          get: jest.fn(async () => {
            const data = articleMap.get(id);
            return data ? makeDocSnap(id, data, true) : makeDocSnap(id, null, false);
          }),
        })),
        where: jest.fn((field, op, value) => makeQueryBuilder([{ field, op, value }])),
        get: jest.fn(async () => {
          fullCollectionGetCount += 1;
          return makeQuerySnap(articles.map((entry) => makeDocSnap(entry.id, entry.data ?? entry)));
        }),
      };
    }),
  };

  return db;
};

const loadModuleWithDb = async (db) => {
  jest.resetModules();
  jest.doMock("firebase-admin/firestore", () => ({
    Timestamp: {
      fromDate: (date) => ({
        toDate: () => date,
      }),
    },
  }));
  jest.doMock("../firebaseAdmin", () => ({
    getAdminDb: () => db,
  }));
  return import("../publicArticles");
};

describe("publicArticles", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.ARTICLES_PUBLIC_CACHE_TTL_MS = "1";
    jest.spyOn(Date, "now").mockReturnValue(Date.UTC(2026, 4, 30, 12, 0, 0));
  });

  afterEach(() => {
    Date.now.mockRestore();
  });

  it("loads visible articles from materialized cache and paginates with cursor (search path)", async () => {
    const now = Date.now();
    const db = buildDb({
      manifest: {
        version: 1,
        rowCount: 3,
        chunkCount: 1,
        chunkDocIds: ["articlesPublic__chunk_0"],
      },
      chunks: {
        articlesPublic__chunk_0: {
          version: 1,
          rows: [
            {
              documentId: "doc-new",
              id: "legacy-new",
              legacyId: "legacy-new",
              scheduledAtMs: now - 1_000,
              scheduledAtTs: new Date(now - 1_000).toISOString(),
              info: { ro: { nume: "Nou", descriere: "alpha" } },
            },
            {
              documentId: "doc-mid",
              id: "legacy-mid",
              legacyId: "legacy-mid",
              scheduledAtMs: now - 2_000,
              scheduledAtTs: new Date(now - 2_000).toISOString(),
              info: { ro: { nume: "Mediu", descriere: "alpha" } },
            },
            {
              documentId: "doc-old",
              id: "legacy-old",
              legacyId: "legacy-old",
              scheduledAtMs: now - 3_000,
              scheduledAtTs: new Date(now - 3_000).toISOString(),
              info: { ro: { nume: "Vechi", descriere: "alpha" } },
            },
          ],
        },
      },
    });
    const { loadPublicArticles } = await loadModuleWithDb(db);

    const firstPage = await loadPublicArticles({ limit: 2, locale: "ro", search: "alpha" });
    expect(firstPage.articles.map((item) => item.documentId)).toEqual(["doc-new", "doc-mid"]);
    expect(firstPage.nextCursor).toBe("doc-mid");

    const secondPage = await loadPublicArticles({
      limit: 2,
      locale: "ro",
      cursor: firstPage.nextCursor,
      search: "alpha",
    });
    expect(secondPage.articles.map((item) => item.documentId)).toEqual(["doc-old"]);
    expect(secondPage.nextCursor).toBeNull();
  });

  it("loads published articles from materialized cache without BlogArticole scan", async () => {
    const now = Date.now();
    const db = buildDb({
      manifest: {
        version: 1,
        rowCount: 2,
        chunkCount: 1,
        chunkDocIds: ["articlesPublic__chunk_0"],
      },
      chunks: {
        articlesPublic__chunk_0: {
          version: 1,
          rows: [
            {
              documentId: "doc-new",
              id: "legacy-new",
              legacyId: "legacy-new",
              categoryKey: "Tarot",
              categorie: "Tarot",
              scheduledAtMs: now - 1_000,
              scheduledAtTs: new Date(now - 1_000).toISOString(),
              info: { ro: { nume: "Nou" } },
            },
            {
              documentId: "doc-old",
              id: "legacy-old",
              legacyId: "legacy-old",
              categoryKey: "Tarot",
              categorie: "Tarot",
              scheduledAtMs: now - 5_000,
              scheduledAtTs: new Date(now - 5_000).toISOString(),
              info: { ro: { nume: "Vechi" } },
            },
          ],
        },
      },
    });
    const { loadPublicArticles } = await loadModuleWithDb(db);

    const payload = await loadPublicArticles({ limit: 1, locale: "ro" });
    expect(payload.articles.map((item) => item.documentId)).toEqual(["doc-new"]);
    expect(db.collection).not.toHaveBeenCalledWith("BlogArticole");
  });

  it("paginates published articles with materialized cache cursor", async () => {
    const now = Date.now();
    const db = buildDb({
      manifest: {
        version: 1,
        rowCount: 2,
        chunkCount: 1,
        chunkDocIds: ["articlesPublic__chunk_0"],
      },
      chunks: {
        articlesPublic__chunk_0: {
          version: 1,
          rows: [
            {
              documentId: "doc-new",
              id: "legacy-new",
              scheduledAtMs: now - 1_000,
              scheduledAtTs: new Date(now - 1_000).toISOString(),
              info: { ro: { nume: "Nou" } },
            },
            {
              documentId: "doc-old",
              id: "legacy-old",
              scheduledAtMs: now - 5_000,
              scheduledAtTs: new Date(now - 5_000).toISOString(),
              info: { ro: { nume: "Vechi" } },
            },
          ],
        },
      },
    });
    const { loadPublicArticles } = await loadModuleWithDb(db);

    const firstPage = await loadPublicArticles({ limit: 1, locale: "ro" });
    expect(firstPage.nextCursor).toBe("doc-new");

    const secondPage = await loadPublicArticles({
      limit: 1,
      locale: "ro",
      cursor: firstPage.nextCursor,
    });
    expect(secondPage.articles.map((item) => item.documentId)).toEqual(["doc-old"]);
    expect(secondPage.nextCursor).toBeNull();
  });

  it("filters by category via materialized cache for legacy object categorie shape", async () => {
    const now = Date.now();
    const db = buildDb({
      manifest: {
        version: 1,
        rowCount: 2,
        chunkCount: 1,
        chunkDocIds: ["articlesPublic__chunk_0"],
      },
      chunks: {
        articlesPublic__chunk_0: {
          version: 1,
          rows: [
            {
              documentId: "doc-daily",
              id: "legacy-daily",
              legacyId: "legacy-daily",
              categoryKey: "Previziuni zilnice",
              categorie: { info: { ro: { nume: "Previziuni zilnice" } } },
              scheduledAtMs: now - 1_000,
              scheduledAtTs: new Date(now - 1_000).toISOString(),
              info: { ro: { nume: "Zilnic" } },
            },
            {
              documentId: "doc-weekly",
              id: "legacy-weekly",
              legacyId: "legacy-weekly",
              categoryKey: "Previziuni săptămânale",
              categorie: { info: { ro: { nume: "Previziuni săptămânale" } } },
              scheduledAtMs: now - 2_000,
              scheduledAtTs: new Date(now - 2_000).toISOString(),
              info: { ro: { nume: "Saptamanal" } },
            },
          ],
        },
      },
    });
    const { loadPublicArticles } = await loadModuleWithDb(db);

    const payload = await loadPublicArticles({
      limit: 10,
      locale: "ro",
      category: "Previziuni zilnice",
    });
    expect(payload.articles.map((item) => item.documentId)).toEqual(["doc-daily"]);
    expect(payload.articles[0]?.categorie).toBe("Previziuni zilnice");
  });

  it("filters future scheduled articles and reports next publish timestamp (search path)", async () => {
    const now = Date.now();
    const db = buildDb({
      manifest: {
        version: 1,
        rowCount: 2,
        chunkCount: 1,
        chunkDocIds: ["articlesPublic__chunk_0"],
      },
      chunks: {
        articlesPublic__chunk_0: {
          version: 1,
          rows: [
            {
              documentId: "doc-visible",
              id: "legacy-visible",
              legacyId: "legacy-visible",
              scheduledAtMs: now - 1_000,
              scheduledAtTs: new Date(now - 1_000).toISOString(),
              info: { ro: { nume: "Vizibil", descriere: "findme" } },
            },
            {
              documentId: "doc-future",
              id: "legacy-future",
              legacyId: "legacy-future",
              scheduledAtMs: now + 30_000,
              scheduledAtTs: new Date(now + 30_000).toISOString(),
              info: { ro: { nume: "Viitor", descriere: "findme" } },
            },
          ],
        },
      },
    });
    const { loadPublicArticles } = await loadModuleWithDb(db);

    const payload = await loadPublicArticles({ limit: 10, locale: "ro", search: "findme" });
    expect(payload.articles.map((item) => item.documentId)).toEqual(["doc-visible"]);
    expect(payload.nextPublishAtMs).toBe(now + 30_000);
  });

  it("supports detail lookup by document id and legacy id via direct queries", async () => {
    const now = Date.now();
    const db = buildQueryDb({
      articles: [
        {
          id: "doc-123",
          data: {
            id: "987",
            categorie: "Tarot",
            scheduledAtTs: new Date(now - 1_000).toISOString(),
            info: { ro: { nume: "Test" } },
          },
        },
        {
          id: "doc-related",
          data: {
            id: "related-1",
            categorie: "Tarot",
            scheduledAtTs: new Date(now - 2_000).toISOString(),
            info: { ro: { nume: "Related" } },
          },
        },
      ],
    });
    const { loadPublicArticleDetail } = await loadModuleWithDb(db);

    const byDoc = await loadPublicArticleDetail({ id: "doc-123", locale: "ro" });
    expect(byDoc.article?.documentId).toBe("doc-123");
    expect(byDoc.related.map((item) => item.documentId)).toEqual(["doc-related"]);

    const byLegacy = await loadPublicArticleDetail({ id: "987", locale: "ro" });
    expect(byLegacy.article?.documentId).toBe("doc-123");
  });

  it("rebuilds cache from source collection when manifest is missing", async () => {
    const now = Date.now();
    const db = buildDb({
      sourceRows: [
        {
          id: "legacy-a",
          info: { ro: { nume: "Articol A", descriere: "cache rebuild" } },
          scheduledAtTs: new Date(now - 10_000).toISOString(),
        },
      ],
    });
    const { loadPublicArticles } = await loadModuleWithDb(db);

    const payload = await loadPublicArticles({ limit: 5, locale: "ro", search: "cache rebuild" });
    expect(payload.articles).toHaveLength(1);
    expect(db.setCalls.map((call) => call.id)).toContain("articlesPublic");
    expect(db.setCalls.map((call) => call.id)).toContain("articlesPublic__chunk_0");
  });

  it("stores an oversized article in its own chunk instead of failing the rebuild", async () => {
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    const now = Date.now();
    const hugeBody = "a".repeat(905_000);
    const db = buildDb({
      sourceRows: [
        {
          id: "legacy-huge",
          info: { ro: { nume: "Articol Mare", descriere: hugeBody } },
          scheduledAtTs: new Date(now - 20_000).toISOString(),
        },
        {
          id: "legacy-small",
          info: { ro: { nume: "Articol Mic", descriere: "chunk test" } },
          scheduledAtTs: new Date(now - 10_000).toISOString(),
        },
      ],
    });
    const { loadPublicArticles } = await loadModuleWithDb(db);

    const payload = await loadPublicArticles({ limit: 5, locale: "ro", search: "Articol" });
    expect(payload.articles.map((item) => item.id)).toEqual(
      expect.arrayContaining(["legacy-small", "legacy-huge"])
    );
    const chunkSets = db.setCalls.filter((call) => call.id.startsWith("articlesPublic__chunk_"));
    expect(chunkSets.length).toBeGreaterThanOrEqual(2);
    expect(warnSpy).toHaveBeenCalled();

    warnSpy.mockRestore();
  });

  it("localizes article info to the requested locale + ro fallback", async () => {
    const now = Date.now();
    const db = buildQueryDb({
      articles: [
        {
          id: "doc-multi",
          data: {
            id: "legacy-multi",
            categorie: "Tarot",
            scheduledAtTs: new Date(now - 1_000).toISOString(),
            info: {
              ro: { nume: "Titlu RO", content: "<p>conținut ro</p>" },
              en: { nume: "Title EN", content: "<p>content en</p>" },
              de: { nume: "Titel DE", content: "<p>inhalt de</p>" },
              fr: { nume: "Titre FR", content: "<p>contenu fr</p>" },
              hu: { nume: "Cím HU", content: "<p>tartalom hu</p>" },
            },
          },
        },
      ],
    });

    const { loadPublicArticles, loadPublicArticleDetail } = await loadModuleWithDb(db);

    const enPayload = await loadPublicArticles({ limit: 5, locale: "en" });
    const enArticle = enPayload.articles[0];
    expect(Object.keys(enArticle.info).sort()).toEqual(["en", "ro"]);
    expect(enArticle.info.en.content).toBeUndefined();
    expect(enArticle.info.ro.content).toBeUndefined();

    const roPayload = await loadPublicArticles({ limit: 5, locale: "ro" });
    expect(Object.keys(roPayload.articles[0].info)).toEqual(["ro"]);
    expect(roPayload.articles[0].info.ro.content).toBeUndefined();

    const hiPayload = await loadPublicArticles({ limit: 5, locale: "hi" });
    expect(Object.keys(hiPayload.articles[0].info).sort()).toEqual(["hu", "ro"]);

    const detail = await loadPublicArticleDetail({ id: "doc-multi", locale: "fr" });
    expect(Object.keys(detail.article.info).sort()).toEqual(["fr", "ro"]);
    expect(detail.article.info.fr.content).toBe("<p>contenu fr</p>");
    expect(detail.related.every((item) => !item.info?.fr?.content && !item.info?.ro?.content)).toBe(
      true
    );
  });
});
