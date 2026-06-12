const getAdminDb = jest.fn();

jest.mock("../../../../lib/firebaseAdmin", () => ({
  getAdminDb: (...args) => getAdminDb(...args),
}));

import handler from "../user-tokens";

function makeTimestamp(iso) {
  return {
    toDate: () => new Date(iso),
  };
}

function makeDoc(id, data) {
  return {
    id,
    exists: true,
    data: () => data,
  };
}

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

function makeDb(rows) {
  const docs = rows.map((row) => makeDoc(row.id, row));
  const deletedIds = [];

  const collectionRef = {
    orderBy: jest.fn(() => ({
      limit: jest.fn((limitValue) => ({
        startAfter: jest.fn((cursorSnap) => ({
          get: jest.fn(async () => {
            const startIndex = docs.findIndex((doc) => doc.id === cursorSnap.id) + 1;
            return { docs: docs.slice(startIndex, startIndex + limitValue) };
          }),
        })),
        get: jest.fn(async () => ({ docs: docs.slice(0, limitValue) })),
      })),
    })),
    doc: jest.fn((id) => ({
      id,
      get: jest.fn(async () => docs.find((doc) => doc.id === id) || { exists: false, id }),
    })),
  };

  return {
    deletedIds,
    collection: jest.fn(() => collectionRef),
    batch: jest.fn(() => ({
      delete: jest.fn((docRef) => {
        deletedIds.push(docRef.id);
      }),
      commit: jest.fn(async () => undefined),
    })),
  };
}

function makeTruncatedDb(rowCount) {
  const docs = Array.from({ length: rowCount }, (_, index) =>
    makeDoc(`tok_${String(index).padStart(4, "0")}`, {
      id: `tok_${String(index).padStart(4, "0")}`,
      displayName: "",
      city: "",
      email: `user${index}@test.com`,
      uid: `uid-${index}`,
      disabled: false,
      token: `ExponentPushToken[${index}]`,
      lastSeenAt: makeTimestamp("2026-01-01T10:00:00.000Z"),
    })
  );

  return {
    collection: jest.fn(() => ({
      orderBy: jest.fn(() => ({
        limit: jest.fn(() => ({
          startAfter: jest.fn(() => ({
            get: jest.fn(async () => ({ docs: [] })),
          })),
          get: jest.fn(async () => ({ docs })),
        })),
      })),
      doc: jest.fn((id) => ({
        id,
        get: jest.fn(async () => docs.find((doc) => doc.id === id) || { exists: false, id }),
      })),
    })),
    batch: jest.fn(() => ({
      delete: jest.fn(),
      commit: jest.fn(async () => undefined),
    })),
  };
}

describe("/api/dashboard/user-tokens", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const rows = [
    {
      id: "tok_a",
      displayName: "Ana",
      city: "",
      email: "ana@test.com",
      uid: "uid-a",
      disabled: false,
      token: "ExponentPushToken[aaaa]",
      lastSeenAt: makeTimestamp("2026-01-01T10:00:00.000Z"),
    },
    {
      id: "tok_b",
      displayName: "",
      city: "Cluj-Napoca",
      email: "cluj@test.com",
      uid: "uid-b",
      disabled: false,
      token: "ExponentPushToken[bbbb]",
      lastSeenAt: makeTimestamp("2026-01-02T10:00:00.000Z"),
    },
    {
      id: "tok_c",
      displayName: "",
      city: "Iași",
      email: "iasi@test.com",
      uid: "uid-c",
      disabled: true,
      token: "ExponentPushToken[cccc]",
      lastSeenAt: makeTimestamp("2026-01-03T10:00:00.000Z"),
    },
  ];

  it("previews inverse delete against the full collection", async () => {
    getAdminDb.mockReturnValueOnce(makeDb(rows));

    const req = {
      method: "POST",
      headers: { "x-dashboard-token": "Cristina1994!" },
      body: {
        action: "previewDelete",
        mode: "delete_all_except_selected",
        filters: { missingCity: true },
        selectedIds: ["tok_a"],
      },
    };
    const res = makeRes();

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(
      expect.objectContaining({
        collectionCount: 3,
        matchedCount: 3,
        selectedCount: 1,
        excludedCount: 1,
        deleteCount: 2,
        invalidSelectedCount: 0,
        scanTruncated: false,
      })
    );
  });

  it("reports invalid selected ids in inverse preview", async () => {
    getAdminDb.mockReturnValueOnce(makeDb(rows));

    const req = {
      method: "POST",
      headers: { "x-dashboard-token": "Cristina1994!" },
      body: {
        action: "previewDelete",
        mode: "delete_all_except_selected",
        filters: { cityNotIn: ["Iași"] },
        selectedIds: ["tok_b", "tok_missing"],
      },
    };
    const res = makeRes();

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(
      expect.objectContaining({
        collectionCount: 3,
        matchedCount: 3,
        selectedCount: 2,
        excludedCount: 1,
        deleteCount: 2,
        invalidSelectedCount: 1,
      })
    );
  });

  it("deletes every token except selected keep ids", async () => {
    const db = makeDb(rows);
    getAdminDb.mockReturnValueOnce(db);

    const req = {
      method: "DELETE",
      headers: { "x-dashboard-token": "Cristina1994!" },
      body: {
        action: "bulkDelete",
        mode: "delete_all_except_selected",
        filters: { missingName: true },
        selectedIds: ["tok_c"],
        confirmText: "STERGE TOKENS",
      },
    };
    const res = makeRes();

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(
      expect.objectContaining({
        collectionCount: 3,
        matchedCount: 3,
        excludedCount: 1,
        deleteCount: 2,
        deletedCount: 2,
      })
    );
    expect(db.deletedIds).toEqual(["tok_a", "tok_b"]);
  });

  it("rejects invalid confirmation text", async () => {
    getAdminDb.mockReturnValueOnce(makeDb(rows));

    const req = {
      method: "DELETE",
      headers: { "x-dashboard-token": "Cristina1994!" },
      body: {
        action: "bulkDelete",
        mode: "delete_selected",
        filters: {},
        selectedIds: ["tok_a"],
        confirmText: "gresit",
      },
    };
    const res = makeRes();

    await handler(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe("Invalid confirmation text");
  });

  it("rejects delete when preview scan is truncated", async () => {
    getAdminDb.mockReturnValueOnce(makeDb(rows));

    const req = {
      method: "DELETE",
      headers: { "x-dashboard-token": "Cristina1994!" },
      body: {
        action: "bulkDelete",
        mode: "delete_all_except_selected",
        filters: { missingCity: true },
        selectedIds: [],
        confirmText: "STERGE TOKENS",
        previewScanTruncated: true,
      },
    };
    const res = makeRes();

    await handler(req, res);

    expect(res.statusCode).toBe(409);
    expect(res.body).toEqual(
      expect.objectContaining({
        error: "Refine filters before bulk delete",
        scanTruncated: true,
      })
    );
  });
});
