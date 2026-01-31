import React, { useState, useEffect } from "react";
import CustomDrawer from "../../../components/Dashboard/CustomDrawer";
import LocalPasswordGate from "../../../components/Dashboard/LocalPasswordGate";
import Head from "next/head";
import AfirmatiiPozitive from "../../../components/Tables/AfirmatiiPozitive";
import {
  handleGetFirestorePaginated,
  handleGetFirestorePaginatedCached,
} from "../../../utils/firestoreUtils";
import { Box, CircularProgress, Button } from "@mui/material";

export default function index() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastVisible, setLastVisible] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const PAGE_SIZE = 50;

  const normalizeData = (data) => {
    const rawData = Array.isArray(data) ? [...data] : [];
    const transformed = rawData
      .map((article) => ({
        ...article,
        firstUploadTimestamp: article?.firstUploadTimestamp?.seconds
          ? new Date(article.firstUploadTimestamp.seconds * 1000).toISOString()
          : article?.firstUploadTimestamp || null,
      }))
      .sort((a, b) => {
        if (typeof a.id === "number" && typeof b.id === "number") return a.id - b.id;
        const aName = a?.info?.ro?.nume || "";
        const bName = b?.info?.ro?.nume || "";
        return aName.localeCompare(bName);
      });
    return transformed;
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      console.log("[AfirmatiiPozitive] Fetch page 1 (cached)");
      const t0 = performance.now();
      console.log("[AfirmatiiPozitive] Pornesc fetch client-side...");
      setLoading(true);
      try {
        const result = await handleGetFirestorePaginatedCached(
          "AfirmatiiPozitive",
          PAGE_SIZE,
          null,
          "id",
          "asc"
        );
        const data = result?.data || [];
        console.log("[AfirmatiiPozitive] Raw count:", data?.length, data);
        if (!Array.isArray(data) || data.length === 0) {
          console.warn("[AfirmatiiPozitive] Nu s-au găsit documente în colecție sau răspunsul nu este un array.");
        }
        const transformed = normalizeData(data);
        const t1 = performance.now();
        console.log(
          `[AfirmatiiPozitive] Page 1 fetched in ${Math.round(t1 - t0)}ms, docs: ${data.length}`
        );
        console.log("[AfirmatiiPozitive] Transformed count:", transformed.length, transformed.slice(0, 3));
        if (mounted) {
          setArticles(transformed);
          setLastVisible(result?.lastVisible || null);
          setHasMore(!!result?.hasMore);
        }
      } catch (e) {
        console.error("[AfirmatiiPozitive] Eroare la fetch:", e);
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
    console.log("[AfirmatiiPozitive] Load more");
    const t0 = performance.now();
    setLoadingMore(true);
    try {
      const result = await handleGetFirestorePaginated(
        "AfirmatiiPozitive",
        PAGE_SIZE,
        lastVisible,
        "id",
        "asc"
      );
      const nextItems = normalizeData(result?.data || []);
      const t1 = performance.now();
      console.log(
        `[AfirmatiiPozitive] Page more fetched in ${Math.round(t1 - t0)}ms, docs: ${
          result?.data?.length || 0
        }`
      );
      setArticles((prev) => normalizeData([...prev, ...nextItems]));
      setLastVisible(result?.lastVisible || lastVisible);
      setHasMore(!!result?.hasMore);
    } catch (e) {
      console.error("[AfirmatiiPozitive] Eroare la load more:", e);
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
        <CustomDrawer selectedItem={"Afirmatii"} drawerText={"Afirmatii"}>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh" }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Box sx={{ color: "#ff6b6b", p: 2 }}>Eroare la încărcare: {error}</Box>
          ) : (
            <>
              <AfirmatiiPozitive articles={articles} />
              {hasMore && (
                <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
                  <Button
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    variant="outlined"
                  >
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
