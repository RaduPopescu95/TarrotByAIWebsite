import { FieldValue } from "firebase-admin/firestore";
import { getAdminAuth, getAdminDb } from "./firebaseAdmin";
import { canViewerSeeVideo } from "./videoReleaseSchedule";

export const VIDEO_COMMENTS_COLLECTION = "videoComments";
export const VIDEO_COMMENT_STATS_COLLECTION = "videoCommentStats";
export const VIDEO_COMMENT_RATE_LIMITS_COLLECTION = "videoCommentRateLimits";
export const VIDEO_COMMENT_STATUS_VISIBLE = "visible";
export const VIDEO_COMMENT_STATUS_HIDDEN = "hidden";
export const VIDEO_COMMENT_MAX_LENGTH = 500;
export const VIDEO_COMMENT_RATE_LIMIT = 5;
export const VIDEO_COMMENT_RATE_WINDOW_MS = 60_000;

function cleanString(value, maxLength = 500) {
  if (typeof value !== "string") return "";
  return value.replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function timestampToIso(value) {
  if (!value) return null;
  try {
    if (typeof value.toDate === "function") return value.toDate().toISOString();
    if (value instanceof Date) return value.toISOString();
    if (typeof value === "string") return new Date(value).toISOString();
  } catch (_) {}
  return null;
}

function normalizeCount(value) {
  const count = Number(value);
  return Number.isFinite(count) && count > 0 ? Math.floor(count) : 0;
}

export function validateVideoCommentText(value) {
  const text = cleanString(value, VIDEO_COMMENT_MAX_LENGTH + 1);
  if (text.length < 2) {
    return { ok: false, status: 400, error: "Comment must contain at least 2 characters" };
  }
  if (text.length > VIDEO_COMMENT_MAX_LENGTH) {
    return { ok: false, status: 400, error: `Comment cannot exceed ${VIDEO_COMMENT_MAX_LENGTH} characters` };
  }
  return { ok: true, text };
}

async function loadCommentAuthor(uid, decoded, db) {
  let profile = null;
  const directSnap = await db.collection("Users").doc(uid).get();
  if (directSnap.exists) {
    profile = directSnap.data() || {};
  } else {
    const ownerSnap = await db
      .collection("Users")
      .where("owner_uid", "==", uid)
      .limit(1)
      .get();
    profile = ownerSnap.docs[0]?.data() || null;
  }

  let authRecord = null;
  if (!profile?.first_name || !profile?.email) {
    try {
      authRecord = await getAdminAuth().getUser(uid);
    } catch (_) {}
  }
  const authFirstName = cleanString(authRecord?.displayName, 80).split(" ")[0] || "";
  const tokenFirstName = cleanString(decoded?.name, 80).split(" ")[0] || "";
  return {
    firstName:
      cleanString(profile?.first_name, 80) ||
      authFirstName ||
      tokenFirstName ||
      "Utilizator",
    email:
      cleanString(profile?.email, 254) ||
      cleanString(authRecord?.email, 254) ||
      cleanString(decoded?.email, 254) ||
      "",
  };
}

export function mapPublicVideoComment(docSnap, viewerUid = null) {
  const data = docSnap.data ? docSnap.data() || {} : docSnap || {};
  const id = docSnap.id || data.id || "";
  return {
    id,
    videoId: cleanString(data.videoId, 160),
    authorFirstName: cleanString(data.authorFirstName, 80) || "Utilizator",
    text: cleanString(data.text, VIDEO_COMMENT_MAX_LENGTH),
    createdAt: timestampToIso(data.createdAt),
    canDelete: Boolean(viewerUid && data.uid === viewerUid),
  };
}

export async function getVideoCommentCount(videoId, db = getAdminDb()) {
  const statsSnap = await db
    .collection(VIDEO_COMMENT_STATS_COLLECTION)
    .doc(cleanString(videoId, 160))
    .get();
  return normalizeCount(statsSnap.exists ? statsSnap.data()?.visibleCount : 0);
}

export async function listPublicVideoComments({
  videoId,
  viewerUid = null,
  cursor = "",
  limit = 20,
  db = getAdminDb(),
}) {
  const normalizedVideoId = cleanString(videoId, 160);
  const normalizedLimit = Math.min(Math.max(Number(limit) || 20, 1), 50);
  let query = db
    .collection(VIDEO_COMMENTS_COLLECTION)
    .where("videoId", "==", normalizedVideoId)
    .where("status", "==", VIDEO_COMMENT_STATUS_VISIBLE)
    .orderBy("createdAt", "desc")
    .limit(normalizedLimit + 1);

  const cursorId = cleanString(cursor, 200);
  if (cursorId) {
    const cursorSnap = await db.collection(VIDEO_COMMENTS_COLLECTION).doc(cursorId).get();
    if (
      cursorSnap.exists &&
      cursorSnap.data()?.videoId === normalizedVideoId &&
      cursorSnap.data()?.status === VIDEO_COMMENT_STATUS_VISIBLE
    ) {
      query = query.startAfter(cursorSnap);
    }
  }

  const [snapshot, visibleCount] = await Promise.all([
    query.get(),
    getVideoCommentCount(normalizedVideoId, db),
  ]);
  const hasMore = snapshot.docs.length > normalizedLimit;
  const pageDocs = snapshot.docs.slice(0, normalizedLimit);
  return {
    comments: pageDocs.map((docSnap) => mapPublicVideoComment(docSnap, viewerUid)),
    visibleCount,
    nextCursor: hasMore ? pageDocs[pageDocs.length - 1]?.id || null : null,
    hasMore,
  };
}

export async function createVideoComment({
  videoId,
  videoTitle,
  uid,
  decoded,
  text,
  viewerPremiumActive = false,
  db = getAdminDb(),
  nowMs = Date.now(),
}) {
  const validation = validateVideoCommentText(text);
  if (!validation.ok) {
    const error = new Error(validation.error);
    error.statusCode = validation.status;
    throw error;
  }
  const author = await loadCommentAuthor(uid, decoded, db);
  const commentRef = db.collection(VIDEO_COMMENTS_COLLECTION).doc();
  const statsRef = db.collection(VIDEO_COMMENT_STATS_COLLECTION).doc(videoId);
  const rateRef = db.collection(VIDEO_COMMENT_RATE_LIMITS_COLLECTION).doc(uid);
  const videoRef = db.collection("videosVideoModule").doc(videoId);

  const result = await db.runTransaction(async (transaction) => {
    const [videoSnap, statsSnap, rateSnap] = await Promise.all([
      transaction.get(videoRef),
      transaction.get(statsRef),
      transaction.get(rateRef),
    ]);
    const persistedVideo = videoSnap.exists ? videoSnap.data() || {} : null;
    if (
      !persistedVideo ||
      persistedVideo.isPublished !== true ||
      !canViewerSeeVideo(persistedVideo, viewerPremiumActive, nowMs)
    ) {
      const error = new Error("Not found");
      error.statusCode = 404;
      throw error;
    }

    const recent = Array.isArray(rateSnap.data()?.timestamps)
      ? rateSnap
          .data()
          .timestamps.map(Number)
          .filter((item) => Number.isFinite(item) && item > nowMs - VIDEO_COMMENT_RATE_WINDOW_MS)
      : [];
    if (recent.length >= VIDEO_COMMENT_RATE_LIMIT) {
      const error = new Error("Too many comments");
      error.statusCode = 429;
      throw error;
    }

    const currentCount = normalizeCount(statsSnap.data()?.visibleCount);
    const payload = {
      videoId,
      videoTitle: cleanString(videoTitle, 300),
      uid,
      authorFirstName: author.firstName,
      authorEmail: author.email,
      text: validation.text,
      status: VIDEO_COMMENT_STATUS_VISIBLE,
      createdAt: FieldValue.serverTimestamp(),
      hiddenAt: null,
      restoredAt: null,
      moderatedAt: null,
    };
    transaction.create(commentRef, payload);
    transaction.set(
      statsRef,
      {
        videoId,
        visibleCount: currentCount + 1,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    transaction.set(
      rateRef,
      {
        uid,
        timestamps: [...recent, nowMs],
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    return { payload, visibleCount: currentCount + 1 };
  });

  return {
    comment: {
      id: commentRef.id,
      videoId,
      authorFirstName: author.firstName,
      text: validation.text,
      createdAt: new Date(nowMs).toISOString(),
      canDelete: true,
    },
    visibleCount: result.visibleCount,
  };
}

export async function deleteOwnVideoComment({
  videoId,
  commentId,
  uid,
  db = getAdminDb(),
}) {
  const commentRef = db.collection(VIDEO_COMMENTS_COLLECTION).doc(commentId);
  const statsRef = db.collection(VIDEO_COMMENT_STATS_COLLECTION).doc(videoId);
  return db.runTransaction(async (transaction) => {
    const [commentSnap, statsSnap] = await Promise.all([
      transaction.get(commentRef),
      transaction.get(statsRef),
    ]);
    if (!commentSnap.exists) {
      return { deleted: false, visibleCount: normalizeCount(statsSnap.data()?.visibleCount) };
    }
    const comment = commentSnap.data() || {};
    if (comment.videoId !== videoId) {
      const error = new Error("Not found");
      error.statusCode = 404;
      throw error;
    }
    if (comment.uid !== uid) {
      const error = new Error("Forbidden");
      error.statusCode = 403;
      throw error;
    }
    const currentCount = normalizeCount(statsSnap.data()?.visibleCount);
    const nextCount =
      comment.status === VIDEO_COMMENT_STATUS_VISIBLE
        ? Math.max(0, currentCount - 1)
        : currentCount;
    transaction.delete(commentRef);
    if (nextCount !== currentCount) {
      transaction.set(
        statsRef,
        { videoId, visibleCount: nextCount, updatedAt: FieldValue.serverTimestamp() },
        { merge: true }
      );
    }
    return { deleted: true, visibleCount: nextCount };
  });
}

export async function moderateVideoComment({
  commentId,
  action,
  db = getAdminDb(),
}) {
  const commentRef = db.collection(VIDEO_COMMENTS_COLLECTION).doc(commentId);
  return db.runTransaction(async (transaction) => {
    const commentSnap = await transaction.get(commentRef);
    if (!commentSnap.exists) {
      if (action === "delete") {
        return { deleted: true, status: null, visibleCount: null };
      }
      const error = new Error("Not found");
      error.statusCode = 404;
      throw error;
    }
    const comment = commentSnap.data() || {};
    const statsRef = db.collection(VIDEO_COMMENT_STATS_COLLECTION).doc(comment.videoId);
    const statsSnap = await transaction.get(statsRef);
    const currentCount = normalizeCount(statsSnap.data()?.visibleCount);

    if (action === "delete") {
      const nextCount =
        comment.status === VIDEO_COMMENT_STATUS_VISIBLE
          ? Math.max(0, currentCount - 1)
          : currentCount;
      transaction.delete(commentRef);
      transaction.set(
        statsRef,
        { videoId: comment.videoId, visibleCount: nextCount, updatedAt: FieldValue.serverTimestamp() },
        { merge: true }
      );
      return { deleted: true, status: null, visibleCount: nextCount };
    }

    const targetStatus =
      action === "hide" ? VIDEO_COMMENT_STATUS_HIDDEN : VIDEO_COMMENT_STATUS_VISIBLE;
    if (comment.status === targetStatus) {
      return { deleted: false, status: targetStatus, visibleCount: currentCount };
    }
    const delta = targetStatus === VIDEO_COMMENT_STATUS_VISIBLE ? 1 : -1;
    const nextCount = Math.max(0, currentCount + delta);
    transaction.update(commentRef, {
      status: targetStatus,
      moderatedAt: FieldValue.serverTimestamp(),
      hiddenAt: action === "hide" ? FieldValue.serverTimestamp() : comment.hiddenAt || null,
      restoredAt: action === "restore" ? FieldValue.serverTimestamp() : comment.restoredAt || null,
    });
    transaction.set(
      statsRef,
      { videoId: comment.videoId, visibleCount: nextCount, updatedAt: FieldValue.serverTimestamp() },
      { merge: true }
    );
    return { deleted: false, status: targetStatus, visibleCount: nextCount };
  });
}

export function mapAdminVideoComment(docSnap) {
  const data = docSnap.data() || {};
  return {
    id: docSnap.id,
    videoId: data.videoId || "",
    videoTitle: data.videoTitle || "",
    uid: data.uid || "",
    authorFirstName: data.authorFirstName || "Utilizator",
    authorEmail: data.authorEmail || "",
    text: data.text || "",
    status: data.status || VIDEO_COMMENT_STATUS_VISIBLE,
    createdAt: timestampToIso(data.createdAt),
    hiddenAt: timestampToIso(data.hiddenAt),
    restoredAt: timestampToIso(data.restoredAt),
  };
}
