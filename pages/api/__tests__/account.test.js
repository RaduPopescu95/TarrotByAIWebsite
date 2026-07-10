const requireAuth = jest.fn();
const purgeUserAccount = jest.fn();

jest.mock("../../../lib/requireAuth", () => ({
  requireAuth: (...args) => requireAuth(...args),
}));

jest.mock("../../../lib/accountDeletion", () => ({
  purgeUserAccount: (...args) => purgeUserAccount(...args),
}));

import handler from "../account";

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

describe("/api/account", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 405 for non-DELETE methods", async () => {
    const req = { method: "GET", headers: {} };
    const res = makeRes();

    await handler(req, res);

    expect(res.statusCode).toBe(405);
    expect(res.body.error).toBe("Method not allowed");
  });

  it("returns 401 when auth fails", async () => {
    requireAuth.mockRejectedValueOnce(
      Object.assign(new Error("Unauthorized"), { statusCode: 401 })
    );

    const req = { method: "DELETE", headers: {} };
    const res = makeRes();

    await handler(req, res);

    expect(res.statusCode).toBe(401);
    expect(purgeUserAccount).not.toHaveBeenCalled();
  });

  it("purges account for authenticated user", async () => {
    requireAuth.mockResolvedValueOnce({ uid: "uid-123" });
    purgeUserAccount.mockResolvedValueOnce({
      uid: "uid-123",
      authDeleted: true,
      analysesSoftDeleted: 2,
    });

    const req = { method: "DELETE", headers: { authorization: "Bearer token" } };
    const res = makeRes();

    await handler(req, res);

    expect(purgeUserAccount).toHaveBeenCalledWith("uid-123");
    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.headers["Cache-Control"]).toBe("private, no-store, max-age=0");
  });
});
