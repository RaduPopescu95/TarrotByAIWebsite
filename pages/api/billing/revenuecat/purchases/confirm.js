import { getAdminDb } from "../../../../../lib/firebaseAdmin";
import { requireAuth } from "../../../../../lib/requireAuth";
import { isRevenueCatFlowEnabled } from "../../../../../lib/billingConfig";
import { verifyAndSyncRevenueCatOneTimePurchase } from "../../../../../lib/revenueCatBilling";
import {
  BILLING_ERROR_CODES,
  categorizeBillingError,
  getBillingRequestId,
  getSafeBillingConfigSnapshot,
  logBillingObs,
  setBillingRequestId,
} from "../../../../../lib/billingObservability";

export default async function handler(req, res) {
  const requestId = setBillingRequestId(res, getBillingRequestId(req, "rcp"));
  res.setHeader("Cache-Control", "private, no-store, max-age=0");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    logBillingObs({
      level: "warn",
      scope: "revenuecat_purchase_confirm",
      stage: "rejected",
      requestId,
      result: { httpStatus: 405 },
      error: { code: BILLING_ERROR_CODES.METHOD_NOT_ALLOWED },
    });
    return res.status(405).json({ error: "Method not allowed", requestId });
  }
  if (!isRevenueCatFlowEnabled("courses")) {
    logBillingObs({
      level: "warn",
      scope: "revenuecat_purchase_confirm",
      stage: "flow_disabled",
      requestId,
      result: { httpStatus: 503 },
      config: getSafeBillingConfigSnapshot(),
      error: { code: BILLING_ERROR_CODES.FLOW_DISABLED },
    });
    return res.status(503).json({ error: "Google Play courses are disabled", requestId });
  }

  let decoded;
  try {
    decoded = await requireAuth(req);
  } catch (error) {
    logBillingObs({
      level: "warn",
      scope: "revenuecat_purchase_confirm",
      stage: "auth_failed",
      requestId,
      result: { httpStatus: error?.statusCode || 401 },
      error: { code: BILLING_ERROR_CODES.AUTH_MISSING },
    });
    return res.status(error?.statusCode || 401).json({ error: "Unauthorized", requestId });
  }

  const expectedKind =
    req.body?.kind === "bundle" ? "bundle" : req.body?.kind === "course" ? "course" : null;
  if (!expectedKind) {
    logBillingObs({
      level: "warn",
      scope: "revenuecat_purchase_confirm",
      stage: "invalid_payload",
      requestId,
      actor: { uid: decoded.uid },
      result: { httpStatus: 400 },
      error: { code: BILLING_ERROR_CODES.INVALID_PAYLOAD },
    });
    return res.status(400).json({ error: "Invalid purchase kind", requestId });
  }

  const startedAt = Date.now();
  try {
    const verified = await verifyAndSyncRevenueCatOneTimePurchase({
      db: getAdminDb(),
      uid: decoded.uid,
      productId: req.body?.productId,
      transactionId: req.body?.transactionId,
      expectedKind,
      expectedItemId: req.body?.itemId,
    });
    logBillingObs({
      scope: "revenuecat_purchase_confirm",
      stage: "processed",
      requestId,
      actor: { uid: decoded.uid },
      routing: { kind: verified.mapping.kind, productId: verified.mapping.productId },
      correlation: { transactionId: verified.transactionId },
      result: {
        httpStatus: 200,
        itemId: verified.mapping.itemId,
        entitlementGranted: verified.result?.entitlementGranted === true,
        durationMs: Date.now() - startedAt,
      },
    });
    return res.status(200).json({
      confirmed: true,
      entitlementGranted: verified.result?.entitlementGranted === true,
      kind: verified.mapping.kind,
      itemId: verified.mapping.itemId,
      transactionId: verified.transactionId,
      requestId,
    });
  } catch (error) {
    const status = error?.statusCode || 500;
    logBillingObs({
      level: status >= 500 ? "error" : "warn",
      scope: "revenuecat_purchase_confirm",
      stage: "failed",
      requestId,
      actor: { uid: decoded.uid },
      routing: {
        kind: expectedKind,
        itemId: req.body?.itemId || null,
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
      requestId,
    });
  }
}
