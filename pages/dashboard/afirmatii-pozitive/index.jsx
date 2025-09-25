import React, { useState, useEffect } from "react";
import CustomDrawer from "../../../components/Dashboard/CustomDrawer";
import LocalPasswordGate from "../../../components/Dashboard/LocalPasswordGate";
import Head from "next/head";
import AfirmatiiPozitive from "../../../components/Tables/AfirmatiiPozitive";
import { handleGetFirestore } from "../../../utils/firestoreUtils";
import { Box, CircularProgress } from "@mui/material";

export default function index() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      console.log("[AfirmatiiPozitive] Pornesc fetch client-side...");
      setLoading(true);
      try {
        const data = await handleGetFirestore("AfirmatiiPozitive");
        console.log("[AfirmatiiPozitive] Raw count:", data?.length, data);
        if (!Array.isArray(data) || data.length === 0) {
          console.warn("[AfirmatiiPozitive] Nu s-au găsit documente în colecție sau răspunsul nu este un array.");
        }
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
        console.log("[AfirmatiiPozitive] Transformed count:", transformed.length, transformed.slice(0, 3));
        if (mounted) setArticles(transformed);
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
            <AfirmatiiPozitive articles={articles} />
          )}
        </CustomDrawer>
      </LocalPasswordGate>
    </>
  );
}
