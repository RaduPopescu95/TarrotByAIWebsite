import { getAdminDb } from "../../../lib/firebaseAdmin";
import { requireAuth } from "../../../lib/requireAuth";
import { syncRevenueCatPremiumFromSubscriber } from "../../../lib/revenueCatBilling";
import { isRevenueCatFlowEnabled } from "../../../lib/billingConfig";
import {
  BILLING_ERROR_CODES,
  categorizeBillingError,
  getBillingRequestId,
  getSafeBillingConfigSnapshot,
  logBillingObs,
  setBillingRequestId,
} from "../../../lib/billingObservability";

const REVENUECAT_API_BASE = "https://api.revenuecat.com/v1";

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
      const status = response.status === 404 ? 404 : 502;
      logBillingObs({
        level: "warn",
        scope: "revenuecat_sync",
        stage: "subscriber_fetch_failed",
        requestId,
        actor: { uid: decoded.uid },
        result: { httpStatus: status, upstreamStatus: response.status, durationMs: Date.now() - startedAt },
        error: {
          code:
            response.status === 404
              ? BILLING_ERROR_CODES.SUBSCRIBER_NOT_FOUND
              : BILLING_ERROR_CODES.UPSTREAM_REVENUECAT,
        },
      });
      return res.status(status).json({
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
    logBillingObs({
      scope: "revenuecat_sync",
      stage: "processed",
      requestId,
      actor: { uid: decoded.uid },
      result: {
        httpStatus: 200,
        premiumActive: result.active,
        productId: result.productId,
        durationMs: Date.now() - startedAt,
      },
    });
    return res.status(200).json({ synced: true, premiumActive: result.active, requestId });
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
