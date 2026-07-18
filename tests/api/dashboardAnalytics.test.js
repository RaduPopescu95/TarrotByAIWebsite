const getAdminDb = jest.fn();
const loadFirestoreCollectionAnalytics = jest.fn();
const parseAnalyticsParams = jest.fn();
const requireDashboardAccess = jest.fn((req) => {
  if (req?.headers?.cookie !== "dashboard_session=test") {
    const error = new Error("Unauthorized");
    error.statusCode = 401;
    throw error;
  }
});

jest.mock("../../lib/firebaseAdmin", () => ({
  getAdminDb: (...args) => getAdminDb(...args),
}));

jest.mock("../../lib/firestoreAnalytics", () => ({
  loadFirestoreCollectionAnalytics: (...args) => loadFirestoreCollectionAnalytics(...args),
  parseAnalyticsParams: (...args) => parseAnalyticsParams(...args),
}));
jest.mock("../../lib/requireAuth", () => ({
  requireDashboardAccess: (...args) => requireDashboardAccess(...args),
}));

import handler from "../../pages/api/dashboard/analytics";

function makeRes() {
  const res = { statusCode: 200, body: null, headers: {} };
  res.setHeader = jest.fn((key, value) => { res.headers[key] = value; return res; });
  res.status = jest.fn((code) => { res.statusCode = code; return res; });
  res.json = jest.fn((payload) => { res.body = payload; return res; });
  return res;
}

describe("/api/dashboard/analytics", () => {
  beforeEach(() => jest.clearAllMocks());

  it("rejects unauthorized requests", async () => {
    const res = makeRes();
    await handler({ method: "GET", headers: {}, query: {} }, res);
    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ error: "Unauthorized" });
  });

  it("returns analytics response shape for authorized requests", async () => {
    const db = { ok: true };
    getAdminDb.mockReturnValueOnce(db);
    parseAnalyticsParams.mockReturnValueOnce({ sampleLimit: 25, sortBy: "estimatedBytes", search: "" });
    loadFirestoreCollectionAnalytics.mockResolvedValueOnce({
      collections: [{ name: "Users", documentCount: 120, sampledCount: 25, averageDocBytes: 300, estimatedBytes: 36000, estimatedSizeLabel: "35.2 KB", shareOfEstimatedTotal: 1 }],
      summary: { collectionCount: 1, totalDocumentCount: 120, totalEstimatedBytes: 36000, largestCollectionName: "Users", largestEstimatedBytes: 36000 },
      meta: { sampleLimit: 25, generatedAt: "2026-06-13T12:00:00.000Z", durationMs: 45, estimationMethod: "count_plus_sample", sortBy: "estimatedBytes", search: "" },
    });
    const req = { method: "GET", headers: { cookie: "dashboard_session=test" }, query: { sampleLimit: "25" } };
    const res = makeRes();
    await handler(req, res);
    expect(loadFirestoreCollectionAnalytics).toHaveBeenCalledWith(db, { sampleLimit: 25, sortBy: "estimatedBytes", search: "" });
    expect(res.statusCode).toBe(200);
    expect(res.body.meta.requestId).toEqual(expect.any(String));
  });

  it("returns 500 when analytics loading fails", async () => {
    getAdminDb.mockReturnValueOnce({});
    parseAnalyticsParams.mockReturnValueOnce({ sampleLimit: 25, sortBy: "estimatedBytes", search: "" });
    loadFirestoreCollectionAnalytics.mockRejectedValueOnce(new Error("boom"));
    const res = makeRes();
    await handler({ method: "GET", headers: { cookie: "dashboard_session=test" }, query: {} }, res);
    expect(res.statusCode).toBe(500);
    expect(res.body.error).toBe("Failed to load analytics");
  });
});
