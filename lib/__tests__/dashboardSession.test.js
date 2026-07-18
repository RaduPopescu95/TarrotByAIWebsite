import {
  DASHBOARD_SESSION_COOKIE,
  createDashboardSession,
  dashboardSessionCookie,
  readDashboardSession,
  requireDashboardSession,
  verifyDashboardPassword,
} from "../dashboardSession";

describe("dashboardSession", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env.DASHBOARD_PASSWORD = "new-private-dashboard-password";
    process.env.DASHBOARD_SESSION_SECRET = "a-long-random-session-secret-for-tests";
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("validates the password only from server environment", () => {
    expect(verifyDashboardPassword("new-private-dashboard-password")).toBe(true);
    expect(verifyDashboardPassword("old-or-wrong-password")).toBe(false);
  });

  it("creates and verifies a signed HttpOnly session cookie", () => {
    const token = createDashboardSession(1_000);
    const request = { headers: { cookie: `${DASHBOARD_SESSION_COOKIE}=${token}` } };
    expect(readDashboardSession(request, 2_000)).toEqual(
      expect.objectContaining({ version: 1, issuedAt: 1_000 })
    );
    expect(dashboardSessionCookie(token)).toContain("HttpOnly");
    expect(dashboardSessionCookie(token)).toContain("SameSite=Strict");
  });

  it("rejects modified and expired cookies", () => {
    const token = createDashboardSession(1_000);
    const modified = `${token.slice(0, -1)}x`;
    expect(
      readDashboardSession(
        { headers: { cookie: `${DASHBOARD_SESSION_COOKIE}=${modified}` } },
        2_000
      )
    ).toBeNull();
    expect(
      readDashboardSession(
        { headers: { cookie: `${DASHBOARD_SESSION_COOKIE}=${token}` } },
        1_000 + 15 * 24 * 60 * 60 * 1000
      )
    ).toBeNull();
  });

  it("rejects a mutation from a different origin", () => {
    const token = createDashboardSession();
    expect(() =>
      requireDashboardSession(
        {
          method: "POST",
          headers: {
            cookie: `${DASHBOARD_SESSION_COOKIE}=${token}`,
            host: "www.cristinazurba.com",
            origin: "https://attacker.example",
          },
        },
        { mutation: true }
      )
    ).toThrow("Origine dashboard invalidă");
  });

  it("fails closed when server secrets are missing", () => {
    delete process.env.DASHBOARD_SESSION_SECRET;
    expect(() => createDashboardSession()).toThrow("Missing DASHBOARD_SESSION_SECRET");
  });
});
