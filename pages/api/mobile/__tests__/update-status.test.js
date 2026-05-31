const loadMobileUpdateStatus = jest.fn();

jest.mock("../../../../lib/mobileUpdatePromptSettings", () => ({
  loadMobileUpdateStatus: (...args) => loadMobileUpdateStatus(...args),
}));

import handler from "../update-status";

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

describe("/api/mobile/update-status", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns normalized flags (force implies show)", async () => {
    loadMobileUpdateStatus.mockResolvedValueOnce({ update: false, forceUpdate: true });
    const req = { method: "GET" };
    const res = makeRes();

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.headers["Cache-Control"]).toBe("public, max-age=60");
    expect(res.body).toEqual({
      showUpdatePrompt: true,
      forceUpdate: true,
      source: "firestore:ShouldUpdate/unicde",
    });
    expect(loadMobileUpdateStatus).toHaveBeenCalledTimes(1);
  });

  it("rejects non-GET methods", async () => {
    const req = { method: "POST" };
    const res = makeRes();

    await handler(req, res);

    expect(res.statusCode).toBe(405);
    expect(res.headers.Allow).toBe("GET");
    expect(res.body).toEqual({ error: "Method not allowed" });
  });

  it("returns 500 when settings read fails", async () => {
    loadMobileUpdateStatus.mockRejectedValueOnce(new Error("boom"));
    const req = { method: "GET" };
    const res = makeRes();

    await handler(req, res);

    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({ error: "Failed to read update status" });
  });
});
