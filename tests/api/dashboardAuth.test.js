import loginHandler from "../../pages/api/dashboard/auth/login";
import logoutHandler from "../../pages/api/dashboard/auth/logout";
import sessionHandler from "../../pages/api/dashboard/auth/session";

function makeReq(method, { body = {}, cookie = "", origin = "https://admin.test" } = {}) {
  return {
    method,
    body,
    headers: {
      host: "admin.test",
      origin,
      ...(cookie ? { cookie } : {}),
    },
  };
}

function makeRes() {
  const response = {
    statusCode: 200,
    body: null,
    headers: {},
    setHeader: jest.fn((name, value) => {
      response.headers[name] = value;
      return response;
    }),
    status: jest.fn((statusCode) => {
      response.statusCode = statusCode;
      return response;
    }),
    json: jest.fn((body) => {
      response.body = body;
      return response;
    }),
  };
  return response;
}

describe("dashboard session API", () => {
  const originalSecret = process.env.DASHBOARD_SESSION_SECRET;

  beforeEach(() => {
    process.env.DASHBOARD_SESSION_SECRET = "dashboard-session-secret-used-only-in-tests";
  });

  afterAll(() => {
    if (originalSecret == null) delete process.env.DASHBOARD_SESSION_SECRET;
    else process.env.DASHBOARD_SESSION_SECRET = originalSecret;
  });

  it("logs in server-side and exposes only an HttpOnly session cookie", () => {
    const loginRes = makeRes();
    loginHandler(
      makeReq("POST", { body: { password: "Cristina1994!" } }),
      loginRes
    );

    expect(loginRes.statusCode).toBe(200);
    expect(loginRes.body).toEqual({ authenticated: true });
    expect(loginRes.headers["Set-Cookie"]).toContain("dashboard_session=");
    expect(loginRes.headers["Set-Cookie"]).toContain("HttpOnly");
    expect(loginRes.headers["Set-Cookie"]).toContain("SameSite=Strict");
    expect(loginRes.headers["Set-Cookie"]).not.toContain("Cristina1994!");

    const cookie = loginRes.headers["Set-Cookie"].split(";")[0];
    const sessionRes = makeRes();
    sessionHandler(makeReq("GET", { cookie }), sessionRes);
    expect(sessionRes.statusCode).toBe(200);
    expect(sessionRes.body.authenticated).toBe(true);
  });

  it("rejects a wrong password and an invalid origin", () => {
    const wrongPasswordRes = makeRes();
    loginHandler(
      makeReq("POST", { body: { password: "wrong" } }),
      wrongPasswordRes
    );
    expect(wrongPasswordRes.statusCode).toBe(401);

    const invalidOriginRes = makeRes();
    loginHandler(
      makeReq("POST", {
        body: { password: "Cristina1994!" },
        origin: "https://attacker.test",
      }),
      invalidOriginRes
    );
    expect(invalidOriginRes.statusCode).toBe(403);
  });

  it("rejects a modified cookie and clears a valid session on logout", () => {
    const modifiedRes = makeRes();
    sessionHandler(
      makeReq("GET", { cookie: "dashboard_session=modified.invalid" }),
      modifiedRes
    );
    expect(modifiedRes.statusCode).toBe(401);

    const loginRes = makeRes();
    loginHandler(
      makeReq("POST", { body: { password: "Cristina1994!" } }),
      loginRes
    );
    const cookie = loginRes.headers["Set-Cookie"].split(";")[0];
    const logoutRes = makeRes();
    logoutHandler(makeReq("POST", { cookie }), logoutRes);
    expect(logoutRes.statusCode).toBe(200);
    expect(logoutRes.headers["Set-Cookie"]).toContain("Max-Age=0");
  });

  it("uses the fixed dashboard password when no password environment variable is set", () => {
    delete process.env.DASHBOARD_PASSWORD;
    const response = makeRes();
    loginHandler(makeReq("POST", { body: { password: "Cristina1994!" } }), response);
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ authenticated: true });
  });
});
