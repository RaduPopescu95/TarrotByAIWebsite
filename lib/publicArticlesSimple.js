/**
 * @deprecated Use `./publicArticles` instead. Kept as a thin re-export for rollback.
 */
export {
  loadPublicArticles,
  loadPublicArticleDetail,
  parseArticleLimit,
  parseRelatedLimit,
  normalizeArticleLocale,
  clearPublicArticlesMemoryCache as clearArticlesCache,
} from "./publicArticles";
