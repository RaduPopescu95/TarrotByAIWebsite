import React, { createContext, useState, useEffect, useContext } from "react";
import { handleGetArticles, handleGetServices } from "../utils/realtimeUtils";
import languageDetector from "../lib/languageDetector";
import { handleGetFirestore } from "../utils/firestoreUtils";

export const DatabaseContext = createContext({
  articles: [],
  setArticles: () => {},
  services: [],
  setServices: () => {},
  isLoading: false,
});

export const DatabaseProvider = ({ children }) => {
  const [articles, setArticles] = useState({});
  const [services, setServices] = useState([]);
  const [isLoading, setIsLoading] = useState(true); // Setează initial isLoading la true
  const detectedLng = languageDetector.detect();

  const [lang, setLang] = useState(detectedLng);

  const handleData = async (setter) => {
    try {
      const data = await handleGetFirestore("BlogArticole");
      console.log("handle data....", data);
      console.log(data);
      setter(data);
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
      value={{ articles, setArticles, services, setServices, isLoading, lang }}
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
