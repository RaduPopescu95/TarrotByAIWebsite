import React, { useState, useEffect } from "react";
import CustomDrawer from "../../../components/Dashboard/CustomDrawer";
import Head from "next/head";
import NotificariManuale from "../../../components/Tables/NotificariManuale";
import {
  handleGetFirestorePaginated,
  handleGetFirestorePaginatedCached,
} from "../../../utils/firestoreUtils";
import { Box, Button, CircularProgress } from "@mui/material";

export default function index() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastVisible, setLastVisible] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const PAGE_SIZE = 50;

  const normalize = (data) => {
    const rawData = Array.isArray(data) ? [...data] : [];
    return rawData
      .filter((article) => article.firstUploadTimestamp)
      .map((article) => ({
        ...article,
        firstUploadTimestamp: article.firstUploadTimestamp.seconds
          ? new Date(article.firstUploadTimestamp.seconds * 1000).toISOString()
          : article.firstUploadTimestamp || null,
      }))
      .sort((a, b) => a.id - b.id);
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      console.log("[NotificariManuale] Fetch page 1 (cached)");
      const t0 = performance.now();
      setLoading(true);
      setError(null);
      try {
        const result = await handleGetFirestorePaginatedCached(
          "NotificariManuale",
          PAGE_SIZE,
          null,
          "id",
          "asc"
        );
        const data = result?.data || [];
        const t1 = performance.now();
        console.log(
          `[NotificariManuale] Page 1 fetched in ${Math.round(t1 - t0)}ms, docs: ${data.length}`
        );
        if (mounted) {
          setArticles(normalize(data));
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
    console.log("[NotificariManuale] Load more");
    const t0 = performance.now();
    setLoadingMore(true);
    try {
      const result = await handleGetFirestorePaginated(
        "NotificariManuale",
        PAGE_SIZE,
        lastVisible,
        "id",
        "asc"
      );
      const nextItems = normalize(result?.data || []);
      const t1 = performance.now();
      console.log(
        `[NotificariManuale] Page more fetched in ${Math.round(t1 - t0)}ms, docs: ${
          result?.data?.length || 0
        }`
      );
      setArticles((prev) => normalize([...prev, ...nextItems]));
      setLastVisible(result?.lastVisible || lastVisible);
      setHasMore(!!result?.hasMore);
    } catch (e) {
      console.error("Eroare la load more notificari:", e);
    } finally {
      setLoadingMore(false);
    }
  };
  return (
    <>
      <Head>
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <CustomDrawer selectedItem={"Notifificari Manuale"} drawerText={"Notifificari Manuale"}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh" }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Box sx={{ color: "#ff6b6b", p: 2 }}>Eroare la încărcare: {error}</Box>
        ) : (
          <>
            <NotificariManuale articles={articles} />
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
    </>
  );
}
