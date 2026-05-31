import {
  clearPublicArticlesMemoryCache,
  rebuildPublicArticlesMaterializedCache,
} from "../../../../lib/publicArticles";
import { requireDashboardAccess } from "../../../../lib/requireAuth";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    requireDashboardAccess(req);
    clearPublicArticlesMemoryCache();
    const rowCount = await rebuildPublicArticlesMaterializedCache();
    return res.status(200).json({
      ok: true,
      rowCount: Array.isArray(rowCount) ? rowCount.length : null,
      message: "Public articles materialized cache rebuilt",
    });
  } catch (error) {
    const status = error?.statusCode || 500;
    console.error("[admin.articles-cache.rebuild] failed", error?.message || error);
    return res.status(status).json({
      error: status === 500 ? "Failed to rebuild article cache" : error.message,
    });
  }
}
