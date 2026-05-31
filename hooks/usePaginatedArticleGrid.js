import { useState, useCallback, useMemo } from "react";
import { fetchPublicArticlesClient } from "../utils/fetchPublicArticlesClient";

export function usePaginatedArticleGrid({
  locale,
  pageSize,
  featuredCount = 0,
  initialArticles = [],
  initialCursor = null,
  getSortMs,
}) {
  const sortArticles = useCallback(
    (items) => [...items].sort((left, right) => getSortMs(right) - getSortMs(left)),
    [getSortMs]
  );

  const buildInitialGridPages = useCallback(() => {
    const sorted = sortArticles(initialArticles);
    const firstPage = sorted.slice(featuredCount, featuredCount + pageSize);
    return firstPage.length ? [firstPage] : [[]];
  }, [initialArticles, featuredCount, pageSize, sortArticles]);

  const [filterItem, setFilterItem] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [gridPages, setGridPages] = useState(buildInitialGridPages);
  const [gridNextCursor, setGridNextCursor] = useState(initialCursor);
  const [isGridLoading, setIsGridLoading] = useState(false);

  const articlesToDisplay = useMemo(
    () => gridPages[currentPage - 1] || [],
    [gridPages, currentPage]
  );

  const canGoNext = currentPage < gridPages.length || Boolean(gridNextCursor);
  const canGoPrev = currentPage > 1;
  const totalLoadedCount = useMemo(
    () => gridPages.reduce((sum, page) => sum + page.length, 0),
    [gridPages]
  );

  const applyFeaturedFromArticles = useCallback((sortedArticles, onFeatured) => {
    if (!onFeatured) return;
    onFeatured({
      lastArticle: sortedArticles[0] || null,
      latestArticles: sortedArticles.slice(1, 3),
      latestFiveArticles: sortedArticles.slice(0, 5),
    });
  }, []);

  const handleFilter = useCallback(
    async (nextFilter, onFeatured) => {
      setFilterItem(nextFilter);
      setCurrentPage(1);
      setIsGridLoading(true);

      try {
        const canSeedFromSsr =
          nextFilter === "All" && initialArticles.length > featuredCount;

        if (canSeedFromSsr) {
          const sorted = sortArticles(initialArticles);
          applyFeaturedFromArticles(sorted, onFeatured);
          const firstPage = sorted.slice(featuredCount, featuredCount + pageSize);
          setGridPages(firstPage.length ? [firstPage] : [[]]);
          setGridNextCursor(initialCursor);
          return;
        }

        const requests = [
          fetchPublicArticlesClient({
            locale,
            category: nextFilter,
            limit: featuredCount > 0 && onFeatured ? featuredCount + pageSize : pageSize,
          }),
        ];

        const results = await Promise.all(requests);
        const combinedPayload = results[0];

        if (featuredCount > 0 && onFeatured) {
          const sortedCombined = sortArticles(combinedPayload.articles);
          applyFeaturedFromArticles(sortedCombined, onFeatured);
          const gridArticles = sortedCombined.slice(featuredCount, featuredCount + pageSize);
          setGridPages([gridArticles]);
          setGridNextCursor(combinedPayload.nextCursor);
          return;
        }

        setGridPages([combinedPayload.articles]);
        setGridNextCursor(combinedPayload.nextCursor);
      } catch (error) {
        console.error("[articles.grid] filter failed", error?.message || error);
        setGridPages([[]]);
        setGridNextCursor(null);
      } finally {
        setIsGridLoading(false);
      }
    },
    [
      locale,
      pageSize,
      featuredCount,
      initialArticles,
      initialCursor,
      sortArticles,
      applyFeaturedFromArticles,
    ]
  );

  const handleNextPage = useCallback(async () => {
    if (currentPage < gridPages.length) {
      setCurrentPage((page) => page + 1);
      return;
    }
    if (!gridNextCursor || isGridLoading) return;

    setIsGridLoading(true);
    try {
      const payload = await fetchPublicArticlesClient({
        locale,
        category: filterItem,
        limit: pageSize,
        cursor: gridNextCursor,
      });
      setGridPages((pages) => [...pages, payload.articles]);
      setGridNextCursor(payload.nextCursor);
      setCurrentPage((page) => page + 1);
    } catch (error) {
      console.error("[articles.grid] next page failed", error?.message || error);
    } finally {
      setIsGridLoading(false);
    }
  }, [
    currentPage,
    gridPages.length,
    gridNextCursor,
    isGridLoading,
    locale,
    filterItem,
    pageSize,
  ]);

  const handlePrevPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage((page) => page - 1);
    }
  }, [currentPage]);

  return {
    filterItem,
    currentPage,
    articlesToDisplay,
    isGridLoading,
    canGoNext,
    canGoPrev,
    totalLoadedCount,
    loadedPageCount: gridPages.length,
    handleFilter,
    handleNextPage,
    handlePrevPage,
  };
}
