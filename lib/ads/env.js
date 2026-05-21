import { AD_PROVIDERS, BLOCKED_SECONDARY_FORMATS } from "./config";

function readBoolean(value, defaultValue = false) {
  if (typeof value === "undefined") return defaultValue;
  return String(value).toLowerCase() === "true";
}

function normalizeProvider(value) {
  const normalized = String(value || "").toLowerCase();
  if (
    normalized === AD_PROVIDERS.ADSENSE ||
    normalized === AD_PROVIDERS.MONETAG ||
    normalized === AD_PROVIDERS.ADSTERRA
  ) {
    return normalized;
  }
  return AD_PROVIDERS.ADSENSE;
}

function readMonetagFormat(value) {
  const normalized = String(value || "inpage_push").toLowerCase();
  if (BLOCKED_SECONDARY_FORMATS.includes(normalized)) return "";
  return normalized;
}

export function getAdsEnv() {
  const primaryProvider = normalizeProvider(
    process.env.NEXT_PUBLIC_PRIMARY_AD_PROVIDER
  );
  const monetagScriptSrc =
    process.env.NEXT_PUBLIC_MONETAG_SCRIPT_SRC ||
    (process.env.NEXT_PUBLIC_MONETAG_ZONE_ID
      ? `https://pushno.com/ntfc.php?p=${process.env.NEXT_PUBLIC_MONETAG_ZONE_ID}`
      : "");

  return {
    adsEnabled: readBoolean(process.env.NEXT_PUBLIC_ADS_ENABLED, false),
    consentRequired: readBoolean(
      process.env.NEXT_PUBLIC_ADS_CONSENT_REQUIRED,
      true
    ),
    primaryProvider,
    enableAdSense: readBoolean(process.env.NEXT_PUBLIC_ENABLE_ADSENSE, false),
    adSenseClientId: process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_CLIENT_ID || "",
    adSenseSlotAfterHero:
      process.env.NEXT_PUBLIC_ADSENSE_SLOT_AFTER_HERO || "",
    adSenseSlotInFeed: process.env.NEXT_PUBLIC_ADSENSE_SLOT_IN_FEED || "",
    enableMonetag: readBoolean(process.env.NEXT_PUBLIC_ENABLE_MONETAG, false),
    monetagZoneId: process.env.NEXT_PUBLIC_MONETAG_ZONE_ID || "",
    monetagFormat: readMonetagFormat(process.env.NEXT_PUBLIC_MONETAG_FORMAT),
    monetagScriptSrc,
    enableAdsterra: readBoolean(
      process.env.NEXT_PUBLIC_ENABLE_ADSTERRA,
      false
    ),
    adsterraScriptSrc: process.env.NEXT_PUBLIC_ADSTERRA_SCRIPT_SRC || "",
  };
}
