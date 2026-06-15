const makeDocSnap = (id, data, exists = true) => ({
  id,
  exists,
  data: () => data,
});

const makeQuerySnap = (docs) => ({
  forEach: (callback) => docs.forEach(callback),
});

const buildDb = ({ cacheDoc = null, collectionRows = [] } = {}) => {
  const setCalls = [];
  const db = {
    setCalls,
    collection: jest.fn((name) => ({
      doc: jest.fn((id) => ({
        get: jest.fn(async () => {
          if (name === "internalCaches" && id === "partnerPromotionsPublic") {
            return cacheDoc
              ? makeDocSnap(id, cacheDoc, true)
              : makeDocSnap(id, null, false);
          }
          return makeDocSnap(id, null, false);
        }),
        set: jest.fn(async (payload) => {
          setCalls.push({ name, id, payload });
        }),
      })),
      get: jest.fn(async () =>
        makeQuerySnap(
          collectionRows.map((row) => makeDocSnap(row.id, row))
        )
      ),
    })),
  };
  return db;
};

const loadWithDb = async (db) => {
  jest.resetModules();
  jest.doMock("../../firebaseAdmin", () => ({
    getAdminDb: () => db,
  }));
  return import("../loadPartnerPromotionsPublic");
};

describe("loadPartnerPromotionsPublic", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.PARTNER_PROMOTIONS_CACHE_TTL_MS = "60000";
  });

  it("rebuilds materialized cache with rows and nextChangeAtMs", async () => {
    const db = buildDb({
      collectionRows: [
        {
          id: "promo-1",
          name: "Partner One",
          logoUrl: "https://img.test/1.png",
          description: "Promo one",
          linkUrl: "https://partner.test",
          linkType: "website",
          displayStartAt: { toDate: () => new Date("2026-06-01T00:00:00.000Z") },
          displayEndAt: { toDate: () => new Date("2026-06-30T00:00:00.000Z") },
          isActive: true,
          placements: ["web_home_top"],
          sortOrder: 0,
          locale: "all",
          createdAt: { toDate: () => new Date("2026-06-01T00:00:00.000Z") },
          updatedAt: { toDate: () => new Date("2026-06-01T00:00:00.000Z") },
        },
      ],
    });

    const mod = await loadWithDb(db);
    const rows = await mod.rebuildPartnerPromotionsMaterializedCache();

    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe("promo-1");
    expect(db.setCalls).toHaveLength(1);
    expect(db.setCalls[0]).toMatchObject({
      name: "internalCaches",
      id: "partnerPromotionsPublic",
    });
    expect(db.setCalls[0].payload).toMatchObject({
      version: 1,
      rowCount: 1,
      rows: expect.any(Array),
    });
  });

  it("loads promotions for placement from cached document", async () => {
    const nowMs = Date.parse("2026-06-15T12:00:00.000Z");
    const db = buildDb({
      cacheDoc: {
        version: 1,
        rows: [
          {
            id: "promo-1",
            name: "Partner One",
            logoUrl: "https://img.test/1.png",
            description: "Promo one",
            linkUrl: "https://partner.test",
            linkType: "website",
            displayStartAt: "2026-06-01T00:00:00.000Z",
            displayEndAt: "2026-06-30T00:00:00.000Z",
            isActive: true,
            placements: ["web_home_top"],
            sortOrder: 0,
            locale: "all",
          },
        ],
        nextChangeAtMs: Date.parse("2026-06-30T00:00:00.000Z"),
      },
    });

    const mod = await loadWithDb(db);
    mod.clearPartnerPromotionsMemoryCache();
    const payload = await mod.loadPartnerPromotionsForPlacement({
      placement: "web_home_top",
      locale: "ro",
      nowMs,
    });

    expect(payload.placement).toBe("web_home_top");
    expect(payload.promotions).toHaveLength(1);
    expect(payload.promotions[0]).toMatchObject({
      id: "promo-1",
      name: "Partner One",
      linkType: "website",
    });
    expect(payload.nextChangeAtMs).toBe(Date.parse("2026-06-30T00:00:00.000Z"));
  });
});
