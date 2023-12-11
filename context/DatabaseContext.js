import React, { createContext, useState, useEffect, useContext } from "react";
import { handleGetArticles, handleGetServices } from "../utils/realtimeUtils";

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

  const handleData = async (setter, dataFetcher) => {
    try {
      const data = await dataFetcher();
      setter(data);
    } catch (error) {
      // Gestionează erorile aici
      console.error("Error fetching data:", error);
    } finally {
      console.log("test here...");
      console.log(articles);
      console.log(isLoading);
      setIsLoading(false); // Setează isLoading la false indiferent de rezultat
      console.log(isLoading);
    }
  };

  const handleArticles = () => {
    handleData(setArticles, handleGetArticles);
  };

  const handleServices = () => {
    handleData(setServices, handleGetServices);
  };

  useEffect(() => {
    handleArticles();
    handleServices();
  }, []);

  return (
    <DatabaseContext.Provider
      value={{ articles, setArticles, services, setServices, isLoading }}
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
