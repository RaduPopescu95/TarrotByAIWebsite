import { getAdminDb } from "../../../../../lib/firebaseAdmin";
import { requireAuth } from "../../../../../lib/requireAuth";
import { isRevenueCatFlowEnabled } from "../../../../../lib/billingConfig";
import { bindVerifiedAnalysisPurchase } from "../../../../../lib/revenueCatBilling";

function buildRequestId() {
  return `rca_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export default async function handler(req, res) {
  const requestId = buildRequestId();
  res.setHeader("X-Request-Id", requestId);
  res.setHeader("Cache-Control", "private, no-store, max-age=0");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed", requestId });
  }
  if (!isRevenueCatFlowEnabled("analyses")) {
    return res.status(503).json({ error: "Google Play analyses are disabled", requestId });
  }

  let decoded;
  try {
    decoded = await requireAuth(req);
  } catch (error) {
    return res.status(error?.statusCode || 401).json({ error: "Unauthorized", requestId });
  }

  try {
    const result = await bindVerifiedAnalysisPurchase({
      db: getAdminDb(),
      uid: decoded.uid,
      analysisId: req.body?.analysisId,
      productCode: req.body?.productCode,
      productId: req.body?.productId,
      transactionId: req.body?.transactionId,
    });
    console.info("[revenuecat.analysis.confirm] confirmed", {
      requestId,
      uid: decoded.uid,
      productCode: req.body?.productCode || null,
      analysisId: result.analysisId,
    });
    return res.status(200).json({ ...result, requestId });
  } catch (error) {
    const status = error?.statusCode || 500;
    console[status >= 500 ? "error" : "warn"](
      "[revenuecat.analysis.confirm] failed",
      {
        requestId,
        uid: decoded.uid,
        status,
        message: error?.message || "unknown_error",
      }
    );
    return res.status(status).json({
      error: status >= 500 ? "Purchase confirmation failed" : error.message,
      message: status >= 500 ? "Purchase confirmation failed" : error.message,
      requestId,
    });
  }
}
