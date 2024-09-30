import React, { createContext, useState, useEffect, useContext } from "react";
import { handleGetArticles, handleGetServices } from "../utils/realtimeUtils";
import languageDetector from "../lib/languageDetector";
import { handleGetFirestore } from "../utils/firestoreUtils";

export const DatabaseContext = createContext({
  articles: {},
  setArticles: () => {},
  services: [],
  setServices: () => {},
  isLoading: false,
});

export const DatabaseProvider = ({ children }) => {
  const [articles, setArticles] = useState({});
  const [article, setArticle] = useState({});
  const [services, setServices] = useState([]);
  const [isLoading, setIsLoading] = useState(true); // Setează initial isLoading la true
  const detectedLng = languageDetector.detect();

  const [lang, setLang] = useState(detectedLng);

  const handleData = async (setter) => {
    try {
      const articlesData = await handleGetFirestore("BlogArticole");

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
    handleData(setServices, handleGetServices);
  };

  useEffect(() => {
    handleArticles();
  }, []);

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
