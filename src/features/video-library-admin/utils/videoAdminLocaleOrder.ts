/** Display order for video admin (Cristina 04.06.2026) — not next-i18next.config order. */
export const VIDEO_ADMIN_LOCALE_DISPLAY_ORDER = [
  "sq",
  "ar",
  "bs",
  "bg",
  "cs",
  "zh",
  "ko",
  "hr",
  "he",
  "en",
  "fr",
  "de",
  "el",
  "hi",
  "id",
  "it",
  "ja",
  "hu",
  "mn",
  "pl",
  "pt",
  "ro",
  "ru",
  "sr",
  "sk",
  "es",
  "tr",
] as const;

export function sortLocalesForVideoAdmin(siteLocales: readonly string[]): string[] {
  const set = new Set(siteLocales);
  const ordered: string[] = [];
  for (const lc of VIDEO_ADMIN_LOCALE_DISPLAY_ORDER) {
    if (set.has(lc)) ordered.push(lc);
  }
  for (const lc of siteLocales) {
    if (!ordered.includes(lc)) ordered.push(lc);
  }
  return ordered;
}
