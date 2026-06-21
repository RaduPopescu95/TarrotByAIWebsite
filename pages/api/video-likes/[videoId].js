import { getOptionalAuth, requireAuth } from "../../../lib/requireAuth";
import { loadPremiumVideoLibraryRowById } from "../../../lib/loadPremiumVideoLibrary";
import { canViewerSeeVideo } from "../../../lib/videoReleaseSchedule";
import {
  resolvePublicVideoLibraryPremiumActive,
  resolveVideoLibraryPremiumAccessForUser,
} from "../../../lib/videoLibraryAccess";
import { getVideoLikeSummary, setVideoLikeState } from "../../../lib/videoLikes";

const INTERNAL_VIDEO_DOC_IDS = new Set(["_meta", "_publicCache"]);

function buildRequestId() {
  return `vlk_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

async function resolveViewer(req, method) {
  if (method === "GET") {
    return getOptionalAuth(req);
  }
  return requireAuth(req);
}

async function resolvePremiumActive(uid) {
  if (!uid) {
    return resolvePublicVideoLibraryPremiumActive();
  }
  const resolved = await resolveVideoLibraryPremiumAccessForUser(uid, {
    stage: "video_like",
  });
  return resolved.premiumActive === true;
}

export default async function handler(req, res) {
  const requestId = buildRequestId();
  res.setHeader("X-Request-Id", requestId);

  if (!["GET", "PUT", "DELETE"].includes(req.method)) {
    res.setHeader("Allow", "GET, PUT, DELETE");
    return res.status(405).json({ error: "Method not allowed", requestId });
  }

  const videoId =
    typeof req.query.videoId === "string" ? req.query.videoId.trim() : "";
  if (!videoId || INTERNAL_VIDEO_DOC_IDS.has(videoId)) {
    return res.status(404).json({ error: "Not found", requestId });
  }

  try {
    const decoded = await resolveViewer(req, req.method);
    const uid = decoded?.uid || null;
    const hasAuthHeader =
      typeof req.headers?.authorization === "string" &&
      req.headers.authorization.trim() !== "";

    if (uid || hasAuthHeader || req.method !== "GET") {
      res.setHeader("Cache-Control", "private, no-store, max-age=0");
    } else {
      res.setHeader("Cache-Control", "public, max-age=15, s-maxage=30");
    }

    const [video, premiumActive] = await Promise.all([
      loadPremiumVideoLibraryRowById(videoId),
      resolvePremiumActive(uid),
    ]);
    if (!video || !canViewerSeeVideo(video, premiumActive, Date.now())) {
      return res.status(404).json({ error: "Not found", requestId });
    }

    const result =
      req.method === "GET"
        ? await getVideoLikeSummary(videoId, uid)
        : await setVideoLikeState({
            videoId,
            uid,
            liked: req.method === "PUT",
          });

    return res.status(200).json({ ...result, requestId });
  } catch (error) {
    const statusCode = error?.statusCode || 500;
    if (statusCode === 401) {
      return res.status(401).json({ error: error.message, requestId });
    }
    if (statusCode === 404) {
      return res.status(404).json({ error: "Not found", requestId });
    }
    console.error("[video-likes] failed", {
      requestId,
      videoId,
      method: req.method,
      message: error?.message || String(error),
    });
    return res.status(500).json({ error: "Failed to update video like", requestId });
  }
}
