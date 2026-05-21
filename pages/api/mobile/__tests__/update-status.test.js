const getMobileUpdatePromptEnabled = jest.fn();
const getMobileForceUpdateEnabled = jest.fn();

jest.mock("../../../../lib/mobileUpdatePromptSettings", () => ({
  getMobileUpdatePromptEnabled: (...args) => getMobileUpdatePromptEnabled(...args),
  getMobileForceUpdateEnabled: (...args) => getMobileForceUpdateEnabled(...args),
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
    getMobileUpdatePromptEnabled.mockResolvedValueOnce(false);
    getMobileForceUpdateEnabled.mockResolvedValueOnce(true);
    const req = { method: "GET" };
    const res = makeRes();

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.headers["Cache-Control"]).toBe("no-store, max-age=0");
    expect(res.body).toEqual({
      showUpdatePrompt: true,
      forceUpdate: true,
      source: "firestore:ShouldUpdate/unicde",
    });
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
    getMobileUpdatePromptEnabled.mockRejectedValueOnce(new Error("boom"));
    const req = { method: "GET" };
    const res = makeRes();

    await handler(req, res);

    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({ error: "Failed to read update status" });
  });
});
