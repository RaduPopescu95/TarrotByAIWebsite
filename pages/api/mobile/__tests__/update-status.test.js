const loadMobileUpdateStatus = jest.fn();

jest.mock("../../../../lib/mobileUpdatePromptSettings", () => ({
  loadMobileUpdateStatus: (...args) => loadMobileUpdateStatus(...args),
  normalizeMobilePlatform: jest.requireActual("../../../../lib/mobileUpdatePromptSettings")
    .normalizeMobilePlatform,
  resolveMobileUpdatePrompt: jest.requireActual("../../../../lib/mobileUpdatePromptSettings")
    .resolveMobileUpdatePrompt,
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

  it("returns normalized flags (force implies show) without version filtering", async () => {
    loadMobileUpdateStatus.mockResolvedValueOnce({
      update: false,
      forceUpdate: true,
      minAppVersionIos: null,
      minAppVersionAndroid: null,
    });
    const req = { method: "GET", query: {} };
    const res = makeRes();

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.headers["Cache-Control"]).toBe("private, no-store, max-age=0");
    expect(res.body).toEqual({
      showUpdatePrompt: true,
      forceUpdate: true,
      minAppVersionIos: null,
      minAppVersionAndroid: null,
      platform: null,
      appVersion: null,
      source: "firestore:ShouldUpdate/unicde",
    });
    expect(loadMobileUpdateStatus).toHaveBeenCalledTimes(1);
  });

  it("filters prompt when app version meets minimum", async () => {
    loadMobileUpdateStatus.mockResolvedValueOnce({
      update: true,
      forceUpdate: true,
      minAppVersionIos: "2.3.0",
      minAppVersionAndroid: "2.3.0",
    });
    const req = {
      method: "GET",
      query: { platform: "ios", appVersion: "2.3.0" },
    };
    const res = makeRes();

    await handler(req, res);

    expect(res.body).toEqual({
      showUpdatePrompt: false,
      forceUpdate: false,
      minAppVersionIos: "2.3.0",
      minAppVersionAndroid: "2.3.0",
      platform: "ios",
      appVersion: "2.3.0",
      source: "firestore:ShouldUpdate/unicde",
    });
  });

  it("hides prompt when android app version is above minimum", async () => {
    loadMobileUpdateStatus.mockResolvedValueOnce({
      update: true,
      forceUpdate: true,
      minAppVersionIos: "2.3.0",
      minAppVersionAndroid: "2.3.0",
    });
    const req = {
      method: "GET",
      query: { platform: "android", appVersion: "2.4.0" },
    };
    const res = makeRes();

    await handler(req, res);

    expect(res.body.showUpdatePrompt).toBe(false);
    expect(res.body.forceUpdate).toBe(false);
    expect(res.headers["Cache-Control"]).toBe("private, no-store, max-age=0");
  });

  it("shows soft update when below minimum and force is off", async () => {
    loadMobileUpdateStatus.mockResolvedValueOnce({
      update: true,
      forceUpdate: false,
      minAppVersionIos: "2.3.0",
      minAppVersionAndroid: "2.3.0",
    });
    const req = {
      method: "GET",
      query: { platform: "ios", appVersion: "2.2.9" },
    };
    const res = makeRes();

    await handler(req, res);

    expect(res.body).toEqual({
      showUpdatePrompt: true,
      forceUpdate: false,
      minAppVersionIos: "2.3.0",
      minAppVersionAndroid: "2.3.0",
      platform: "ios",
      appVersion: "2.2.9",
      source: "firestore:ShouldUpdate/unicde",
    });
  });

  it("shows force prompt when app version is below minimum", async () => {
    loadMobileUpdateStatus.mockResolvedValueOnce({
      update: true,
      forceUpdate: true,
      minAppVersionIos: "2.3.0",
      minAppVersionAndroid: "2.3.0",
    });
    const req = {
      method: "GET",
      query: { platform: "android", appVersion: "2.2.9" },
    };
    const res = makeRes();

    await handler(req, res);

    expect(res.body.showUpdatePrompt).toBe(true);
    expect(res.body.forceUpdate).toBe(true);
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
    const req = { method: "GET", query: {} };
    const res = makeRes();

    await handler(req, res);

    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({ error: "Failed to read update status" });
  });
});
