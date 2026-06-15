export function resolvePartnerPromotionLinkUrl(linkUrl, linkType) {
  const raw = typeof linkUrl === "string" ? linkUrl.trim() : "";
  if (!raw) return "";
  if (linkType !== "whatsapp") return raw;
  if (/^https?:\/\//i.test(raw) || raw.startsWith("whatsapp:")) return raw;
  const digits = raw.replace(/\D/g, "");
  return digits ? `https://wa.me/${digits}` : raw;
}
