import { requireDashboardAccess } from "../../../../lib/requireAuth";
import { loadVideoViewsDetail } from "../../../../lib/videoViews";

export default async function handler(req, res) {
  try {
    requireDashboardAccess(req);
  } catch (error) {
    return res.status(error?.statusCode || 401).json({ error: error.message });
  }

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const videoId =
      typeof req.query.videoId === "string" ? req.query.videoId.trim() : "";
    const range = typeof req.query.range === "string" ? req.query.range.trim() : "7d";
    const payload = await loadVideoViewsDetail({ videoId, range });
    return res.status(200).json(payload);
  } catch (error) {
    if (error?.statusCode === 404) {
      return res.status(404).json({ error: "Video not found" });
    }
    console.error("[dashboard/video-views/[videoId]] GET error", error?.message || error);
    return res.status(500).json({ error: "Failed to load video views detail" });
  }
}
