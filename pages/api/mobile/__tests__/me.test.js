const requireAuth = jest.fn();
const loadMobileUserProfile = jest.fn();

jest.mock("../../../../lib/requireAuth", () => ({
  requireAuth: (...args) => requireAuth(...args),
}));

jest.mock("../../../../lib/loadMobileUserProfile", () => ({
  loadMobileUserProfile: (...args) => loadMobileUserProfile(...args),
}));

import handler from "../me";

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

describe("/api/mobile/me", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns user profile for authenticated uid", async () => {
    requireAuth.mockResolvedValueOnce({ uid: "uid-123" });
    loadMobileUserProfile.mockResolvedValueOnce({
      user: { owner_uid: "uid-123", first_name: "Ana" },
      source: "doc",
    });

    const req = { method: "GET", query: {}, headers: { authorization: "Bearer token" } };
    const res = makeRes();

    await handler(req, res);

    expect(loadMobileUserProfile).toHaveBeenCalledWith("uid-123", { fresh: false });
    expect(res.statusCode).toBe(200);
    expect(res.headers["Cache-Control"]).toBe("private, max-age=30");
    expect(res.body.user).toEqual({ owner_uid: "uid-123", first_name: "Ana" });
    expect(res.body.source).toBe("doc");
    expect(typeof res.body.requestId).toBe("string");
  });

  it("uses no-store cache when fresh=1", async () => {
    requireAuth.mockResolvedValueOnce({ uid: "uid-123" });
    loadMobileUserProfile.mockResolvedValueOnce({
      user: { owner_uid: "uid-123" },
      source: "query",
    });

    const req = { method: "GET", query: { fresh: "1" }, headers: {} };
    const res = makeRes();

    await handler(req, res);

    expect(res.headers["Cache-Control"]).toBe("private, no-store, max-age=0");
    expect(loadMobileUserProfile).toHaveBeenCalledWith("uid-123", { fresh: true });
    expect(res.body.source).toBe("query");
  });

  it("returns 404 when profile is missing", async () => {
    requireAuth.mockResolvedValueOnce({ uid: "uid-123" });
    loadMobileUserProfile.mockResolvedValueOnce({ user: null, source: null });

    const req = { method: "GET", query: {} };
    const res = makeRes();

    await handler(req, res);

    expect(res.statusCode).toBe(404);
    expect(res.body.error).toBe("User profile not found");
    expect(res.body.user).toBeNull();
  });

  it("returns 401 when auth fails", async () => {
    const authError = new Error("Missing auth token");
    authError.statusCode = 401;
    requireAuth.mockRejectedValueOnce(authError);

    const req = { method: "GET", query: {} };
    const res = makeRes();

    await handler(req, res);

    expect(res.statusCode).toBe(401);
    expect(loadMobileUserProfile).not.toHaveBeenCalled();
  });

  it("rejects non-GET methods", async () => {
    const req = { method: "POST", query: {} };
    const res = makeRes();

    await handler(req, res);

    expect(res.statusCode).toBe(405);
    expect(res.headers.Allow).toBe("GET");
    expect(res.body).toEqual(expect.objectContaining({ error: "Method not allowed" }));
  });
});
