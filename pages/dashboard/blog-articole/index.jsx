import React, { useState, useEffect } from "react";
import CustomDrawer from "../../../components/Dashboard/CustomDrawer";
import LocalPasswordGate from "../../../components/Dashboard/LocalPasswordGate";
import Head from "next/head";
import BlogArticole from "../../../components/Tables/BlogArticole";
import {
  handleGetFirestorePaginated,
  handleGetFirestorePaginatedCached,
} from "../../../utils/firestoreUtils";
import { mergeBlogArticlesDesc, sortBlogArticlesDesc } from "../../../lib/blogArticleSort";
import { Box, Button, CircularProgress } from "@mui/material";

export default function index() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastVisible, setLastVisible] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const PAGE_SIZE = 50;

  const normalizeArticles = (data) => sortBlogArticlesDesc(Array.isArray(data) ? data : []);

  const handleArticleCreated = (article) => {
    if (!article) return;
    setArticles((prev) => mergeBlogArticlesDesc(prev, [article]));
  };

  const handleArticleUpdated = (article) => {
    if (!article) return;
    setArticles((prev) => mergeBlogArticlesDesc(prev, [article]));
  };

  const handleArticleDeleted = (documentId) => {
    if (!documentId) return;
    setArticles((prev) => prev.filter((item) => item.documentId !== documentId));
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      console.log("[BlogArticoleAdmin] Fetch page 1 (cached)");
      const t0 = performance.now();
      setLoading(true);
      setError(null);
      try {
        const result = await handleGetFirestorePaginatedCached(
          "BlogArticole",
          PAGE_SIZE,
          null,
          "firstUploadTimestamp",
          "desc"
        );
        const data = result?.data || [];
        const t1 = performance.now();
        console.log(
          `[BlogArticoleAdmin] Page 1 fetched in ${Math.round(t1 - t0)}ms, docs: ${data.length}`
        );
        if (mounted) {
          setArticles(normalizeArticles(data));
          setLastVisible(result?.lastVisible || null);
          setHasMore(!!result?.hasMore);
        }
      } catch (e) {
        console.error("Eroare la preluarea datelor in dashboard articles:", e);
        if (mounted) setError(e?.message || "Eroare necunoscută");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const handleLoadMore = async () => {
    if (!hasMore || loadingMore) return;
    console.log("[BlogArticoleAdmin] Load more");
    const t0 = performance.now();
    setLoadingMore(true);
    try {
      const result = await handleGetFirestorePaginated(
        "BlogArticole",
        PAGE_SIZE,
        lastVisible,
        "firstUploadTimestamp",
        "desc"
      );
      const nextItems = normalizeArticles(result?.data || []);
      const t1 = performance.now();
      console.log(
        `[BlogArticoleAdmin] Page more fetched in ${Math.round(t1 - t0)}ms, docs: ${
          result?.data?.length || 0
        }`
      );
      setArticles((prev) => normalizeArticles([...prev, ...nextItems]));
      setLastVisible(result?.lastVisible || lastVisible);
      setHasMore(!!result?.hasMore);
    } catch (e) {
      console.error("Eroare la load more blog:", e);
    } finally {
      setLoadingMore(false);
    }
  };
  return (
    <>
      <Head>
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <LocalPasswordGate>
        <CustomDrawer selectedItem={"Articole"} drawerText={"Articole"}>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh" }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Box sx={{ color: "#ff6b6b", p: 2 }}>Eroare la încărcare: {error}</Box>
          ) : (
            <>
              <BlogArticole
                articles={articles}
                onArticleCreated={handleArticleCreated}
                onArticleUpdated={handleArticleUpdated}
                onArticleDeleted={handleArticleDeleted}
              />
              {hasMore && (
                <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
                  <Button onClick={handleLoadMore} disabled={loadingMore} variant="outlined">
                    {loadingMore ? "Se încarcă..." : "Încarcă mai multe"}
                  </Button>
                </Box>
              )}
            </>
          )}
        </CustomDrawer>
      </LocalPasswordGate>
    </>
  );
}
