import { rebuildPublicTarotMaterializedCache } from "../../../../lib/loadPublicTarotData";
import { requireDashboardAccess } from "../../../../lib/requireAuth";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    requireDashboardAccess(req);
    const datasetMap = await rebuildPublicTarotMaterializedCache();
    const rowCount = Array.from(datasetMap.values()).reduce(
      (sum, rows) => sum + (Array.isArray(rows) ? rows.length : 0),
      0
    );

    return res.status(200).json({
      ok: true,
      datasetCount: datasetMap.size,
      rowCount,
    });
  } catch (error) {
    const status = error?.statusCode || 500;
    console.error("[admin.public-tarot-cache.rebuild] failed", error?.message || error);
    return res.status(status).json({
      error: status === 500 ? "Failed to rebuild public tarot cache" : error.message,
    });
  }
}
