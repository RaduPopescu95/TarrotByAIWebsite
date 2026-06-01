export function sanitizeInternalReturnUrl(value, fallback = "/") {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  if (!trimmed.startsWith("/")) return fallback;
  if (trimmed.startsWith("//")) return fallback;
  if (trimmed.includes("://")) return fallback;
  if (/[\r\n]/.test(trimmed)) return fallback;
  return trimmed;
}

const AUTH_RETURN_URL_KEY = "authReturnUrl";

export function persistAuthReturnUrl(value, fallback = "/") {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(
    AUTH_RETURN_URL_KEY,
    sanitizeInternalReturnUrl(value, fallback)
  );
}

export function consumeAuthReturnUrl(fallback = "/") {
  if (typeof window === "undefined") return fallback;
  const stored = sessionStorage.getItem(AUTH_RETURN_URL_KEY);
  sessionStorage.removeItem(AUTH_RETURN_URL_KEY);
  return sanitizeInternalReturnUrl(stored || fallback, fallback);
}
