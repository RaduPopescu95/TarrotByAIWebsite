import { getCategorySlug } from "./slugify";

/**
 * Build sorted category nav items for videoteca filter chips.
 * @param {Array<{ name?: string; slug?: string; locales?: Record<string, string> }>} categoryDocs
 * @param {string} locale
 * @param {{ onlyWithVideos?: boolean; videoCategoryNames?: Set<string> }} [options]
 * @returns {Array<{ name: string; slug: string; label: string }>}
 */
export function buildVideoLibraryCategoryNavItems(
  categoryDocs,
  locale,
  { onlyWithVideos = false, videoCategoryNames = new Set() } = {}
) {
  const items = [];

  for (const category of Array.isArray(categoryDocs) ? categoryDocs : []) {
    const name = typeof category?.name === "string" ? category.name.trim() : "";
    if (!name) continue;

    const slug = getCategorySlug(category);
    if (!slug) continue;

    if (onlyWithVideos && !videoCategoryNames.has(name)) continue;

    const label =
      (category.locales && (category.locales[locale] || category.locales.ro)) || name;

    items.push({ name, slug, label });
  }

  return items.sort((a, b) => a.label.localeCompare(b.label));
}

/**
 * @param {Array<{ category?: string }>} videos
 * @returns {Set<string>}
 */
export function collectVideoCategoryNames(videos) {
  const set = new Set();
  for (const video of Array.isArray(videos) ? videos : []) {
    const name = typeof video?.category === "string" ? video.category.trim() : "";
    if (name) set.add(name);
  }
  return set;
}
