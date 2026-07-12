import { getAdminDb } from "../../../lib/firebaseAdmin";
import {
  getRevenueCatEvent,
  isAuthorizedRevenueCatWebhook,
  processRevenueCatEvent,
} from "../../../lib/revenueCatBilling";
import {
  BILLING_ERROR_CODES,
  categorizeBillingError,
  getBillingRequestId,
  logBillingObs,
  setBillingRequestId,
} from "../../../lib/billingObservability";

export default async function handler(req, res) {
  const requestId = setBillingRequestId(res, getBillingRequestId(req, "rcwh"));
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    logBillingObs({
      level: "warn",
      scope: "revenuecat_webhook",
      stage: "rejected",
      requestId,
      result: { httpStatus: 405 },
      error: { code: BILLING_ERROR_CODES.METHOD_NOT_ALLOWED },
    });
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (
    !isAuthorizedRevenueCatWebhook(
      req.headers?.authorization,
      process.env.REVENUECAT_WEBHOOK_AUTH_TOKEN
    )
  ) {
    logBillingObs({
      level: "warn",
      scope: "revenuecat_webhook",
      stage: "auth_failed",
      requestId,
      result: { httpStatus: 401 },
      config: { hasAuthorizationHeader: Boolean(req.headers?.authorization) },
      error: { code: BILLING_ERROR_CODES.AUTH_MISSING },
    });
    return res.status(401).json({ error: "Unauthorized" });
  }

  const event = getRevenueCatEvent(req.body);
  if (!event) {
    logBillingObs({
      level: "warn",
      scope: "revenuecat_webhook",
      stage: "invalid_payload",
      requestId,
      result: { httpStatus: 400 },
      error: { code: BILLING_ERROR_CODES.INVALID_PAYLOAD },
    });
    return res.status(400).json({ error: "Invalid webhook payload" });
  }

  try {
    const result = await processRevenueCatEvent(getAdminDb(), event);
    logBillingObs({
      scope: "revenuecat_webhook",
      stage: "processed",
      requestId,
      correlation: {
        revenueCatEventId: event.id,
        transactionId: event.transaction_id || event.original_transaction_id,
      },
      actor: { uid: event.app_user_id },
      routing: { productId: event.product_id, eventType: event.type },
      result: {
        httpStatus: 200,
        outcome: result?.reason || result?.kind || "processed",
        skipped: result?.skipped === true,
        entitlementGranted: result?.entitlementGranted === true,
      },
    });
    return res.status(200).json({
      received: true,
      duplicate: result?.reason === "already_processed",
      requestId,
    });
  } catch (error) {
    logBillingObs({
      level: "error",
      scope: "revenuecat_webhook",
      stage: "failed",
      requestId,
      correlation: { revenueCatEventId: event.id },
      routing: { eventType: event.type, productId: event.product_id },
      result: { httpStatus: 500 },
      error: {
        code: categorizeBillingError({ statusCode: 500, message: error?.message }),
        message: error?.message || "unknown_error",
      },
    });
    return res.status(500).json({ error: "Webhook processing failed", requestId });
  }
}
