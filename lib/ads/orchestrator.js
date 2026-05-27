import { AD_PROVIDERS, AD_SLOT_KEYS, EXCLUDED_ROUTE_PREFIXES, PUBLIC_CONTENT_ROUTE_PATTERNS, SLOT_ROUTE_RULES } from "./config";

function normalizePath(pathname) {
  if (!pathname || typeof pathname !== "string") return "/";
  const trimmed = pathname.split("?")[0].split("#")[0];
  return trimmed || "/";
}

export function isExcludedRoute(pathname) {
  const normalized = normalizePath(pathname);
  return EXCLUDED_ROUTE_PREFIXES.some((prefix) => normalized.startsWith(prefix));
}

export function isPublicContentRoute(pathname) {
  const normalized = normalizePath(pathname);
  return PUBLIC_CONTENT_ROUTE_PATTERNS.some((pattern) => pattern.test(normalized));
}

export function isRouteEligibleForAds(pathname) {
  if (isExcludedRoute(pathname)) return false;
  return isPublicContentRoute(pathname);
}

export function getRouteSlots(pathname) {
  const normalized = normalizePath(pathname);
  const rule = SLOT_ROUTE_RULES.find(({ routePattern }) =>
    routePattern.test(normalized)
  );
  return rule?.slots || [];
}

export function isSlotEnabledForRoute(pathname, slotKey) {
  if (!slotKey) return false;
  if (slotKey !== AD_SLOT_KEYS.AFTER_HERO && slotKey !== AD_SLOT_KEYS.IN_FEED) {
    return false;
  }
  return getRouteSlots(pathname).includes(slotKey);
}

export function resolveActiveAdProvider(pathname, adsEnv) {
  const hasAdsense = Boolean(adsEnv.enableAdSense && adsEnv.adSenseClientId);

  if (!adsEnv.adsEnabled || !isRouteEligibleForAds(pathname)) {
    return AD_PROVIDERS.NONE;
  }

  return hasAdsense ? AD_PROVIDERS.ADSENSE : AD_PROVIDERS.NONE;
}
