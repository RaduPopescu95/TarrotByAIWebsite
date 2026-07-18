const getAdminDb = jest.fn();
const loadFirestoreReadAnalytics = jest.fn();
const parseReadAnalyticsParams = jest.fn();
const requireDashboardAccess = jest.fn((req) => {
  if (req?.headers?.cookie !== "dashboard_session=test") {
    const error = new Error("Unauthorized");
    error.statusCode = 401;
    throw error;
  }
});

jest.mock("../../lib/firebaseAdmin", () => ({ getAdminDb: (...args) => getAdminDb(...args) }));
jest.mock("../../lib/firestoreReadAnalytics", () => ({
  loadFirestoreReadAnalytics: (...args) => loadFirestoreReadAnalytics(...args),
  parseReadAnalyticsParams: (...args) => parseReadAnalyticsParams(...args),
}));
jest.mock("../../lib/requireAuth", () => ({
  requireDashboardAccess: (...args) => requireDashboardAccess(...args),
}));

import handler from "../../pages/api/dashboard/analytics/reads";

function makeRes() {
  const res = { statusCode: 200, body: null, headers: {} };
  res.setHeader = jest.fn((key, value) => { res.headers[key] = value; return res; });
  res.status = jest.fn((code) => { res.statusCode = code; return res; });
  res.json = jest.fn((payload) => { res.body = payload; return res; });
  return res;
}

describe("/api/dashboard/analytics/reads", () => {
  beforeEach(() => jest.clearAllMocks());

  it("rejects unauthorized requests", async () => {
    const res = makeRes();
    await handler({ method: "GET", headers: {}, query: {} }, res);
    expect(res.statusCode).toBe(401);
  });

  it("returns the read analytics payload", async () => {
    const db = {};
    getAdminDb.mockReturnValue(db);
    parseReadAnalyticsParams.mockReturnValue({ days: 7, source: "all", search: "" });
    loadFirestoreReadAnalytics.mockResolvedValue({ summary: {}, trend: [], next: { routes: [], queries: [] }, expo: { rows: [] }, recommendations: [], meta: { days: 7 } });
    const res = makeRes();
    await handler({ method: "GET", headers: { cookie: "dashboard_session=test" }, query: {} }, res);
    expect(loadFirestoreReadAnalytics).toHaveBeenCalledWith(db, { days: 7, source: "all", search: "" });
    expect(res.statusCode).toBe(200);
    expect(res.body.meta.requestId).toEqual(expect.any(String));
  });

  it("handles Firestore failures", async () => {
    getAdminDb.mockReturnValue({});
    parseReadAnalyticsParams.mockReturnValue({ days: 7, source: "all", search: "" });
    loadFirestoreReadAnalytics.mockRejectedValue(new Error("boom"));
    const res = makeRes();
    await handler({ method: "GET", headers: { cookie: "dashboard_session=test" }, query: {} }, res);
    expect(res.statusCode).toBe(500);
    expect(res.body.error).toBe("Failed to load read analytics");
  });
});
