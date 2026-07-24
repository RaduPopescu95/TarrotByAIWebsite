import { requireDashboardAccess } from "../../../lib/requireAuth";
import { loadVideoViewsDashboard } from "../../../lib/videoViews";

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
    const range = typeof req.query.range === "string" ? req.query.range.trim() : "7d";
    const search = typeof req.query.search === "string" ? req.query.search : "";
    const platform = typeof req.query.platform === "string" ? req.query.platform : "";
    const payload = await loadVideoViewsDashboard({ range, search, platform });
    return res.status(200).json(payload);
  } catch (error) {
    console.error("[dashboard/video-views] GET error", error?.message || error);
    return res.status(500).json({ error: "Failed to load video views" });
  }
}
