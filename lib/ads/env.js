import { AD_PROVIDERS } from "./config";

function readBoolean(value, defaultValue = false) {
  if (typeof value === "undefined") return defaultValue;
  return String(value).toLowerCase() === "true";
}

function normalizeForceProvider(value) {
  const normalized = String(value || "").toLowerCase();
  if (normalized === AD_PROVIDERS.ADSENSE) {
    return normalized;
  }
  return "";
}

export function getAdsEnv() {
  const primaryProvider = AD_PROVIDERS.ADSENSE;
  const forceProvider = normalizeForceProvider(
    process.env.NEXT_PUBLIC_ADS_FORCE_PROVIDER
  );

  return {
    adsEnabled: readBoolean(process.env.NEXT_PUBLIC_ADS_ENABLED, false),
    consentRequired: readBoolean(
      process.env.NEXT_PUBLIC_ADS_CONSENT_REQUIRED,
      true
    ),
    primaryProvider,
    forceProvider,
    enableAdSense: readBoolean(process.env.NEXT_PUBLIC_ENABLE_ADSENSE, false),
    adSenseClientId: process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_CLIENT_ID || "",
    adSenseSlotAfterHero:
      process.env.NEXT_PUBLIC_ADSENSE_SLOT_AFTER_HERO || "",
    adSenseSlotInFeed: process.env.NEXT_PUBLIC_ADSENSE_SLOT_IN_FEED || "",
    cmpEnabled: readBoolean(process.env.NEXT_PUBLIC_CMP_ENABLED, false),
    cmpScriptSrc: process.env.NEXT_PUBLIC_CMP_SCRIPT_SRC || "",
    cmpSiteId: process.env.NEXT_PUBLIC_CMP_SITE_ID || "",
    cmpProvider: String(process.env.NEXT_PUBLIC_CMP_PROVIDER || "generic").toLowerCase(),
    cmpCookiebotCbid: process.env.NEXT_PUBLIC_CMP_COOKIEBOT_CBID || "",
    cmpCookiebotBlockingMode:
      process.env.NEXT_PUBLIC_CMP_COOKIEBOT_BLOCKING_MODE || "auto",
  };
}
