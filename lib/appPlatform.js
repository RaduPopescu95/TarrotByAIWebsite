export function normalizeAppPlatform(value) {
  const raw = Array.isArray(value) ? value[0] : value;
  if (typeof raw !== "string") return null;
  const normalized = raw.trim().toLowerCase();
  return normalized === "ios" || normalized === "android" ? normalized : null;
}
