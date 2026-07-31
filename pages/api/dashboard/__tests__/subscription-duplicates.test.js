const getAdminDb = jest.fn(() => ({ marker: "db" }));
const requireDashboardAccess = jest.fn((req) => {
  if (req?.headers?.cookie !== "dashboard_session=test") {
    const error = new Error("Unauthorized");
    error.statusCode = 401;
    throw error;
  }
});
const loadPremiumDuplicateReport = jest.fn();

jest.mock("stripe", () =>
  jest.fn(() => ({ marker: "stripe" })),
);
jest.mock("../../../../lib/firebaseAdmin", () => ({
  getAdminDb: (...args) => getAdminDb(...args),
}));
jest.mock("../../../../lib/requireAuth", () => ({
  requireDashboardAccess: (...args) => requireDashboardAccess(...args),
}));
jest.mock("../../../../lib/stripePremiumDuplicates", () => ({
  loadPremiumDuplicateReport: (...args) => loadPremiumDuplicateReport(...args),
}));

import handler from "../subscription-duplicates";

function makeRes() {
  const res = {
    statusCode: 200,
    body: null,
    headers: {},
    setHeader: jest.fn((key, value) => {
      res.headers[key] = value;
      return res;
    }),
    status: jest.fn((code) => {
      res.statusCode = code;
      return res;
    }),
    json: jest.fn((payload) => {
      res.body = payload;
      return res;
    }),
  };
  return res;
}

describe("/api/dashboard/subscription-duplicates", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("rejects requests without a dashboard session", async () => {
    const res = makeRes();
    await handler({ method: "GET", headers: {} }, res);

    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ error: "Unauthorized" });
    expect(loadPremiumDuplicateReport).not.toHaveBeenCalled();
  });

  it("returns a no-store duplicate report for an authorized GET", async () => {
    const report = {
      totalUsers: 1,
      totalSubscriptions: 2,
      extraSubscriptions: 1,
      unresolvedCount: 0,
      generatedAt: "2026-07-31T10:00:00.000Z",
      groups: [],
    };
    loadPremiumDuplicateReport.mockResolvedValueOnce(report);
    const res = makeRes();

    await handler(
      { method: "GET", headers: { cookie: "dashboard_session=test" } },
      res,
    );

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(report);
    expect(res.headers["Cache-Control"]).toBe("private, no-store, max-age=0");
    expect(loadPremiumDuplicateReport).toHaveBeenCalledWith({
      stripe: { marker: "stripe" },
      db: { marker: "db" },
    });
  });

  it("allows only GET", async () => {
    const res = makeRes();
    await handler(
      { method: "POST", headers: { cookie: "dashboard_session=test" } },
      res,
    );

    expect(res.statusCode).toBe(405);
    expect(res.headers.Allow).toBe("GET");
    expect(loadPremiumDuplicateReport).not.toHaveBeenCalled();
  });
});
