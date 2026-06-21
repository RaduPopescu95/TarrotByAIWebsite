import { requireDashboardAccess } from "../../../lib/requireAuth";
import { getAdminDb } from "../../../lib/firebaseAdmin";
import {
  mapAdminVideoComment,
  moderateVideoComment,
  VIDEO_COMMENTS_COLLECTION,
} from "../../../lib/videoComments";

export default async function handler(req, res) {
  try {
    requireDashboardAccess(req);
  } catch (error) {
    return res.status(error?.statusCode || 401).json({ error: error.message });
  }

  try {
    if (req.method === "GET") {
      const db = getAdminDb();
      const status = typeof req.query.status === "string" ? req.query.status.trim() : "";
      const videoId = typeof req.query.videoId === "string" ? req.query.videoId.trim() : "";
      const search = typeof req.query.search === "string" ? req.query.search.trim().toLowerCase() : "";
      const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 100);
      let query = db.collection(VIDEO_COMMENTS_COLLECTION);
      if (status === "visible" || status === "hidden") query = query.where("status", "==", status);
      if (videoId) query = query.where("videoId", "==", videoId);
      query = query.orderBy("createdAt", "desc");

      const cursor = typeof req.query.cursor === "string" ? req.query.cursor.trim() : "";
      if (cursor && !search) {
        const cursorSnap = await db.collection(VIDEO_COMMENTS_COLLECTION).doc(cursor).get();
        if (cursorSnap.exists) query = query.startAfter(cursorSnap);
      }
      const snapshot = await query.limit(search ? 200 : limit + 1).get();
      let rows = snapshot.docs.map(mapAdminVideoComment);
      if (search) {
        rows = rows.filter((row) =>
          [row.text, row.authorFirstName, row.authorEmail, row.videoTitle, row.videoId]
            .join(" ")
            .toLowerCase()
            .includes(search)
        );
      }
      const hasMore = !search && rows.length > limit;
      rows = rows.slice(0, limit);
      return res.status(200).json({
        comments: rows,
        hasMore,
        nextCursor: hasMore ? rows[rows.length - 1]?.id || null : null,
      });
    }

    if (req.method === "PATCH" || req.method === "DELETE") {
      const commentId = typeof req.body?.commentId === "string" ? req.body.commentId.trim() : "";
      const action = req.method === "DELETE" ? "delete" : req.body?.action;
      if (!commentId || !["hide", "restore", "delete"].includes(action)) {
        return res.status(400).json({ error: "Invalid moderation request" });
      }
      const result = await moderateVideoComment({ commentId, action });
      return res.status(200).json(result);
    }

    res.setHeader("Allow", "GET, PATCH, DELETE");
    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    const status = error?.statusCode || 500;
    if (status === 404) return res.status(404).json({ error: "Not found" });
    console.error("[dashboard.video-comments]", error);
    return res.status(500).json({ error: "Failed to manage comments" });
  }
}
