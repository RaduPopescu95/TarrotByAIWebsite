import { getAdminDb } from "../../../../../lib/firebaseAdmin";
import { requireAuth } from "../../../../../lib/requireAuth";
import { isRevenueCatFlowEnabled } from "../../../../../lib/billingConfig";
import { bindVerifiedAnalysisPurchase } from "../../../../../lib/revenueCatBilling";
import {
  BILLING_ERROR_CODES,
  categorizeBillingError,
  getBillingRequestId,
  getSafeBillingConfigSnapshot,
  logBillingObs,
  setBillingRequestId,
} from "../../../../../lib/billingObservability";

export default async function handler(req, res) {
  const requestId = setBillingRequestId(res, getBillingRequestId(req, "rca"));
  res.setHeader("Cache-Control", "private, no-store, max-age=0");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    logBillingObs({
      level: "warn",
      scope: "revenuecat_analysis_confirm",
      stage: "rejected",
      requestId,
      result: { httpStatus: 405 },
      error: { code: BILLING_ERROR_CODES.METHOD_NOT_ALLOWED },
    });
    return res.status(405).json({ error: "Method not allowed", requestId });
  }
  const requestedPlatform =
    req.body?.platform === "ios" || req.body?.platform === "android"
      ? req.body.platform
      : null;
  if (!isRevenueCatFlowEnabled("analyses", requestedPlatform || undefined)) {
    logBillingObs({
      level: "warn",
      scope: "revenuecat_analysis_confirm",
      stage: "flow_disabled",
      requestId,
      result: { httpStatus: 503 },
      config: getSafeBillingConfigSnapshot(),
      error: { code: BILLING_ERROR_CODES.FLOW_DISABLED },
    });
    return res.status(503).json({ error: "Native store analyses are disabled", requestId });
  }

  let decoded;
  try {
    decoded = await requireAuth(req);
  } catch (error) {
    logBillingObs({
      level: "warn",
      scope: "revenuecat_analysis_confirm",
      stage: "auth_failed",
      requestId,
      result: { httpStatus: error?.statusCode || 401 },
      error: { code: BILLING_ERROR_CODES.AUTH_MISSING },
    });
    return res.status(error?.statusCode || 401).json({ error: "Unauthorized", requestId });
  }

  const startedAt = Date.now();
  try {
    const result = await bindVerifiedAnalysisPurchase({
      db: getAdminDb(),
      uid: decoded.uid,
      analysisId: req.body?.analysisId,
      productCode: req.body?.productCode,
      productId: req.body?.productId,
      transactionId: req.body?.transactionId,
      platform: requestedPlatform,
    });
    logBillingObs({
      scope: "revenuecat_analysis_confirm",
      stage: "processed",
      requestId,
      actor: { uid: decoded.uid },
      routing: {
        platform: requestedPlatform,
        productCode: req.body?.productCode || null,
        productId: req.body?.productId || null,
      },
      correlation: { transactionId: result.transactionId },
      result: {
        httpStatus: 200,
        analysisId: result.analysisId,
        confirmed: result.confirmed === true,
        durationMs: Date.now() - startedAt,
      },
    });
    return res.status(200).json({ ...result, requestId });
  } catch (error) {
    const status = error?.statusCode || 500;
    logBillingObs({
      level: status >= 500 ? "error" : "warn",
      scope: "revenuecat_analysis_confirm",
      stage: "failed",
      requestId,
      actor: { uid: decoded.uid },
      routing: {
        platform: requestedPlatform,
        productCode: req.body?.productCode || null,
        productId: req.body?.productId || null,
      },
      correlation: { transactionId: req.body?.transactionId || null },
      result: { httpStatus: status, durationMs: Date.now() - startedAt },
      error: {
        code: categorizeBillingError({ statusCode: status, message: error?.message }),
        message: error?.message || "unknown_error",
      },
    });
    return res.status(status).json({
      error: status >= 500 ? "Purchase confirmation failed" : error.message,
      message: status >= 500 ? "Purchase confirmation failed" : error.message,
      requestId,
    });
  }
}
