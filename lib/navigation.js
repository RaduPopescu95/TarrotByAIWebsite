export function sanitizeInternalReturnUrl(value, fallback = "/") {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  if (!trimmed.startsWith("/")) return fallback;
  if (trimmed.startsWith("//")) return fallback;
  if (trimmed.includes("://")) return fallback;
  if (/[\r\n]/.test(trimmed)) return fallback;
  return trimmed;
}
