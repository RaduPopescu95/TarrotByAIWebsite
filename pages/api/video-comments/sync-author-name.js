import { requireAuth } from "../../../lib/requireAuth";
import { syncCommentAuthorNamesForUser } from "../../../lib/videoComments";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  try {
    const decoded = await requireAuth(req);
    res.setHeader("Cache-Control", "private, no-store, max-age=0");
    const result = await syncCommentAuthorNamesForUser({
      uid: decoded?.uid,
      decoded,
    });
    return res.status(200).json(result);
  } catch (error) {
    const status = error?.statusCode || 500;
    if ([400, 401, 403].includes(status)) {
      return res.status(status).json({ error: error.message });
    }
    console.error("[video-comments.sync-author-name]", error);
    return res.status(500).json({ error: "Failed to sync author names" });
  }
}
