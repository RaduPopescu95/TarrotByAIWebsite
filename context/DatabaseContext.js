import React, { createContext, useState, useEffect, useContext } from "react";
import languageDetector from "../lib/languageDetector";
import { handleGetFirestorePaginatedCached } from "../utils/firestoreUtils";
import { useRouter } from "next/router";

export const DatabaseContext = createContext({
  articles: {},
  setArticles: () => {},
  services: [],
  setServices: () => {},
  isLoading: false,
});

export const DatabaseProvider = ({ children }) => {
  const router = useRouter();
  const [articles, setArticles] = useState({});
  const [article, setArticle] = useState({});
  const [services, setServices] = useState([]);
  const [isLoading, setIsLoading] = useState(true); // Setează initial isLoading la true
  const detectedLng = languageDetector.detect();

  const [lang, setLang] = useState(detectedLng);

  const handleData = async (setter) => {
    try {
      const t0 = typeof performance !== "undefined" ? performance.now() : Date.now();
      // IMPORTANT: this context is used across the whole site. Avoid full collection reads.
      // We only need a small subset for “latest articles” widgets.
      const PAGE_SIZE = 50;
      const result = await handleGetFirestorePaginatedCached(
        "BlogArticole",
        PAGE_SIZE,
        null,
        "firstUploadTimestamp",
        "desc"
      );
      const articlesData = result?.data || [];
      const t1 = typeof performance !== "undefined" ? performance.now() : Date.now();
      console.log(
        `[DatabaseContext] BlogArticole fetched in ${Math.round(t1 - t0)}ms, docs: ${articlesData.length}`
      );

      console.log(articlesData);
      // Sortarea articolelor după data și ora lor
      const sortedArticles = articlesData.sort((a, b) => {
        // Combină data și ora într-un singur string și convertește-le în obiecte de tip Date
        const dateTimeA = new Date(`${a.date} ${a.time}`);
        const dateTimeB = new Date(`${b.date} ${b.time}`);

        // Compară obiectele de tip Date
        return dateTimeB - dateTimeA;
      });

      // Selectarea celor mai noi două articole
      const latestArticles = sortedArticles.slice(0, 2);

      // Selectarea celor mai noi cinci articole
      const latestFiveArticles = sortedArticles.slice(0, 5);

      // Selectarea celui mai nou articol
      const lastArticle = sortedArticles[0]; // Primul articol din lista sortată este cel mai recent

      // Returnarea datelor către componenta Next.js
      const articles = {
        articlesData,
        latestArticles,
        lastArticle,
        latestFiveArticles,
      };
      console.log("handle data....", articles);
      setter(articles);
      setIsLoading(false); // Setează isLoading la false indiferent de rezultat
    } catch (error) {
      // Gestionează erorile aici
      console.error("Error fetching data:", error);
      setIsLoading(false); // Setează isLoading la false indiferent de rezultat
    } finally {
      console.log("test here...");
      console.log(articles);
      console.log(isLoading);
      setIsLoading(false); // Setează isLoading la false indiferent de rezultat
      console.log(isLoading);
    }
  };

  const handleArticles = () => {
    handleData(setArticles);
  };

  const handleServices = () => {
    // Services handling is no longer needed or can be implemented separately
    setServices([]);
  };

  useEffect(() => {
    if (!router.isReady) return;
    const path = router.pathname || "";
    const isAdminRoute =
      path.startsWith("/dashboard") || path.startsWith("/admin") || path.startsWith("/login-admin");
    const prefetchEnabled = process.env.NEXT_PUBLIC_DATABASE_CONTEXT_PREFETCH_ARTICLES === "true";
    const isArticlesRoute = path === "/" || path === "/news" || path === "/news/[slug]";

    if (isAdminRoute || !prefetchEnabled || !isArticlesRoute) {
      console.log(
        `[DatabaseContext] Skip BlogArticole prefetch on route: ${path} (enabled=${prefetchEnabled})`
      );
      setIsLoading(false);
      return;
    }
    handleArticles();
  }, [router.isReady, router.pathname]);

  return (
    <DatabaseContext.Provider
      value={{
        articles,
        setArticles,
        services,
        setServices,
        isLoading,
        lang,
        article,
        setArticle,
      }}
    >
      {children}
    </DatabaseContext.Provider>
  );
};

export function useDatabase() {
  const context = useContext(DatabaseContext);
  if (context === undefined) {
    throw new Error("Context must be used within a Provider");
  }
  return context;
}
