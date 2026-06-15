/** GA4 measurement ID (e.g. G-XXXXXXXXXX). Set in NEXT_PUBLIC_GA_MEASUREMENT_ID. */
export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "";

/**
 * @returns {boolean}
 */
export function isGaEnabled() {
  if (!GA_MEASUREMENT_ID) return false;
  if (process.env.NEXT_PUBLIC_GA_ENABLED === "false") return false;
  if (process.env.NODE_ENV !== "production") return false;
  return true;
}

/**
 * @param {string} path
 * @returns {boolean}
 */
export function shouldTrackPath(path = "") {
  const normalized = String(path || "").split("?")[0] || "/";
  if (normalized.startsWith("/dashboard")) return false;
  if (normalized.startsWith("/administrare")) return false;
  if (normalized.startsWith("/api/")) return false;
  return true;
}

/**
 * @param {string} url
 */
export function pageview(url) {
  if (typeof window === "undefined" || !isGaEnabled()) return;
  if (!shouldTrackPath(url)) return;
  if (typeof window.gtag !== "function") return;

  window.gtag("config", GA_MEASUREMENT_ID, {
    page_path: url,
  });
}

/**
 * @param {string} action
 * @param {Record<string, unknown>} [params]
 */
export function trackEvent(action, params = {}) {
  if (typeof window === "undefined" || !isGaEnabled()) return;
  if (typeof window.gtag !== "function") return;

  window.gtag("event", action, params);
}
