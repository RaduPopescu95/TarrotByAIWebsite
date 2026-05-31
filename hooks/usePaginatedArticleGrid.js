import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { fetchPublicArticlesClient } from "../utils/fetchPublicArticlesClient";

export function usePaginatedArticleGrid({
  locale,
  pageSize,
  featuredCount = 0,
  initialFeaturedArticles = [],
  initialGridArticles = [],
  initialGridCursor = null,
  getSortMs,
}) {
  const sortArticles = useCallback(
    (items) => [...items].sort((left, right) => getSortMs(right) - getSortMs(left)),
    [getSortMs]
  );

  const buildInitialGridPages = useCallback(() => {
    const sorted = sortArticles(initialGridArticles);
    return sorted.length ? [sorted] : [[]];
  }, [initialGridArticles, sortArticles]);

  const [filterItem, setFilterItem] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [gridPages, setGridPages] = useState(buildInitialGridPages);
  const [gridNextCursor, setGridNextCursor] = useState(initialGridCursor);
  const [isGridLoading, setIsGridLoading] = useState(false);
  const bootstrapAttemptedRef = useRef(false);

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

  const resetAllFilter = useCallback(
    (onFeatured) => {
      const sortedFeatured = sortArticles(initialFeaturedArticles);
      applyFeaturedFromArticles(sortedFeatured, onFeatured);
      const sortedGrid = sortArticles(initialGridArticles);
      setGridPages(sortedGrid.length ? [sortedGrid] : [[]]);
      setGridNextCursor(initialGridCursor);
      setCurrentPage(1);
    },
    [
      applyFeaturedFromArticles,
      initialFeaturedArticles,
      initialGridArticles,
      initialGridCursor,
      sortArticles,
    ]
  );

  const handleFilter = useCallback(
    async (nextFilter, onFeatured) => {
      setFilterItem(nextFilter);
      setCurrentPage(1);
      setIsGridLoading(true);

      try {
        if (nextFilter === "All") {
          resetAllFilter(onFeatured);
          return;
        }

        const payload = await fetchPublicArticlesClient({
          locale,
          category: nextFilter,
          limit: featuredCount > 0 && onFeatured ? featuredCount + pageSize : pageSize,
        });

        if (featuredCount > 0 && onFeatured) {
          const sortedCombined = sortArticles(payload.articles);
          applyFeaturedFromArticles(sortedCombined, onFeatured);
          const gridArticles = sortedCombined.slice(featuredCount, featuredCount + pageSize);
          setGridPages([gridArticles]);
          setGridNextCursor(payload.nextCursor);
          return;
        }

        setGridPages([payload.articles]);
        setGridNextCursor(payload.nextCursor);
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
      resetAllFilter,
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

  useEffect(() => {
    if (bootstrapAttemptedRef.current) return;
    if ((gridPages[0] || []).length > 0) return;
    if (!initialGridCursor && initialGridArticles.length === 0) return;

    bootstrapAttemptedRef.current = true;
    let cancelled = false;

    const bootstrapGrid = async () => {
      setIsGridLoading(true);
      try {
        const payload = await fetchPublicArticlesClient({
          locale,
          limit: pageSize,
          cursor: initialGridCursor || undefined,
        });
        if (cancelled) return;
        const sorted = sortArticles(payload.articles);
        if (sorted.length > 0) {
          setGridPages([sorted]);
          setGridNextCursor(payload.nextCursor);
          setCurrentPage(1);
        }
      } catch (error) {
        console.error("[articles.grid] bootstrap failed", error?.message || error);
      } finally {
        if (!cancelled) {
          setIsGridLoading(false);
        }
      }
    };

    void bootstrapGrid();

    return () => {
      cancelled = true;
    };
  }, [
    gridPages,
    initialGridArticles.length,
    initialGridCursor,
    locale,
    pageSize,
    sortArticles,
  ]);

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
