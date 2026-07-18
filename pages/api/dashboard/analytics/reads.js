import { getAdminDb } from "../../../../lib/firebaseAdmin";
import {
  loadFirestoreReadAnalytics,
  parseReadAnalyticsParams,
} from "../../../../lib/firestoreReadAnalytics";
import { requireDashboardAccess } from "../../../../lib/requireAuth";

function buildRequestId() {
  return `fra_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export default async function handler(req, res) {
  try {
    requireDashboardAccess(req);
  } catch (error) {
    return res.status(error?.statusCode || 401).json({ error: "Unauthorized" });
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
