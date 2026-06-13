import { getAdminDb } from "../../../../lib/firebaseAdmin";
import {
  loadFirestoreReadAnalytics,
  parseReadAnalyticsParams,
} from "../../../../lib/firestoreReadAnalytics";

const DASHBOARD_SECRET = process.env.DASHBOARD_SECRET || "Cristina1994!";

function buildRequestId() {
  return `fra_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export default async function handler(req, res) {
  const token = req.headers["x-dashboard-token"] || "";
  if (token !== DASHBOARD_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const requestId = buildRequestId();
  try {
    const params = parseReadAnalyticsParams(req.query || {});
    const analytics = await loadFirestoreReadAnalytics(getAdminDb(), params);
    return res.status(200).json({
      ...analytics,
      meta: { ...analytics.meta, requestId },
    });
  } catch (error) {
    console.error("[dashboard/analytics/reads] GET error", {
      requestId,
      message: error?.message || "unknown_error",
    });
    return res.status(500).json({ error: "Failed to load read analytics", requestId });
  }
}
