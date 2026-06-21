import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "./firebaseAdmin";

export const VIDEO_LIKES_COLLECTION = "videoLikes";
export const VIDEO_LIKE_STATS_COLLECTION = "videoLikeStats";

function normalizeId(value) {
  return typeof value === "string" ? value.trim() : "";
}

export function normalizeLikesCount(value) {
  const count = Number(value);
  if (!Number.isFinite(count) || count <= 0) return 0;
  return Math.floor(count);
}

export function buildVideoLikeDocId(videoId, uid) {
  const normalizedVideoId = normalizeId(videoId);
  const normalizedUid = normalizeId(uid);
  if (!normalizedVideoId || !normalizedUid) {
    throw new Error("videoId and uid are required");
  }
  return `${normalizedVideoId}__${normalizedUid}`;
}

export async function getVideoLikeSummary(videoId, uid = null, db = getAdminDb()) {
  const normalizedVideoId = normalizeId(videoId);
  const normalizedUid = normalizeId(uid);
  if (!normalizedVideoId) {
    return {
      videoId: "",
      likesCount: 0,
      likedByCurrentUser: false,
      authenticated: Boolean(normalizedUid),
    };
  }

  const statsRef = db.collection(VIDEO_LIKE_STATS_COLLECTION).doc(normalizedVideoId);
  const likeRef = normalizedUid
    ? db
        .collection(VIDEO_LIKES_COLLECTION)
        .doc(buildVideoLikeDocId(normalizedVideoId, normalizedUid))
    : null;
  const [statsSnap, likeSnap] = await Promise.all([
    statsRef.get(),
    likeRef ? likeRef.get() : Promise.resolve(null),
  ]);

  return {
    videoId: normalizedVideoId,
    likesCount: normalizeLikesCount(statsSnap.exists ? statsSnap.data()?.likesCount : 0),
    likedByCurrentUser: Boolean(likeSnap?.exists),
    authenticated: Boolean(normalizedUid),
  };
}

export async function setVideoLikeState({
  videoId,
  uid,
  liked,
  db = getAdminDb(),
}) {
  const normalizedVideoId = normalizeId(videoId);
  const normalizedUid = normalizeId(uid);
  if (!normalizedVideoId || !normalizedUid) {
    const error = new Error("videoId and uid are required");
    error.statusCode = 400;
    throw error;
  }

  const likeRef = db
    .collection(VIDEO_LIKES_COLLECTION)
    .doc(buildVideoLikeDocId(normalizedVideoId, normalizedUid));
  const statsRef = db.collection(VIDEO_LIKE_STATS_COLLECTION).doc(normalizedVideoId);
  const videoRef = db.collection("videosVideoModule").doc(normalizedVideoId);

  return db.runTransaction(async (transaction) => {
    const [videoSnap, likeSnap, statsSnap] = await Promise.all([
      transaction.get(videoRef),
      transaction.get(likeRef),
      transaction.get(statsRef),
    ]);
    if (!videoSnap.exists || videoSnap.data()?.isPublished !== true) {
      const error = new Error("Not found");
      error.statusCode = 404;
      throw error;
    }
    const currentCount = normalizeLikesCount(
      statsSnap.exists ? statsSnap.data()?.likesCount : 0
    );

    if (liked === true) {
      if (!likeSnap.exists) {
        transaction.create(likeRef, {
          videoId: normalizedVideoId,
          uid: normalizedUid,
          createdAt: FieldValue.serverTimestamp(),
        });
        transaction.set(
          statsRef,
          {
            videoId: normalizedVideoId,
            likesCount: currentCount + 1,
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
        return {
          videoId: normalizedVideoId,
          likesCount: currentCount + 1,
          likedByCurrentUser: true,
          authenticated: true,
        };
      }

      return {
        videoId: normalizedVideoId,
        likesCount: currentCount,
        likedByCurrentUser: true,
        authenticated: true,
      };
    }

    if (likeSnap.exists) {
      const nextCount = Math.max(0, currentCount - 1);
      transaction.delete(likeRef);
      transaction.set(
        statsRef,
        {
          videoId: normalizedVideoId,
          likesCount: nextCount,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
      return {
        videoId: normalizedVideoId,
        likesCount: nextCount,
        likedByCurrentUser: false,
        authenticated: true,
      };
    }

    return {
      videoId: normalizedVideoId,
      likesCount: currentCount,
      likedByCurrentUser: false,
      authenticated: true,
    };
  });
}
