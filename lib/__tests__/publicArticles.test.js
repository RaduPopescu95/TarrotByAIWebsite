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

const loadModuleWithDb = async (db) => {
  jest.resetModules();
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

  it("loads visible articles from materialized cache and paginates with cursor", async () => {
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
              info: { ro: { nume: "Nou" } },
            },
            {
              documentId: "doc-mid",
              id: "legacy-mid",
              legacyId: "legacy-mid",
              scheduledAtMs: now - 2_000,
              scheduledAtTs: new Date(now - 2_000).toISOString(),
              info: { ro: { nume: "Mediu" } },
            },
            {
              documentId: "doc-old",
              id: "legacy-old",
              legacyId: "legacy-old",
              scheduledAtMs: now - 3_000,
              scheduledAtTs: new Date(now - 3_000).toISOString(),
              info: { ro: { nume: "Vechi" } },
            },
          ],
        },
      },
    });
    const { loadPublicArticles } = await loadModuleWithDb(db);

    const firstPage = await loadPublicArticles({ limit: 2, locale: "ro" });
    expect(firstPage.articles.map((item) => item.documentId)).toEqual(["doc-new", "doc-mid"]);
    expect(firstPage.nextCursor).toBe("doc-mid");

    const secondPage = await loadPublicArticles({ limit: 2, locale: "ro", cursor: firstPage.nextCursor });
    expect(secondPage.articles.map((item) => item.documentId)).toEqual(["doc-old"]);
    expect(secondPage.nextCursor).toBe("doc-old");
  });

  it("filters future scheduled articles and reports next publish timestamp", async () => {
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
              info: { ro: { nume: "Vizibil" } },
            },
            {
              documentId: "doc-future",
              id: "legacy-future",
              legacyId: "legacy-future",
              scheduledAtMs: now + 30_000,
              scheduledAtTs: new Date(now + 30_000).toISOString(),
              info: { ro: { nume: "Viitor" } },
            },
          ],
        },
      },
    });
    const { loadPublicArticles } = await loadModuleWithDb(db);

    const payload = await loadPublicArticles({ limit: 10, locale: "ro" });
    expect(payload.articles.map((item) => item.documentId)).toEqual(["doc-visible"]);
    expect(payload.nextPublishAtMs).toBe(now + 30_000);
  });

  it("supports detail lookup by document id and legacy id", async () => {
    const now = Date.now();
    const db = buildDb({
      manifest: {
        version: 1,
        rowCount: 1,
        chunkCount: 1,
        chunkDocIds: ["articlesPublic__chunk_0"],
      },
      chunks: {
        articlesPublic__chunk_0: {
          version: 1,
          rows: [
            {
              documentId: "doc-123",
              id: "987",
              legacyId: "987",
              scheduledAtMs: now - 1_000,
              scheduledAtTs: new Date(now - 1_000).toISOString(),
              categoryKey: "Tarot",
              info: { ro: { nume: "Test" } },
            },
          ],
        },
      },
    });
    const { loadPublicArticleDetail } = await loadModuleWithDb(db);

    const byDoc = await loadPublicArticleDetail({ id: "doc-123", locale: "ro" });
    expect(byDoc.article?.documentId).toBe("doc-123");

    const byLegacy = await loadPublicArticleDetail({ id: "987", locale: "ro" });
    expect(byLegacy.article?.documentId).toBe("doc-123");
  });

  it("rebuilds cache from source collection when manifest is missing", async () => {
    const now = Date.now();
    const db = buildDb({
      sourceRows: [
        {
          id: "legacy-a",
          info: { ro: { nume: "Articol A" } },
          scheduledAtTs: new Date(now - 10_000).toISOString(),
        },
      ],
    });
    const { loadPublicArticles } = await loadModuleWithDb(db);

    const payload = await loadPublicArticles({ limit: 5, locale: "ro" });
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
          info: { ro: { nume: "Articol Mic" } },
          scheduledAtTs: new Date(now - 10_000).toISOString(),
        },
      ],
    });
    const { loadPublicArticles } = await loadModuleWithDb(db);

    const payload = await loadPublicArticles({ limit: 5, locale: "ro" });
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
    const db = buildDb({
      manifest: {
        version: 1,
        rowCount: 1,
        chunkCount: 1,
        chunkDocIds: ["articlesPublic__chunk_0"],
      },
      chunks: {
        articlesPublic__chunk_0: {
          version: 1,
          rows: [
            {
              documentId: "doc-multi",
              id: "legacy-multi",
              legacyId: "legacy-multi",
              scheduledAtMs: now - 1_000,
              scheduledAtTs: new Date(now - 1_000).toISOString(),
              categoryKey: "Tarot",
              info: {
                ro: { nume: "Titlu RO", content: "<p>conținut ro</p>" },
                en: { nume: "Title EN", content: "<p>content en</p>" },
                de: { nume: "Titel DE", content: "<p>inhalt de</p>" },
                fr: { nume: "Titre FR", content: "<p>contenu fr</p>" },
                hu: { nume: "Cím HU", content: "<p>tartalom hu</p>" },
              },
            },
          ],
        },
      },
    });

    const { loadPublicArticles, loadPublicArticleDetail } = await loadModuleWithDb(db);

    const enPayload = await loadPublicArticles({ limit: 5, locale: "en" });
    const enArticle = enPayload.articles[0];
    expect(Object.keys(enArticle.info).sort()).toEqual(["en", "ro"]);
    expect(enArticle.info.en.content).toBe("<p>content en</p>");
    expect(enArticle.info.ro.content).toBe("<p>conținut ro</p>");

    const roPayload = await loadPublicArticles({ limit: 5, locale: "ro" });
    expect(Object.keys(roPayload.articles[0].info)).toEqual(["ro"]);

    // hi maps to hu
    const hiPayload = await loadPublicArticles({ limit: 5, locale: "hi" });
    expect(Object.keys(hiPayload.articles[0].info).sort()).toEqual(["hu", "ro"]);

    // detail endpoint also localizes
    const detail = await loadPublicArticleDetail({ id: "doc-multi", locale: "fr" });
    expect(Object.keys(detail.article.info).sort()).toEqual(["fr", "ro"]);
  });
});

