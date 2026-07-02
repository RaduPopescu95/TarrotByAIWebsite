import { getOptionalAuth, requireAuth, omitFirebaseIdTokenFromPayload } from "../../../../lib/requireAuth";
import { loadPremiumVideoLibraryRowById } from "../../../../lib/loadPremiumVideoLibrary";
import { canViewerSeeVideo } from "../../../../lib/videoReleaseSchedule";
import {
  resolvePublicVideoLibraryPremiumActive,
  resolveVideoLibraryPremiumAccessForUser,
} from "../../../../lib/videoLibraryAccess";
import {
  createVideoComment,
  listPublicVideoComments,
} from "../../../../lib/videoComments";

function isWebClientRequest(req) {
  const raw = Array.isArray(req.query?.client) ? req.query.client[0] : req.query?.client;
  return typeof raw === "string" && raw.trim().toLowerCase() === "web";
}

async function resolvePremium(uid, req) {
  const webClient = isWebClientRequest(req);
  if (!uid) return resolvePublicVideoLibraryPremiumActive({ webClient });
  const result = await resolveVideoLibraryPremiumAccessForUser(uid, {
    stage: "video_comments",
    webClient,
  });
  return result.premiumActive === true;
}

export default async function handler(req, res) {
  if (!["GET", "POST"].includes(req.method)) {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  const videoId = typeof req.query.videoId === "string" ? req.query.videoId.trim() : "";
  if (!videoId) return res.status(404).json({ error: "Not found" });

  try {
    const decoded = req.method === "POST" ? await requireAuth(req) : await getOptionalAuth(req);
    const uid = decoded?.uid || null;
    const [video, premiumActive] = await Promise.all([
      loadPremiumVideoLibraryRowById(videoId),
      resolvePremium(uid, req),
    ]);
    if (!video || !canViewerSeeVideo(video, premiumActive, Date.now())) {
      return res.status(404).json({ error: "Not found" });
    }

    if (req.method === "GET") {
      res.setHeader(
        "Cache-Control",
        uid ? "private, no-store, max-age=0" : "public, max-age=5, s-maxage=15"
      );
      const result = await listPublicVideoComments({
        videoId,
        viewerUid: uid,
        cursor: req.query.cursor,
        limit: req.query.limit,
      });
      return res.status(200).json(result);
    }

    res.setHeader("Cache-Control", "private, no-store, max-age=0");
    const body = omitFirebaseIdTokenFromPayload(req.body || {});
    const result = await createVideoComment({
      videoId,
      videoTitle: video.title || "",
      uid,
      decoded,
      text: body.text,
      clientAuthorFirstName: body.authorFirstName,
      viewerPremiumActive: premiumActive,
    });
    return res.status(201).json(result);
  } catch (error) {
    const status = error?.statusCode || 500;
    if ([400, 401, 403, 404, 429].includes(status)) {
      return res.status(status).json({ error: error.message });
    }
    const code = error?.code || error?.details || "";
    console.error("[video-comments]", { videoId, method: req.method, code, message: error?.message }, error);
    return res.status(500).json({ error: "Failed to process comments" });
  }
}
