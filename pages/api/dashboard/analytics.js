import { getAdminDb } from "../../../lib/firebaseAdmin";
import {
  loadFirestoreCollectionAnalytics,
  parseAnalyticsParams,
} from "../../../lib/firestoreAnalytics";
import { requireDashboardAccess } from "../../../lib/requireAuth";

function buildRequestId() {
  return `fa_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
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
    const db = getAdminDb();
    const params = parseAnalyticsParams(req.query || {});
    const analytics = await loadFirestoreCollectionAnalytics(db, params);

    console.info("[dashboard/analytics]", {
      requestId,
      sampleLimit: analytics.meta.sampleLimit,
      sortBy: analytics.meta.sortBy,
      search: analytics.meta.search || null,
      collectionCount: analytics.summary.collectionCount,
      totalDocumentCount: analytics.summary.totalDocumentCount,
      totalEstimatedBytes: analytics.summary.totalEstimatedBytes,
      durationMs: analytics.meta.durationMs,
    });

    return res.status(200).json({
      collections: analytics.collections,
      summary: analytics.summary,
      meta: {
        ...analytics.meta,
        requestId,
      },
    });
  } catch (error) {
    console.error("[dashboard/analytics] GET error", {
      requestId,
      message: error?.message || "unknown_error",
    });
    return res.status(500).json({ error: "Failed to load analytics", requestId });
  }
}
