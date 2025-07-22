import React, { createContext, useState, useContext, useEffect } from "react";
import firebase from "firebase/app";

import { getData } from "../utils/realtimeUtils";
import {
  handleGetFirestore,
  handleUploadFirestoreSubcollection,
} from "../utils/firestoreUtils";
import { authentication } from "../firebase";

const ApiDataContext = createContext();

export const useApiData = () => useContext(ApiDataContext);

export const ApiDataProvider = ({ children }) => {
  // 🚀 NEW: Get clearAuthCache from AuthContext
  
  // 🚀 FIX: Initialize cu structura corectă în loc de array gol
  const [cartiPersonalizate, setCartiPersonalizate] = useState({ arr: [] });
  const [categoriiPersonalizate, setCategoriiPersonalizate] = useState({ arr: [] });
  const [shuffledCartiPersonalizate, setShuffledCartiPersonalizate] = useState(
    []
  );
  const [varianteCarti, setVarianteCarti] = useState([]);
  // 🚀 FIX: Initialize cu structura corectă în loc de array gol
  const [cartiViitor, setCartiViitor] = useState({ arr: [] });
  const [shuffledCartiViitor, setShuffledCartiViitor] = useState([]);
  const [categoriiViitor, setCategoriiViitor] = useState({ arr: [] });
  const [blogData, setBlogData] = useState([]);
  const [citateMotivationale, setCitateMotivationale] = useState([]);
  const [culoriNorocoase, setCuloriNorocoase] = useState([]);
  const [numereNorocoase, setNumereNorocoase] = useState([]);
  const [oreNorocoase, setOreNorocoase] = useState([]);
  const [loading, setLoading] = useState(false);
  const [reentryAnimation, setReentryAnimation] = useState(false);
  const [error, setError] = useState(null);
  const [triggerExitAnimation, setTriggerExitAnimation] = useState(false);

  const [zilnicNumereNorocoase, setZilnicNumereNorocoase] = useState(null);
  const [zilnicCitateMotivationale, setZilnicCitateMotivationale] =
    useState(null);
  const [zilnicCuloriNorocoase, setZilnicCuloriNorocoase] = useState(null);
  const [zilnicOreNorocoase, setZilnicOreNorocoase] = useState(null);

  const [currentNumber, setCurrentNumber] = useState(0);

  const selecteazaElementZilnic = (array) => {
    const today = new Date();
    const seed =
      today.getFullYear() * 10000 +
      (today.getMonth() + 1) * 100 +
      today.getDate();
    const randomIndex = seed % array.length;
    return array[randomIndex];
  };

  const [shuffleTrigger, setShuffleTrigger] = useState(false);

  // Funcția de amestecare și completare a cărților PERSONALIZATE
  const shuffleCartiPersonalizate = () => {
    try {
      setTimeout(() => {
        setLoading(true);
      }, 1000);

      // Așteaptă finalizarea animației de ieșire înainte de a amesteca cărțile
      setTimeout(() => {
        console.log("shuffleCartiPersonalizate Inside Timeout");
        setLoading(true);

        // Funcție ajutătoare pentru amestecarea unui array
        const shuffleArray = (array) => {
          let currentIndex = array.length,
            randomIndex;
          while (currentIndex !== 0) {
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--;
            [array[currentIndex], array[randomIndex]] = [
              array[randomIndex],
              array[currentIndex],
            ];
          }
          return array;
        };

        // 🚀 FIX: Verificări defensive pentru optimizările cache
        console.log("🔄 [SHUFFLE DEBUG] CartiPersonalizate in shuffle:", {
          data: cartiPersonalizate,
          type: typeof cartiPersonalizate,
          isArray: Array.isArray(cartiPersonalizate),
          hasArr: cartiPersonalizate && cartiPersonalizate.arr,
          arrLength: cartiPersonalizate?.arr?.length,
          keys: cartiPersonalizate ? Object.keys(cartiPersonalizate) : 'none',
          isValid: !!(cartiPersonalizate && cartiPersonalizate.arr && Array.isArray(cartiPersonalizate.arr))
        });
        
        if (!cartiPersonalizate || !cartiPersonalizate.arr || !Array.isArray(cartiPersonalizate.arr)) {
          console.error("❌ [SHUFFLE] CartiPersonalizate data invalid:", cartiPersonalizate);
          setLoading(false);
          return;
        }

        // Apelează funcția ajutătoare pentru a amesteca array-ul de cărți
        let shuffledArray = [];
        try {
          shuffledArray = shuffleArray([...cartiPersonalizate.arr]);
        } catch (shuffleError) {
          console.error("❌ [SHUFFLE] Error shuffling cards:", shuffleError);
          setLoading(false);
          return;
        }

        // Completează sau taie array-ul pentru a avea exact numărul dorit de cărți
        while (shuffledArray.length < 8) {
          const randomCard =
            shuffledArray[Math.floor(Math.random() * shuffledArray.length)];
          shuffledArray.push({ ...randomCard });
        }
        if (shuffledArray.length > 8) {
          shuffledArray = shuffledArray.slice(0, 8);
        }

        // const auth = authentication;
        // if (auth.currentUser) {
        //   console.log("Is user...saving personal reading...");
        //   const userLocation = `Users/${
        //     auth.currentUser ? auth.currentUser.uid : ""
        //   }/PersonalReading`;
        //   handleUploadFirestoreSubcollection(shuffledArray, userLocation);
        // }

        // Actualizează state-ul cu noile cărți amestecate
        setShuffledCartiPersonalizate(shuffledArray);
        setLoading(false);

        // Resetare animație pentru a pregăti animația de intrare
        resetExitAnimation();

        // Setează shouldFlip pe true după reîncărcarea cărților
        // setShouldFlip(true);
      }, 3100); // Durata totală a animației de ieșire
    } catch (err) {
      console.log("Error at shuffleCartiPersonalizate...", err);
    }
  };
  // Funcția de amestecare și completare a cărților VIITOR
  const shuffleCartiViitor = () => {
    console.log("Shuffle Carti Viitor Start");
    // Inițiază animația de ieșire

    // Așteaptă finalizarea animației de ieșire înainte de a amesteca cărțile
    setTimeout(() => {
      console.log("Inside Timeout");
      setLoading(true);

      // Funcție ajutătoare pentru amestecarea unui array
      const shuffleArray = (array) => {
        let currentIndex = array.length,
          randomIndex;
        while (currentIndex !== 0) {
          randomIndex = Math.floor(Math.random() * currentIndex);
          currentIndex--;
          [array[currentIndex], array[randomIndex]] = [
            array[randomIndex],
            array[currentIndex],
          ];
        }
        return array;
      };

      // 🚀 FIX: Verificări defensive pentru optimizările cache
      if (!cartiViitor || !cartiViitor.arr || !Array.isArray(cartiViitor.arr)) {
        console.error("❌ [SHUFFLE VIITOR] CartiViitor data invalid:", cartiViitor);
        setLoading(false);
        return;
      }

      // Apelează funcția ajutătoare pentru a amesteca array-ul de cărți
      let shuffledArray = [];
      try {
        shuffledArray = shuffleArray([...cartiViitor.arr]);
      } catch (shuffleError) {
        console.error("❌ [SHUFFLE VIITOR] Error shuffling cards:", shuffleError);
        setLoading(false);
        return;
      }

      // Completează sau taie array-ul pentru a avea exact numărul dorit de cărți
      while (shuffledArray.length < 7) {
        const randomCard =
          shuffledArray[Math.floor(Math.random() * shuffledArray.length)];
        shuffledArray.push({ ...randomCard });
      }
      if (shuffledArray.length > 7) {
        shuffledArray = shuffledArray.slice(0, 7);
      }

      const auth = authentication;
      if (auth.currentUser) {
        console.log("Is user...saving personal reading...");
        const userLocation = `Users/${
          auth.currentUser ? auth.currentUser.uid : ""
        }/FutureReading`;
        handleUploadFirestoreSubcollection(shuffledArray, userLocation);
      }

      // Actualizează state-ul cu noile cărți amestecate
      setShuffledCartiViitor(shuffledArray);
      setLoading(false);

      // Resetare animație pentru a pregăti animația de intrare
      resetExitAnimation();

      // Setează shouldFlip pe true după reîncărcarea cărților
      // setShouldFlip(true);
    }, 3100); // Durata totală a animației de ieșire
  };

  const startExitAnimation = () => {
    console.log("Start Exit Animation");
    setTriggerExitAnimation(true);
  };

  const resetExitAnimation = () => {
    console.log("Reset Exit Animation");
    setTriggerExitAnimation(false);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      console.log("🚀 [NO CACHE] Starting API-only data fetching...");

      // 🎯 API ONLY: Funcție simplă pentru a prelua date doar din API
      const getDataFromAPI = async (category, key) => {
        console.log("🔍 [API ONLY] Fetching:", { category, key });
        try {
          const response = await fetch(`/api/public-tarot-data?category=${category}&key=${key}`);
          const apiData = await response.json();
          
          console.log("✅ [API ONLY] Data fetched successfully:", {
            dataType: typeof apiData,
            hasArr: apiData && apiData.arr,
            arrLength: apiData?.arr?.length
          });
          
          return apiData;
        } catch (apiError) {
          console.error("❌ [API ONLY] Error fetching from API:", apiError);
          return { arr: [] }; // fallback gol
        }
      };

      // Preia toate datele doar din API
      console.log("📚 [API ONLY] Fetching CartiPersonalizate...");
      const cartiPersonalizateData = await getDataFromAPI("Citire-Personalizata", "Carti");
      setCartiPersonalizate(cartiPersonalizateData || { arr: [] });

      console.log("📂 [API ONLY] Fetching CategoriiPersonalizate...");
      const categoriiPersonalizateData = await getDataFromAPI("Citire-Personalizata", "Categorii");
      setCategoriiPersonalizate(categoriiPersonalizateData || { arr: [] });

      console.log("🔮 [API ONLY] Fetching CartiViitor...");
      const cartiViitorData = await getDataFromAPI("Citire-Viitor", "Carti");
      setCartiViitor(cartiViitorData || { arr: [] });

      console.log("🗂️ [API ONLY] Fetching CategoriiViitor...");
      const categoriiViitorData = await getDataFromAPI("Citire-Viitor", "Categorii");
      setCategoriiViitor(categoriiViitorData || { arr: [] });

      // Set empty for unused data
      setVarianteCarti({ arr: [] });

      console.log("🎉 [NO CACHE] All data fetched successfully from API only");
      setLoading(false);
    } catch (err) {
      console.error("❌ [NO CACHE] Error in fetchData:", err);
      setError(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (numereNorocoase.length > 0) {
      setZilnicNumereNorocoase(selecteazaElementZilnic(numereNorocoase));
    }
    if (citateMotivationale.length > 0) {
      setZilnicCitateMotivationale(
        selecteazaElementZilnic(citateMotivationale)
      );
    }
    if (culoriNorocoase.length > 0) {
      setZilnicCuloriNorocoase(selecteazaElementZilnic(culoriNorocoase));
    }
    if (oreNorocoase.length > 0) {
      setZilnicOreNorocoase(selecteazaElementZilnic(oreNorocoase));
    }
  }, [numereNorocoase, citateMotivationale, culoriNorocoase, oreNorocoase]);

  return (
    <ApiDataContext.Provider
      value={{
        cartiPersonalizate,
        categoriiPersonalizate,
        setShuffledCartiPersonalizate,
        shuffledCartiPersonalizate,
        shuffleCartiPersonalizate,
        varianteCarti,
        cartiViitor,
        categoriiViitor,
        citateMotivationale,
        culoriNorocoase,
        numereNorocoase,
        oreNorocoase,
        loading,
        setLoading,
        error,
        setCartiPersonalizate,
        setCategoriiPersonalizate,
        setVarianteCarti,
        setCartiViitor,
        setCategoriiViitor,
        setCitateMotivationale,
        setCuloriNorocoase,
        setNumereNorocoase,
        setOreNorocoase,
        fetchData,
        triggerExitAnimation,
        startExitAnimation,
        resetExitAnimation,
        shuffleCartiViitor,
        shuffledCartiViitor,
        setShuffledCartiViitor,
        zilnicNumereNorocoase,
        zilnicCitateMotivationale,
        zilnicCuloriNorocoase,
        zilnicOreNorocoase,
        reentryAnimation,
        setReentryAnimation,
        setCurrentNumber,
        currentNumber,
        blogData,
      }}
    >
      {children}
    </ApiDataContext.Provider>
  );
};

export default ApiDataProvider;
