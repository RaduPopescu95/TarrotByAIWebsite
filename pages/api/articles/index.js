import { loadPublicArticles, parseArticleLimit } from "../../../lib/publicArticles";
import { readSingleQueryValue } from "../../../lib/courses";

function buildRequestId() {
  return `articles_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export default async function handler(req, res) {
  const requestId = buildRequestId();
  res.setHeader("X-Request-Id", requestId);

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed", requestId });
  }

  res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");

  try {
    const limit = parseArticleLimit(req.query.limit);
    const category = readSingleQueryValue(req.query.category);
    const search = readSingleQueryValue(req.query.search);
    const cursor = readSingleQueryValue(req.query.cursor);
    const locale = readSingleQueryValue(req.query.locale);

    const payload = await loadPublicArticles({
      limit,
      category,
      search,
      cursor,
      locale,
    });

    console.info("[articles.public] success", {
      requestId,
      limit,
      category: category || null,
      hasSearch: Boolean(search),
      cursor: cursor || null,
      articlesCount: payload.articles.length,
    });

    return res.status(200).json({ ...payload, requestId });
  } catch (error) {
    console.error("[articles.public] failed", {
      requestId,
      message: error?.message || String(error),
      query: req.query || {},
    });
    return res.status(500).json({ error: "Failed to load articles", requestId });
  }
}
