import { rebuildPublicArticlesMaterializedCache } from "../../../../lib/publicArticles";
import { requireDashboardAccess } from "../../../../lib/requireAuth";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    requireDashboardAccess(req);
    const rows = await rebuildPublicArticlesMaterializedCache();
    return res.status(200).json({
      ok: true,
      rowCount: rows.length,
    });
  } catch (error) {
    const status = error?.statusCode || 500;
    console.error("[admin.articles-cache.rebuild] failed", error?.message || error);
    return res.status(status).json({
      error: status === 500 ? "Failed to rebuild public article cache" : error.message,
    });
  }
}

