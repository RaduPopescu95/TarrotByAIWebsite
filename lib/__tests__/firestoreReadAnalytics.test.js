import {
  buildReadCostRecommendations,
  loadFirestoreReadAnalytics,
  parseReadAnalyticsParams,
} from "../firestoreReadAnalytics";

function makeSnapshot(rows) {
  return { docs: rows.map((row, index) => ({ id: String(index), data: () => row })) };
}

function makeDb(collectionRows) {
  return {
    collection: jest.fn((name) => ({
      where: jest.fn(() => ({
        limit: jest.fn(() => ({ get: jest.fn(async () => makeSnapshot(collectionRows[name] || [])) })),
      })),
    })),
  };
}

describe("firestoreReadAnalytics", () => {
  it("normalizes filters", () => {
    expect(parseReadAnalyticsParams({ days: "30", source: "expo", search: " Users " })).toEqual({ days: 30, source: "expo", search: "users" });
    expect(parseReadAnalyticsParams({ days: "99", source: "bad" })).toEqual({ days: 7, source: "all", search: "" });
  });

  it("aggregates Next samples and Expo reads", async () => {
    const db = makeDb({
      FirestoreReadTelemetryDaily: [
        { kind: "route", date: "2026-06-13", route: "/api/courses", observedRequests: 10, totalRequestDurationMs: 1000, publicCacheRequests: 10 },
        { kind: "query", date: "2026-06-13", route: "/api/courses", page: "courses", queryName: "courses.visible", sampleRate: 0.1, requestSamples: 10, operationCount: 10, queryCount: 10, docsReturned: 200, estimatedReads: 200, totalDurationMs: 500 },
      ],
      ReadTelemetryDaily: [
        { date: "2026-06-13", screenName: "Home", collectionName: "Users", collectionPathPattern: "Users", logicalReadCalls: 5, estimatedServerDocReads: 40, cacheHits: 1 },
      ],
    });

    const result = await loadFirestoreReadAnalytics(db, { days: 7, source: "all" });
    expect(result.summary.nextObservedReads).toBe(200);
    expect(result.summary.nextProjectedReads).toBe(2000);
    expect(result.summary.expoEstimatedReads).toBe(40);
    expect(result.next.queries[0].readsPerRequest).toBe(20);
    expect(result.trend[0]).toEqual(expect.objectContaining({ nextProjectedReads: 2000, expoEstimatedReads: 40 }));
  });

  it("generates recommendations only after relevant thresholds", () => {
    const recommendations = buildReadCostRecommendations({
      nextRoutes: [],
      nextQueries: [{ route: "/api/clinic", queryName: "appointments", queriesPerRequest: 6, readsPerRequest: 25, repeatedRequestCount: 2, requestSamples: 25, cacheHitRate: 0.1 }],
      expoRows: [{ screenName: "Search", collectionPathPattern: "Users/{doc}/Doctors", realtimeSnapshots: 25 }],
    });
    expect(recommendations.map((row) => row.type)).toEqual(expect.arrayContaining(["n_plus_one", "high_reads_per_request", "repeated_query", "low_cache_hit", "realtime_volume"]));
  });
});
