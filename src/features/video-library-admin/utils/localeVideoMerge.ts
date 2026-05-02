import type { VideoLocales } from "../types/video";

/**
 * Prefer ro, then remaining site locales, for denormalized root `videoUrl`.
 */
export function siteLocalesRootPreferredOrder(siteLocales: readonly string[]): string[] {
  const rest = siteLocales.filter((l) => l !== "ro");
  return ["ro", ...rest];
}

export function mergeLocalesWithVideoUrls(
  baseLocales: VideoLocales | undefined,
  urls: Record<string, string>,
  siteLocales: readonly string[],
  defaultTitle: string
): VideoLocales {
  const titleBase = defaultTitle.trim() || "";
  const merged: VideoLocales = { ...(baseLocales || {}) };

  for (const lc of siteLocales) {
    const u = (urls[lc] ?? "").trim();
    const prev = merged[lc];
    if (u) {
      merged[lc] = {
        title:
          typeof prev?.title === "string" && prev.title.trim().length > 0
            ? prev.title.trim()
            : titleBase,
        ...(typeof prev?.description === "string" && prev.description.trim().length > 0
          ? { description: prev.description }
          : {}),
        videoUrl: u,
      };
    } else if (prev) {
      merged[lc] = {
        title: typeof prev.title === "string" && prev.title.trim().length > 0 ? prev.title.trim() : titleBase,
        ...(typeof prev.description === "string" && prev.description.trim().length > 0
          ? { description: prev.description }
          : {}),
      };
    }
  }

  return merged;
}
