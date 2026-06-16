/**
 * Convert a string to URL-friendly slug.
 * Handles diacritics, special characters, and whitespace.
 */
function slugify(text) {
  if (!text || typeof text !== "string") return "";
  return text
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Get slug from category object or generate from name.
 */
function getCategorySlug(category) {
  if (!category) return "";
  if (category.slug) return category.slug;
  return slugify(category.name || "");
}

module.exports = { slugify, getCategorySlug };
