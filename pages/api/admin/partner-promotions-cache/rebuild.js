import {
  clearPartnerPromotionsMemoryCache,
  rebuildPartnerPromotionsMaterializedCache,
} from "../../../../lib/partnerPromotions/loadPartnerPromotionsPublic";
import { requireDashboardAccess } from "../../../../lib/requireAuth";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    requireDashboardAccess(req);
    clearPartnerPromotionsMemoryCache();
    const rows = await rebuildPartnerPromotionsMaterializedCache();
    return res.status(200).json({
      ok: true,
      rowCount: rows.length,
      message: "Partner promotions public cache rebuilt",
    });
  } catch (error) {
    const status = error?.statusCode || 500;
    console.error("[admin.partner-promotions-cache.rebuild] failed", error?.message || error);
    return res.status(status).json({
      error: status === 500 ? "Failed to rebuild partner promotions cache" : error.message,
    });
  }
}
