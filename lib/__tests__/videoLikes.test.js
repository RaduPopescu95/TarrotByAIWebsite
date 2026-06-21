jest.mock("firebase-admin/firestore", () => ({
  FieldValue: {
    serverTimestamp: jest.fn(() => "server-timestamp"),
  },
}));

import {
  buildVideoLikeDocId,
  getVideoLikeSummary,
  normalizeLikesCount,
  setVideoLikeState,
} from "../videoLikes";

function makeDb({ likeExists = false, likesCount = 0 } = {}) {
  const refs = new Map();
  const makeRef = (collectionName, id) => {
    const key = `${collectionName}/${id}`;
    if (!refs.has(key)) refs.set(key, { collectionName, id });
    return refs.get(key);
  };
  const transaction = {
    get: jest.fn(async (ref) => {
      if (ref.collectionName === "videosVideoModule") {
        return { exists: true, data: () => ({ isPublished: true }) };
      }
      if (ref.collectionName === "videoLikes") {
        return { exists: likeExists, data: () => ({}) };
      }
      return {
        exists: true,
        data: () => ({ likesCount }),
      };
    }),
    create: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
  };
  const db = {
    collection: jest.fn((collectionName) => ({
      doc: jest.fn((id) => {
        const ref = makeRef(collectionName, id);
        ref.get = jest.fn(async () => {
          if (collectionName === "videoLikes") {
            return { exists: likeExists, data: () => ({}) };
          }
          return { exists: true, data: () => ({ likesCount }) };
        });
        return ref;
      }),
    })),
    runTransaction: jest.fn(async (callback) => callback(transaction)),
  };
  return { db, transaction };
}

describe("videoLikes", () => {
  it("builds a deterministic document id", () => {
    expect(buildVideoLikeDocId("video-1", "user-1")).toBe("video-1__user-1");
  });

  it("normalizes counters safely", () => {
    expect(normalizeLikesCount(-1)).toBe(0);
    expect(normalizeLikesCount("3")).toBe(3);
    expect(normalizeLikesCount("bad")).toBe(0);
  });

  it("returns public count and current-user state", async () => {
    const { db } = makeDb({ likeExists: true, likesCount: 7 });
    await expect(getVideoLikeSummary("video-1", "user-1", db)).resolves.toEqual({
      videoId: "video-1",
      likesCount: 7,
      likedByCurrentUser: true,
      authenticated: true,
    });
  });

  it("creates only one like and increments the counter once", async () => {
    const first = makeDb({ likeExists: false, likesCount: 2 });
    await expect(
      setVideoLikeState({ videoId: "video-1", uid: "user-1", liked: true, db: first.db })
    ).resolves.toEqual(
      expect.objectContaining({ likesCount: 3, likedByCurrentUser: true })
    );
    expect(first.transaction.create).toHaveBeenCalledTimes(1);
    expect(first.transaction.set).toHaveBeenCalledWith(
      expect.objectContaining({ collectionName: "videoLikeStats" }),
      expect.objectContaining({ likesCount: 3 }),
      { merge: true }
    );

    const repeated = makeDb({ likeExists: true, likesCount: 3 });
    await setVideoLikeState({
      videoId: "video-1",
      uid: "user-1",
      liked: true,
      db: repeated.db,
    });
    expect(repeated.transaction.create).not.toHaveBeenCalled();
    expect(repeated.transaction.set).not.toHaveBeenCalled();
  });

  it("removes a like idempotently without allowing a negative count", async () => {
    const existing = makeDb({ likeExists: true, likesCount: 0 });
    await expect(
      setVideoLikeState({
        videoId: "video-1",
        uid: "user-1",
        liked: false,
        db: existing.db,
      })
    ).resolves.toEqual(
      expect.objectContaining({ likesCount: 0, likedByCurrentUser: false })
    );
    expect(existing.transaction.delete).toHaveBeenCalledTimes(1);

    const missing = makeDb({ likeExists: false, likesCount: 0 });
    await setVideoLikeState({
      videoId: "video-1",
      uid: "user-1",
      liked: false,
      db: missing.db,
    });
    expect(missing.transaction.delete).not.toHaveBeenCalled();
    expect(missing.transaction.set).not.toHaveBeenCalled();
  });
});
