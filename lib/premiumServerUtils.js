/**
 * Shared server helpers for Stripe premium routes.
 */

export function resolvePremiumPublicBaseUrl(req) {
  const fromApp =
    typeof process.env.NEXT_PUBLIC_APP_URL === "string" ? process.env.NEXT_PUBLIC_APP_URL.trim() : "";
  const fromSite =
    typeof process.env.NEXT_PUBLIC_SITE_URL === "string" ? process.env.NEXT_PUBLIC_SITE_URL.trim() : "";
  const configured = fromApp || fromSite;
  if (configured) {
    return configured.replace(/\/+$/, "");
  }

  const forwardedProto = req.headers?.["x-forwarded-proto"];
  const forwardedHost = req.headers?.["x-forwarded-host"];
  const host = forwardedHost || req.headers?.host;
  const proto = forwardedProto || "http";
  if (!host) return null;
  return `${proto}://${host}`.replace(/\/+$/, "");
}
