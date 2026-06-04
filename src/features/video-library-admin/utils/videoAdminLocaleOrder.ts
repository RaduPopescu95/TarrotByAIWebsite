/** Display order for video admin locale URL fields (ro first, then client list, then hi/id). */
export const VIDEO_ADMIN_LOCALE_DISPLAY_ORDER = [
  "ro",
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
  "it",
  "ja",
  "hu",
  "mn",
  "pl",
  "pt",
  "ru",
  "sk",
  "es",
  "sr",
  "tr",
  "hi",
  "id",
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
