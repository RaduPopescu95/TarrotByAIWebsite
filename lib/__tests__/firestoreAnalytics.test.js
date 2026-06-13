import {
  DEFAULT_SAMPLE_LIMIT,
  ESTIMATION_METHOD,
  estimateValueBytes,
  formatBytes,
  loadFirestoreCollectionAnalytics,
  parseAnalyticsParams,
} from "../firestoreAnalytics";

function makeDoc(data) {
  return {
    data: () => data,
  };
}

function makeCollection(id, { count, docs }) {
  return {
    id,
    count: jest.fn(() => ({
      get: jest.fn(async () => ({
        data: () => ({ count }),
      })),
    })),
    limit: jest.fn(() => ({
      get: jest.fn(async () => ({
        docs,
      })),
    })),
  };
}

describe("firestoreAnalytics", () => {
  it("parses params with defaults and bounds", () => {
    expect(parseAnalyticsParams({})).toEqual({
      sampleLimit: DEFAULT_SAMPLE_LIMIT,
      sortBy: "estimatedBytes",
      search: "",
    });

    expect(
      parseAnalyticsParams({
        sampleLimit: "400",
        sortBy: "name",
        search: " Users ",
      })
    ).toEqual({
      sampleLimit: 100,
      sortBy: "name",
      search: "users",
    });
  });

  it("formats byte values for human display", () => {
    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(2048)).toBe("2.00 KB");
  });

  it("returns sorted analytics with exact counts and estimated bytes", async () => {
    const usersDocs = [
      makeDoc({ uid: "1", name: "Ana", city: "Cluj" }),
      makeDoc({ uid: "2", name: "Mara", city: "Iași", tags: ["a", "b"] }),
    ];
    const tinyDocs = [makeDoc({ ok: true })];

    const db = {
      listCollections: jest.fn(async () => [
        makeCollection("tiny", { count: 10, docs: tinyDocs }),
        makeCollection("Users", { count: 4, docs: usersDocs }),
      ]),
    };

    const result = await loadFirestoreCollectionAnalytics(db, {
      sampleLimit: 25,
      sortBy: "estimatedBytes",
    });

    expect(result.meta.estimationMethod).toBe(ESTIMATION_METHOD);
    expect(result.summary.collectionCount).toBe(2);
    expect(result.summary.totalDocumentCount).toBe(14);
    expect(result.collections[0].name).toBe("Users");
    expect(result.collections[0].documentCount).toBe(4);
    expect(result.collections[0].sampledCount).toBe(2);
    expect(result.collections[0].estimatedBytes).toBeGreaterThan(0);
    expect(result.collections[1].shareOfEstimatedTotal).toBeLessThan(1);
  });

  it("returns zero estimated size for empty collections", async () => {
    const db = {
      listCollections: jest.fn(async () => [
        makeCollection("empty", { count: 0, docs: [] }),
      ]),
    };

    const result = await loadFirestoreCollectionAnalytics(db, {});

    expect(result.collections).toEqual([
      expect.objectContaining({
        name: "empty",
        documentCount: 0,
        sampledCount: 0,
        averageDocBytes: 0,
        estimatedBytes: 0,
        estimatedSizeLabel: "0 B",
        shareOfEstimatedTotal: 0,
      }),
    ]);
  });

  it("does not crash when sample documents serialize poorly", async () => {
    const db = {
      listCollections: jest.fn(async () => [
        makeCollection("broken", {
          count: 2,
          docs: [makeDoc(undefined), makeDoc({ ok: true })],
        }),
      ]),
    };

    const result = await loadFirestoreCollectionAnalytics(db, {});

    expect(result.collections[0]).toEqual(
      expect.objectContaining({
        name: "broken",
        sampledCount: 2,
        estimatedBytes: expect.any(Number),
      })
    );
  });

  it("computes byte estimates from serialized payloads", () => {
    expect(estimateValueBytes({ hello: "world" })).toBeGreaterThan(0);
    expect(estimateValueBytes(undefined)).toBe(0);
  });
});
