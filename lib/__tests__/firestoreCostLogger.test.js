const batchCommit = jest.fn();
const batchSet = jest.fn();
const doc = jest.fn((id) => ({ id }));
const collection = jest.fn(() => ({ doc }));
const batch = jest.fn(() => ({ set: batchSet, commit: batchCommit }));

jest.mock("../firebaseAdmin", () => ({
  getAdminDb: () => ({ batch, collection }),
}));

import {
  buildFirestoreReadTelemetryWrites,
  shouldSampleFirestoreReadRequest,
  withFirestoreCostLog,
  withFirestoreReadTelemetry,
} from "../firestoreCostLogger";

function makeRes() {
  return {
    statusCode: 200,
    headers: {},
    setHeader(key, value) { this.headers[key] = value; },
    getHeader(key) { return this.headers[key]; },
  };
}

describe("firestoreCostLogger", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = {
      ...originalEnv,
      FIRESTORE_READ_TELEMETRY_ENABLED: "true",
      FIRESTORE_READ_TELEMETRY_SAMPLE_RATE: "0.1",
    };
    batchCommit.mockResolvedValue(undefined);
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("uses the configured request sample rate", () => {
    expect(shouldSampleFirestoreReadRequest(0.09)).toBe(true);
    expect(shouldSampleFirestoreReadRequest(0.11)).toBe(false);
    process.env.FIRESTORE_READ_TELEMETRY_ENABLED = "false";
    expect(shouldSampleFirestoreReadRequest(0)).toBe(false);
  });

  it("estimates one billed read for an empty query", async () => {
    process.env.FIRESTORE_READ_TELEMETRY_SAMPLE_RATE = "1";
    const handler = withFirestoreReadTelemetry("/api/test", async (_req, res) => {
      await withFirestoreCostLog(
        { page: "api.test", queryName: "empty.query" },
        async () => ({ size: 0, docs: [] })
      );
      res.setHeader("Cache-Control", "public, s-maxage=60");
      return "ok";
    });

    await expect(handler({}, makeRes())).resolves.toBe("ok");
    expect(batchSet).toHaveBeenCalledTimes(2);
    const queryWrite = batchSet.mock.calls.find((call) => call[1].kind === "query");
    expect(queryWrite[1].docsReturned.operand).toBe(0);
    expect(queryWrite[1].estimatedReads.operand).toBe(1);
  });

  it("does not replace the API result when telemetry persistence fails", async () => {
    process.env.FIRESTORE_READ_TELEMETRY_SAMPLE_RATE = "1";
    batchCommit.mockRejectedValueOnce(new Error("telemetry unavailable"));
    const handler = withFirestoreReadTelemetry("/api/test", async () => ({ ok: true }));
    await expect(handler({}, makeRes())).resolves.toEqual({ ok: true });
  });

  it("groups repeated operations and stores route cache metadata", () => {
    const writes = buildFirestoreReadTelemetryWrites(
      {
        route: "/api/test",
        sampleRate: 0.1,
        events: [
          { page: "p", queryName: "q", docsReturned: 2, estimatedReads: 2, queryCount: 1, durationMs: 5, error: false, cacheHit: false },
          { page: "p", queryName: "q", docsReturned: 3, estimatedReads: 3, queryCount: 1, durationMs: 7, error: false, cacheHit: false },
        ],
      },
      { statusCode: 200, durationMs: 20, cacheControl: "public, s-maxage=60" },
      new Date("2026-06-13T10:00:00.000Z")
    );
    expect(writes).toHaveLength(2);
    expect(writes[0].data.publicCacheRequests.operand).toBe(1);
    expect(writes[1].data.estimatedReads.operand).toBe(5);
    expect(writes[1].data.repeatedRequestCount.operand).toBe(1);
  });
});
