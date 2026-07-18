import { isIosPremiumSubscriptionsEnabled } from "../../../lib/globalSettings";
import { getBillingConfig } from "../../../lib/billingConfig";
import {
  BILLING_ERROR_CODES,
  getBillingRequestId,
  getSafeBillingConfigSnapshot,
  logBillingObs,
  setBillingRequestId,
} from "../../../lib/billingObservability";

export default async function handler(req, res) {
  const requestId = setBillingRequestId(res, getBillingRequestId(req, "pcfg"));
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    logBillingObs({
      level: "warn",
      scope: "premium_public_config",
      stage: "rejected",
      requestId,
      result: { httpStatus: 405 },
      error: { code: BILLING_ERROR_CODES.METHOD_NOT_ALLOWED },
    });
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const iosPremiumSubscriptionsEnabled = await isIosPremiumSubscriptionsEnabled();
    const billing = getBillingConfig();
    res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=120");
    logBillingObs({
      scope: "premium_public_config",
      stage: "config_resolved",
      requestId,
      result: { httpStatus: 200 },
      config: getSafeBillingConfigSnapshot({
        subscriptionSystemEnabled: iosPremiumSubscriptionsEnabled,
      }),
    });
    return res.status(200).json({
      iosPremiumSubscriptionsEnabled,
      subscriptionSystemEnabled: iosPremiumSubscriptionsEnabled,
      billing,
    });
  } catch (e) {
    logBillingObs({
      level: "error",
      scope: "premium_public_config",
      stage: "failed",
      requestId,
      result: { httpStatus: 500 },
      error: { code: BILLING_ERROR_CODES.CONFIG_LOAD_FAILED, message: e?.message || "unknown_error" },
    });
    return res.status(500).json({ error: "Failed to load config" });
  }
}
