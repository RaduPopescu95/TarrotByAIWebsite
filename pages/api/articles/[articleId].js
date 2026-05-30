import { readSingleQueryValue } from "../../../lib/courses";
import { setDynamicPublicCacheHeaders } from "../../../lib/httpCache";
import { loadPublicArticleDetail, parseRelatedLimit } from "../../../lib/publicArticlesSimple";

function buildRequestId() {
  return `article_detail_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export default async function handler(req, res) {
  const requestId = buildRequestId();
  res.setHeader("X-Request-Id", requestId);

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed", requestId });
  }

  try {
    const articleId = typeof req.query.articleId === "string" ? req.query.articleId.trim() : "";
    const locale = readSingleQueryValue(req.query.locale);
    const relatedLimit = parseRelatedLimit(req.query.relatedLimit);
    if (!articleId) {
      return res.status(400).json({ error: "Missing articleId", requestId });
    }

    const payload = await loadPublicArticleDetail({
      id: articleId,
      locale,
      relatedLimit,
    });

    const nowMs = Date.now();
    const cacheMeta = setDynamicPublicCacheHeaders(res, {
      nowMs,
      nextPublishAtMs: payload?.nextPublishAtMs ?? null,
      maxAgeSeconds: 60,
      staleWhileRevalidateSeconds: 60,
    });

    if (!payload.article) {
      return res.status(404).json({
        error: "Article not found",
        requestId,
        generatedAt: new Date(nowMs).toISOString(),
        cacheTtlSec: cacheMeta.cacheTtlSec,
      });
    }

    return res.status(200).json({
      ...payload,
      requestId,
      generatedAt: new Date(nowMs).toISOString(),
      cacheTtlSec: cacheMeta.cacheTtlSec,
    });
  } catch (error) {
    console.error("[articles.detail] failed", {
      requestId,
      message: error?.message || String(error),
      query: req.query || {},
    });
    return res.status(500).json({ error: "Failed to load article detail", requestId });
  }
}

