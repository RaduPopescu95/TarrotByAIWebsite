export async function fetchPublicArticlesClient({
  locale = "ro",
  category,
  limit = 50,
} = {}) {
  const params = new URLSearchParams({
    locale: locale || "ro",
    limit: String(limit),
  });
  if (category && category !== "All") {
    params.set("category", category);
  }

  const response = await fetch(`/api/articles?${params.toString()}`);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.error || "Failed to load articles");
  }

  return {
    articles: Array.isArray(payload?.articles) ? payload.articles : [],
    nextCursor: typeof payload?.nextCursor === "string" ? payload.nextCursor : null,
  };
}
