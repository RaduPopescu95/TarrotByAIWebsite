const getAdminDb = jest.fn();

jest.mock("../../lib/firebaseAdmin", () => ({
  getAdminDb: (...args) => getAdminDb(...args),
}));

import handler from "../../pages/api/dashboard/user-token-recipient-limit";

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

function makeDb({ config = null, targets = [] } = {}) {
  const configSet = jest.fn(async () => undefined);
  const configRef = {
    get: jest.fn(async () => ({
      exists: Boolean(config),
      data: () => config || {},
    })),
    set: configSet,
  };
  const targetDocs = targets.map((target, index) => ({
    id: `target-${index}`,
    data: () => target,
  }));
  const db = {
    collection: jest.fn((name) => {
      if (name === "notificationSettings") {
        return { doc: jest.fn(() => configRef) };
      }
      if (name === "notificationRecipientTargets") {
        return {
          where: jest.fn(() => ({
            get: jest.fn(async () => ({ docs: targetDocs })),
          })),
        };
      }
      throw new Error(`Unexpected collection ${name}`);
    }),
  };
  return { db, configSet };
}

describe("/api/dashboard/user-token-recipient-limit", () => {
  beforeEach(() => jest.clearAllMocks());

  it("requires dashboard authorization", async () => {
    const req = { method: "GET", headers: {}, query: {} };
    const res = makeRes();
    await handler(req, res);
    expect(res.statusCode).toBe(401);
  });

  it("returns disabled defaults when config is missing", async () => {
    const { db } = makeDb();
    getAdminDb.mockReturnValueOnce(db);
    const req = {
      method: "GET",
      headers: { "x-dashboard-token": "Cristina1994!" },
      query: {},
    };
    const res = makeRes();
    await handler(req, res);
    expect(res.statusCode).toBe(200);
    expect(res.body.config).toEqual(
      expect.objectContaining({
        enabled: false,
        desiredEnabled: false,
        criteria: {
          cities: ["Iași", "Târgoviște"],
          names: ["Cristina", "Tarot Soare și Lună"],
        },
      })
    );
  });

  it("writes an enabled rebuild request with normalized criteria", async () => {
    const { db, configSet } = makeDb();
    getAdminDb.mockReturnValueOnce(db);
    const req = {
      method: "PUT",
      headers: { "x-dashboard-token": "Cristina1994!" },
      body: {
        enabled: true,
        criteria: {
          cities: [" Iași ", "IASI"],
          names: [" Cristina "],
        },
      },
    };
    const res = makeRes();
    await handler(req, res);
    expect(res.statusCode).toBe(202);
    expect(configSet).toHaveBeenCalledWith(
      expect.objectContaining({
        desiredEnabled: true,
        criteria: { cities: ["Iași"], names: ["Cristina"] },
        status: "requested",
      }),
      { merge: true }
    );
  });

  it("returns a deduplicated recipient list for the active version", async () => {
    const config = {
      enabled: true,
      desiredEnabled: true,
      status: "ready",
      activeVersion: "v1",
      criteria: { cities: ["Iași"], names: ["Cristina"] },
    };
    const { db } = makeDb({
      config,
      targets: [
        {
          version: "v1",
          userTokenDocId: "tok-a",
          token: "ExponentPushToken[duplicate]",
          displayName: "Cristina",
          city: "Iași",
          matchReasons: ["city", "name"],
        },
        {
          version: "v1",
          userTokenDocId: "tok-b",
          token: "ExponentPushToken[duplicate]",
          displayName: "Cristina",
          city: "Iași",
          matchReasons: ["name"],
        },
      ],
    });
    getAdminDb.mockReturnValueOnce(db);
    const req = {
      method: "GET",
      headers: { "x-dashboard-token": "Cristina1994!" },
      query: { includeRecipients: "1" },
    };
    const res = makeRes();
    await handler(req, res);
    expect(res.statusCode).toBe(200);
    expect(res.body.config.recipientCount).toBe(1);
    expect(res.body.recipients).toHaveLength(1);
  });
});
