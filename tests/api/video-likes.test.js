const getOptionalAuth = jest.fn();
const requireAuth = jest.fn();
const loadPremiumVideoLibraryRowById = jest.fn();
const resolvePublicVideoLibraryPremiumActive = jest.fn();
const resolveVideoLibraryPremiumAccessForUser = jest.fn();
const getVideoLikeSummary = jest.fn();
const setVideoLikeState = jest.fn();

jest.mock("../../lib/requireAuth", () => ({
  getOptionalAuth: (...args) => getOptionalAuth(...args),
  requireAuth: (...args) => requireAuth(...args),
}));
jest.mock("../../lib/loadPremiumVideoLibrary", () => ({
  loadPremiumVideoLibraryRowById: (...args) => loadPremiumVideoLibraryRowById(...args),
}));
jest.mock("../../lib/videoLibraryAccess", () => ({
  resolvePublicVideoLibraryPremiumActive: (...args) =>
    resolvePublicVideoLibraryPremiumActive(...args),
  resolveVideoLibraryPremiumAccessForUser: (...args) =>
    resolveVideoLibraryPremiumAccessForUser(...args),
}));
jest.mock("../../lib/videoLikes", () => ({
  getVideoLikeSummary: (...args) => getVideoLikeSummary(...args),
  setVideoLikeState: (...args) => setVideoLikeState(...args),
}));

import handler from "../../pages/api/video-likes/[videoId]";

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

describe("/api/video-likes/[videoId]", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getOptionalAuth.mockResolvedValue(null);
    requireAuth.mockResolvedValue({ uid: "user-1" });
    loadPremiumVideoLibraryRowById.mockResolvedValue({
      id: "video-1",
      isPublished: true,
      isPremium: false,
    });
    resolvePublicVideoLibraryPremiumActive.mockResolvedValue(false);
    resolveVideoLibraryPremiumAccessForUser.mockResolvedValue({ premiumActive: false });
    getVideoLikeSummary.mockResolvedValue({
      videoId: "video-1",
      likesCount: 4,
      likedByCurrentUser: false,
      authenticated: false,
    });
    setVideoLikeState.mockResolvedValue({
      videoId: "video-1",
      likesCount: 5,
      likedByCurrentUser: true,
      authenticated: true,
    });
  });

  it("returns a cacheable public count", async () => {
    const req = {
      method: "GET",
      query: { videoId: "video-1" },
      headers: {},
    };
    const res = makeRes();
    await handler(req, res);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({ likesCount: 4 }));
    expect(res.headers["Cache-Control"]).toContain("s-maxage=30");
  });

  it("requires authentication for mutations", async () => {
    const error = new Error("Missing auth token");
    error.statusCode = 401;
    requireAuth.mockRejectedValueOnce(error);
    const req = {
      method: "PUT",
      query: { videoId: "video-1" },
      headers: {},
    };
    const res = makeRes();
    await handler(req, res);
    expect(res.statusCode).toBe(401);
    expect(setVideoLikeState).not.toHaveBeenCalled();
  });

  it("creates and removes a like idempotently through the shared transaction service", async () => {
    const putRes = makeRes();
    await handler(
      { method: "PUT", query: { videoId: "video-1" }, headers: {} },
      putRes
    );
    expect(putRes.statusCode).toBe(200);
    expect(setVideoLikeState).toHaveBeenCalledWith({
      videoId: "video-1",
      uid: "user-1",
      liked: true,
    });

    const deleteRes = makeRes();
    await handler(
      { method: "DELETE", query: { videoId: "video-1" }, headers: {} },
      deleteRes
    );
    expect(setVideoLikeState).toHaveBeenLastCalledWith({
      videoId: "video-1",
      uid: "user-1",
      liked: false,
    });
  });

  it("does not expose a scheduled or inaccessible video", async () => {
    loadPremiumVideoLibraryRowById.mockResolvedValueOnce({
      id: "video-1",
      isPublished: true,
      isPremium: true,
      publishAt: { toMillis: () => Date.now() + 60_000 },
    });
    const res = makeRes();
    await handler(
      { method: "GET", query: { videoId: "video-1" }, headers: {} },
      res
    );
    expect(res.statusCode).toBe(404);
    expect(getVideoLikeSummary).not.toHaveBeenCalled();
  });

  it("rejects unsupported methods", async () => {
    const res = makeRes();
    await handler(
      { method: "POST", query: { videoId: "video-1" }, headers: {} },
      res
    );
    expect(res.statusCode).toBe(405);
    expect(res.headers.Allow).toBe("GET, PUT, DELETE");
  });
});
