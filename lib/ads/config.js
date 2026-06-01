export const ADSENSE_ROUTE_PATTERNS = Object.freeze([
  /^\/news(?:\/|$)/,
  /^\/videouri(?:\/|$)/,
]);

export const ADSTERRA_ROUTE_PATTERNS = Object.freeze([
  /^\/$/,
  /^\/about(?:\/|$)/,
  /^\/news(?:\/|$)/,
  /^\/videouri(?:\/|$)/,
  /^\/citire-personalizata(?:\/|$)/,
  /^\/citire-viitor(?:\/|$)/,
  /^\/numar-norocos(?:\/|$)/,
  /^\/culoare-norocoasa(?:\/|$)/,
  /^\/ora-norocoasa(?:\/|$)/,
  /^\/citat-motivational(?:\/|$)/,
  /^\/ce-gandeste(?:\/|$)/,
  /^\/ce-simte(?:\/|$)/,
  /^\/cartea-ta(?:\/|$)/,
]);

/** Maps placementId to NEXT_PUBLIC_ADSTERRA_KEY_* env suffix. */
export const ADSTERRA_PLACEMENT_ENV_KEYS = Object.freeze({
  default: "NEXT_PUBLIC_ADSTERRA_KEY_DEFAULT",
  home: "NEXT_PUBLIC_ADSTERRA_KEY_HOME",
  article: "NEXT_PUBLIC_ADSTERRA_KEY_ARTICLE",
  video: "NEXT_PUBLIC_ADSTERRA_KEY_VIDEO",
  reading: "NEXT_PUBLIC_ADSTERRA_KEY_READING",
});

function normalizePath(pathname) {
  if (!pathname || typeof pathname !== "string") return "/";
  const trimmed = pathname.split("?")[0].split("#")[0];
  return trimmed || "/";
}

export function isAdsenseRouteEligible(pathname) {
  const normalized = normalizePath(pathname);
  return ADSENSE_ROUTE_PATTERNS.some((pattern) => pattern.test(normalized));
}

export function isAdsterraRouteEligible(pathname) {
  const normalized = normalizePath(pathname);
  return ADSTERRA_ROUTE_PATTERNS.some((pattern) => pattern.test(normalized));
}

export function isAdsterraEnabled() {
  return process.env.NEXT_PUBLIC_ENABLE_ADSTERRA === "true";
}

export function getAdsterraScriptHost() {
  const raw = process.env.NEXT_PUBLIC_ADSTERRA_SCRIPT_HOST || "";
  return raw.trim().replace(/\/$/, "");
}

export function getAdsterraPlacementKey(placementId = "default") {
  const envKey =
    ADSTERRA_PLACEMENT_ENV_KEYS[placementId] ||
    ADSTERRA_PLACEMENT_ENV_KEYS.default;
  const specific = process.env[envKey]?.trim();
  if (specific) return specific;
  return process.env.NEXT_PUBLIC_ADSTERRA_KEY_DEFAULT?.trim() || "";
}

export function isAdsConsentRequired() {
  return process.env.NEXT_PUBLIC_ADS_CONSENT_REQUIRED === "true";
}
