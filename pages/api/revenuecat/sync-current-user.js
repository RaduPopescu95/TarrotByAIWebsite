import { getAdminDb } from "../../../lib/firebaseAdmin";
import { requireAuth } from "../../../lib/requireAuth";
import { reconcileRevenueCatPremium } from "../../../lib/revenueCatBilling";
import { isRevenueCatFlowEnabled } from "../../../lib/billingConfig";
import {
  BILLING_ERROR_CODES,
  categorizeBillingError,
  getBillingRequestId,
  getSafeBillingConfigSnapshot,
  logBillingObs,
  setBillingRequestId,
} from "../../../lib/billingObservability";

export default async function handler(req, res) {
  const requestId = setBillingRequestId(res, getBillingRequestId(req, "rcsync"));
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    logBillingObs({
      level: "warn",
      scope: "revenuecat_sync",
      stage: "rejected",
      requestId,
      result: { httpStatus: 405 },
      error: { code: BILLING_ERROR_CODES.METHOD_NOT_ALLOWED },
    });
    return res.status(405).json({ error: "Method not allowed" });
  }

  let decoded;
  try {
    decoded = await requireAuth(req);
  } catch (error) {
    logBillingObs({
      level: "warn",
      scope: "revenuecat_sync",
      stage: "auth_failed",
      requestId,
      result: { httpStatus: error?.statusCode || 401 },
      error: { code: BILLING_ERROR_CODES.AUTH_MISSING },
    });
    return res.status(error?.statusCode || 401).json({ error: "Unauthorized" });
  }

  const apiKey = process.env.REVENUECAT_SECRET_API_KEY;
  if (!apiKey || !isRevenueCatFlowEnabled("premium")) {
    logBillingObs({
      level: "warn",
      scope: "revenuecat_sync",
      stage: "flow_disabled",
      requestId,
      actor: { uid: decoded.uid },
      result: { httpStatus: 503 },
      config: getSafeBillingConfigSnapshot(),
      error: { code: BILLING_ERROR_CODES.FLOW_DISABLED },
    });
    return res.status(503).json({ error: "RevenueCat sync is not configured" });
  }

  const startedAt = Date.now();
  try {
    const result = await reconcileRevenueCatPremium(getAdminDb(), decoded.uid, {
      maxAttempts: 4,
    });
    res.setHeader("Cache-Control", "private, no-store, max-age=0");
    logBillingObs({
      scope: "revenuecat_sync",
      stage: "processed",
      requestId,
      actor: { uid: decoded.uid },
      result: {
        httpStatus: 200,
        premiumActive: result.active,
        productId: result.productId,
        status: result.status,
        pending: result.pending === true,
        attempts: result.attempts,
        durationMs: Date.now() - startedAt,
      },
    });
    return res.status(200).json({
      synced: true,
      premiumActive: result.active,
      pending: result.pending === true,
      attempts: result.attempts,
      status: result.status,
      requestId,
    });
  } catch (error) {
    logBillingObs({
      level: "error",
      scope: "revenuecat_sync",
      stage: "failed",
      requestId,
      actor: { uid: decoded.uid },
      result: { httpStatus: 502, durationMs: Date.now() - startedAt },
      error: {
        code: categorizeBillingError({ statusCode: 502, message: error?.message }),
        message: error?.message || "unknown_error",
      },
    });
    return res.status(502).json({ error: "RevenueCat sync failed", requestId });
  }
}
