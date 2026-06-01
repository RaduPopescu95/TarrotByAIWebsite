const makeDocSnap = (id, data, exists = true) => ({
  id,
  exists,
  data: () => data,
});

const buildTarotDb = ({ manifest, chunks = {}, rtdbRowsByPath = {} } = {}) => {
  let manifestGetCount = 0;
  const chunkGetCounts = new Map();

  const db = {
    manifestGetCount: () => manifestGetCount,
    chunkGetCount: (docId) => chunkGetCounts.get(docId) || 0,
    collection: jest.fn((name) => ({
      doc: jest.fn((id) => ({
        get: jest.fn(async () => {
          if (name === "internalCaches" && id === "publicTarotData") {
            manifestGetCount += 1;
            return manifest
              ? makeDocSnap(id, manifest, true)
              : makeDocSnap(id, null, false);
          }
          if (name === "internalCaches" && chunks[id]) {
            chunkGetCounts.set(id, (chunkGetCounts.get(id) || 0) + 1);
            return makeDocSnap(id, chunks[id], true);
          }
          return makeDocSnap(id, null, false);
        }),
      })),
    })),
    batch: jest.fn(() => ({
      set: jest.fn(),
      delete: jest.fn(),
      commit: jest.fn(async () => {}),
    })),
  };

  const rtdb = {
    ref: jest.fn((path) => ({
      once: jest.fn(async () => ({
        exists: () => Boolean(rtdbRowsByPath[path]),
        val: () => rtdbRowsByPath[path] || null,
      })),
    })),
  };

  return { db, rtdb };
};

const loadModuleWithDb = async ({ db, rtdb }) => {
  jest.resetModules();
  jest.doMock("../firebaseAdmin", () => ({
    getAdminDb: () => db,
    getAdminRtdb: () => rtdb,
  }));
  return import("../loadPublicTarotData");
};

describe("loadPublicTarotData bulk + manifest cache", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete globalThis.__PUBLIC_TAROT_MEMORY_CACHE__;
    delete globalThis.__PUBLIC_TAROT_MANIFEST_MEMORY__;
    delete globalThis.__PUBLIC_TAROT_MANIFEST_INFLIGHT__;
    delete globalThis.__PUBLIC_TAROT_BULK_INFLIGHT__;
    delete globalThis.__PUBLIC_TAROT_DATASET_INFLIGHT__;
    delete globalThis.__PUBLIC_TAROT_REBUILD_STATE__;
    process.env.PUBLIC_TAROT_MEMORY_TTL_MS = "60000";
  });

  it("loads all datasets with a single manifest read and deduped chunk reads", async () => {
    const { db, rtdb } = buildTarotDb({
      manifest: {
        version: 1,
        datasets: {
          "Citire-Personalizata::Carti": {
            category: "Citire-Personalizata",
            key: "Carti",
            itemCount: 1,
            chunkDocIds: ["publicTarotData__Citire-Personalizata__Carti__chunk_0"],
          },
          "Citire-Personalizata::Categorii": {
            category: "Citire-Personalizata",
            key: "Categorii",
            itemCount: 0,
            chunkDocIds: [],
          },
          "Citire-Viitor::Carti": {
            category: "Citire-Viitor",
            key: "Carti",
            itemCount: 0,
            chunkDocIds: [],
          },
          "Citire-Viitor::Categorii": {
            category: "Citire-Viitor",
            key: "Categorii",
            itemCount: 0,
            chunkDocIds: [],
          },
          "Others::Citate-Motivationale": {
            category: "Others",
            key: "Citate-Motivationale",
            itemCount: 0,
            chunkDocIds: [],
          },
          "Others::Culori-Norocoase": {
            category: "Others",
            key: "Culori-Norocoase",
            itemCount: 0,
            chunkDocIds: [],
          },
          "Others::Numere-Norocoase": {
            category: "Others",
            key: "Numere-Norocoase",
            itemCount: 0,
            chunkDocIds: [],
          },
          "Others::Ore-Norocoase": {
            category: "Others",
            key: "Ore-Norocoase",
            itemCount: 0,
            chunkDocIds: [],
          },
        },
      },
      chunks: {
        "publicTarotData__Citire-Personalizata__Carti__chunk_0": {
          version: 1,
          rows: [{ id: 1, nume: "Test Card" }],
        },
      },
    });

    const module = await loadModuleWithDb({ db, rtdb });
    const first = await module.loadPublicTarotAllDatasets();
    const second = await module.loadPublicTarotAllDatasets();

    expect(first.source).toBe("FIRESTORE");
    expect(first.datasets["Citire-Personalizata-Carti"].arr).toHaveLength(1);
    expect(first.datasets["Others-Ore-Norocoase"].arr).toEqual([]);
    expect(second.source).toBe("MEMORY");
    expect(db.manifestGetCount()).toBe(1);
  });

  it("reuses cached manifest across single-dataset loads", async () => {
    const { db, rtdb } = buildTarotDb({
      manifest: {
        version: 1,
        datasets: {
          "Citire-Personalizata::Carti": {
            category: "Citire-Personalizata",
            key: "Carti",
            itemCount: 1,
            chunkDocIds: ["publicTarotData__Citire-Personalizata__Carti__chunk_0"],
          },
          "Citire-Personalizata::Categorii": {
            category: "Citire-Personalizata",
            key: "Categorii",
            itemCount: 0,
            chunkDocIds: [],
          },
          "Citire-Viitor::Carti": {
            category: "Citire-Viitor",
            key: "Carti",
            itemCount: 0,
            chunkDocIds: [],
          },
          "Citire-Viitor::Categorii": {
            category: "Citire-Viitor",
            key: "Categorii",
            itemCount: 0,
            chunkDocIds: [],
          },
          "Others::Citate-Motivationale": {
            category: "Others",
            key: "Citate-Motivationale",
            itemCount: 0,
            chunkDocIds: [],
          },
          "Others::Culori-Norocoase": {
            category: "Others",
            key: "Culori-Norocoase",
            itemCount: 0,
            chunkDocIds: [],
          },
          "Others::Numere-Norocoase": {
            category: "Others",
            key: "Numere-Norocoase",
            itemCount: 0,
            chunkDocIds: [],
          },
          "Others::Ore-Norocoase": {
            category: "Others",
            key: "Ore-Norocoase",
            itemCount: 0,
            chunkDocIds: [],
          },
        },
      },
      chunks: {
        "publicTarotData__Citire-Personalizata__Carti__chunk_0": {
          version: 1,
          rows: [{ id: 1, nume: "Test Card" }],
        },
      },
    });

    const module = await loadModuleWithDb({ db, rtdb });
    await module.loadPublicTarotDataset("Citire-Personalizata", "Carti");
    await module.loadPublicTarotDataset("Citire-Personalizata", "Categorii");

    expect(db.manifestGetCount()).toBe(1);
  });
});
