export const ADSENSE_ROUTE_PATTERNS = Object.freeze([
  /^\/news(?:\/|$)/,
  /^\/videouri(?:\/|$)/,
]);

function normalizePath(pathname) {
  if (!pathname || typeof pathname !== "string") return "/";
  const trimmed = pathname.split("?")[0].split("#")[0];
  return trimmed || "/";
}

export function isAdsenseRouteEligible(pathname) {
  const normalized = normalizePath(pathname);
  return ADSENSE_ROUTE_PATTERNS.some((pattern) => pattern.test(normalized));
}
