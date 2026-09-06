import Stripe from "stripe";
import { getPublicBillingConfig } from "../../../lib/billingConfig";
import { getGlobalSettings, getVatPercentage } from "../../../lib/globalSettings";
import { getPremiumDisplayPricing } from "../../../lib/premiumDisplayPricing";
import {
  BILLING_ERROR_CODES,
  getBillingRequestId,
  getSafeBillingConfigSnapshot,
  logBillingObs,
  setBillingRequestId,
} from "../../../lib/billingObservability";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  const requestId = setBillingRequestId(res, getBillingRequestId(req, "bcfg"));
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    logBillingObs({
      level: "warn",
      scope: "billing_config",
      stage: "rejected",
      requestId,
      result: { httpStatus: 405 },
      error: { code: BILLING_ERROR_CODES.METHOD_NOT_ALLOWED },
    });
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const settings = await getGlobalSettings();
    const config = getPublicBillingConfig(settings);
    const safeConfig = getSafeBillingConfigSnapshot(settings);
    const vatPercentage = await getVatPercentage();
    const premiumPricing = await getPremiumDisplayPricing(stripe, vatPercentage);
    res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=120");
    logBillingObs({
      scope: "billing_config",
      stage: "config_resolved",
      requestId,
      result: { httpStatus: 200 },
      config: safeConfig,
      routing: config.providers,
    });
    return res.status(200).json({
      ...config,
      iosPremiumSubscriptionsEnabled: settings.iosPremiumSubscriptionsEnabled,
      iosCoursesHidden: settings.iosCoursesHidden !== false,
      subscriptionSystemEnabled: settings.iosPremiumSubscriptionsEnabled,
      vatPercentage,
      pricesIncludeVat: true,
      premiumPricing,
    });
  } catch (error) {
    logBillingObs({
      level: "error",
      scope: "billing_config",
      stage: "failed",
      requestId,
      result: { httpStatus: 500 },
      error: { code: BILLING_ERROR_CODES.CONFIG_LOAD_FAILED, message: error?.message || "unknown_error" },
    });
    return res.status(500).json({ error: "Failed to load billing config" });
  }
}
