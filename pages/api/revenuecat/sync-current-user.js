import { getAdminDb } from "../../../lib/firebaseAdmin";
import { requireAuth } from "../../../lib/requireAuth";
import { syncRevenueCatPremiumFromSubscriber } from "../../../lib/revenueCatBilling";
import { isRevenueCatFlowEnabled } from "../../../lib/billingConfig";

const REVENUECAT_API_BASE = "https://api.revenuecat.com/v1";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  let decoded;
  try {
    decoded = await requireAuth(req);
  } catch (error) {
    return res.status(error?.statusCode || 401).json({ error: "Unauthorized" });
  }

  const apiKey = process.env.REVENUECAT_SECRET_API_KEY;
  if (!apiKey || !isRevenueCatFlowEnabled("premium")) {
    return res.status(503).json({ error: "RevenueCat sync is not configured" });
  }

  try {
    const response = await fetch(
      `${REVENUECAT_API_BASE}/subscribers/${encodeURIComponent(decoded.uid)}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Accept: "application/json",
        },
      }
    );
    if (!response.ok) {
      console.warn("[revenuecat.sync] subscriber_fetch_failed", {
        uid: decoded.uid,
        status: response.status,
      });
      return res.status(response.status === 404 ? 404 : 502).json({
        error: response.status === 404 ? "RevenueCat subscriber not found" : "RevenueCat sync failed",
      });
    }
    const payload = await response.json();
    const result = await syncRevenueCatPremiumFromSubscriber(
      getAdminDb(),
      decoded.uid,
      payload?.subscriber
    );
    res.setHeader("Cache-Control", "private, no-store, max-age=0");
    return res.status(200).json({ synced: true, premiumActive: result.active });
  } catch (error) {
    console.error("[revenuecat.sync] failed", {
      uid: decoded.uid,
      message: error?.message || "unknown_error",
    });
    return res.status(502).json({ error: "RevenueCat sync failed" });
  }
}
