import { requireAuth } from "../../../../lib/requireAuth";
import { deleteOwnVideoComment } from "../../../../lib/videoComments";
import { loadPremiumVideoLibraryRowById } from "../../../../lib/loadPremiumVideoLibrary";
import { canViewerSeeVideo } from "../../../../lib/videoReleaseSchedule";
import { resolveVideoLibraryPremiumAccessForUser } from "../../../../lib/videoLibraryAccess";

function isWebClientRequest(req) {
  const raw = Array.isArray(req.query?.client) ? req.query.client[0] : req.query?.client;
  return typeof raw === "string" && raw.trim().toLowerCase() === "web";
}

export default async function handler(req, res) {
  if (req.method !== "DELETE") {
    res.setHeader("Allow", "DELETE");
    return res.status(405).json({ error: "Method not allowed" });
  }
  try {
    const decoded = await requireAuth(req);
    const videoId = typeof req.query.videoId === "string" ? req.query.videoId.trim() : "";
    const [video, access] = await Promise.all([
      loadPremiumVideoLibraryRowById(videoId),
      resolveVideoLibraryPremiumAccessForUser(decoded.uid, {
        stage: "video_comment_delete",
        videoId,
        webClient: isWebClientRequest(req),
      }),
    ]);
    if (!video || !canViewerSeeVideo(video, access.premiumActive === true, Date.now())) {
      return res.status(404).json({ error: "Not found" });
    }
    res.setHeader("Cache-Control", "private, no-store, max-age=0");
    const result = await deleteOwnVideoComment({
      videoId,
      commentId:
        typeof req.query.commentId === "string" ? req.query.commentId.trim() : "",
      uid: decoded.uid,
    });
    return res.status(200).json(result);
  } catch (error) {
    const status = error?.statusCode || 500;
    if ([401, 403, 404].includes(status)) {
      return res.status(status).json({ error: error.message });
    }
    console.error("[video-comments.delete]", error);
    return res.status(500).json({ error: "Failed to delete comment" });
  }
}
