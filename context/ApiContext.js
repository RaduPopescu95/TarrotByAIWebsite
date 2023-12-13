// src/context/ApiDataContext.js
import React, { createContext, useState, useContext, useEffect } from "react";

const ApiDataContext = createContext();

export const useApiData = () => useContext(ApiDataContext);

export const ApiDataProvider = ({ children }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [triggerExitAnimation, setTriggerExitAnimation] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const page = Math.floor(Math.random() * 10) + 1;
      const options = {
        method: "GET",
        headers: {
          accept: "application/json",
          Authorization: "Bearer yB5iR69LtOdxenvBDcSw0roJYHCxXmhG",
        },
      };

      const response = await fetch(
        `https://apis.elai.io/api/v1/videos?page=${page}&limit=9`,
        options
      );
      const jsonResponse = await response.json();

      // Verifică dacă jsonResponse.videos există și este un array
      if (jsonResponse.videos && Array.isArray(jsonResponse.videos)) {
        const videoDetailsPromises = jsonResponse.videos.map((video) =>
          fetch(
            `https://apis.elai.io/api/v1/videos/${video._id}`,
            options
          ).then((response) => response.json())
        );

        const videosDetails = await Promise.all(videoDetailsPromises);
        setData(videosDetails); // Actualizează starea cu detaliile videoclipurilor
      }

      setLoading(false);
      setTriggerExitAnimation(false);
    } catch (err) {
      console.error(err);
      setError(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log("api effect");
    if (!triggerExitAnimation) {
      fetchData(); // Fetch data when not exiting
    }
  }, [triggerExitAnimation]);

  return (
    <ApiDataContext.Provider
      value={{
        data,
        loading,
        error,
        fetchData,
        setTriggerExitAnimation,
        triggerExitAnimation,
      }}
    >
      {children}
    </ApiDataContext.Provider>
  );
};
