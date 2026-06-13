import { setDynamicPublicCacheHeaders } from "../../../lib/httpCache";
import { loadPublicArticles, parseArticleLimit } from "../../../lib/publicArticles";
import { readSingleQueryValue } from "../../../lib/courses";
import { withFirestoreReadTelemetry } from "../../../lib/firestoreCostLogger";

// Direct Firestore reads with in-memory cache - simpler and more reliable
export const config = {
  maxDuration: 30,
};

function buildRequestId() {
  return `articles_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

async function handler(req, res) {
  const requestId = buildRequestId();
  res.setHeader("X-Request-Id", requestId);

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed", requestId });
  }

  try {
    const limit = parseArticleLimit(req.query.limit);
    const category = readSingleQueryValue(req.query.category);
    const tag = readSingleQueryValue(req.query.tag);
    const search = readSingleQueryValue(req.query.search);
    const cursor = readSingleQueryValue(req.query.cursor);
    const id = readSingleQueryValue(req.query.id);
    const locale = readSingleQueryValue(req.query.locale);

    const payload = await loadPublicArticles({
      limit,
      category,
      tag,
      search,
      cursor,
      id,
      locale,
    });
    const nowMs = Date.now();
    const cacheMeta = setDynamicPublicCacheHeaders(res, {
      nowMs,
      nextPublishAtMs: payload?.nextPublishAtMs ?? null,
      maxAgeSeconds: 300,
      staleWhileRevalidateSeconds: 600,
    });

    console.info("[articles.public] success", {
      requestId,
      limit,
      category: category || null,
      tag: tag || null,
      hasSearch: Boolean(search),
      cursor: cursor || null,
      id: id || null,
      articlesCount: payload.articles.length,
      cacheTtlSec: cacheMeta.cacheTtlSec,
    });

    return res.status(200).json({
      ...payload,
      requestId,
      generatedAt: new Date(nowMs).toISOString(),
      cacheTtlSec: cacheMeta.cacheTtlSec,
    });
  } catch (error) {
    console.error("[articles.public] failed", {
      requestId,
      message: error?.message || String(error),
      query: req.query || {},
    });
    return res.status(500).json({ error: "Failed to load articles", requestId });
  }
}

export default withFirestoreReadTelemetry("/api/articles", handler);
