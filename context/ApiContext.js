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

      // Funcție separată pentru handleGetFirestore

      // setVarianteCarti(await handleGetFirestore("VarianteCarti"));

      // Funcție pentru a obține datele fie din localStorage, fie de la Firebase

      // 🚀 OPTIMIZAT: Cache îmbunătățit cu timestamp și logică mai inteligentă
      
      // Actualizează sau obține contorul de accesări (păstrez sistemul existent)
      let accessCount = parseInt(localStorage.getItem("accessCount") || "0");
      accessCount += 1;
      localStorage.setItem("accessCount", accessCount.toString());

      // OPTIMIZAT: Reduc frecvența refresh-ului de la 100 la 200 pentru mai puține read-uri
      // 🚀 TEMPORARY FIX: Force refresh pentru a repara structura datelor corupte
      const shouldRefreshData = accessCount % 200 === 0 || accessCount <= 10;

      const getDataOrFetch = async (category, key) => {
        console.log("🔍 [CACHE OPTIMIZED] Start fetch from firebase real time or localstorage");
        const storageKey = `${category}-${key}`;
        const timestampKey = `${storageKey}_timestamp`;
        
        console.log("🎯 [CACHE DEBUG] Requesting:", { category, key, storageKey, shouldRefreshData, accessCount });
        
        // 🚀 TEMPORARY FIX: Disable cache for tarot reading data to debug corruption issues
        const isCardReadingData = (
          category === "Citire-Personalizata" || 
          category === "Citire-Viitor"
        );
        
        if (isCardReadingData) {
          console.log("🚫 [CACHE DISABLED] Forcing fresh fetch for card reading data:", { category, key });
          try {
            console.log("🔥 [CACHE DISABLED] Fetching FRESH from Firebase (no cache)");
            const data = await getData(category, key);
            
            console.log("🎉 [CACHE DISABLED] Fresh data structure:", {
              dataType: typeof data,
              isArray: Array.isArray(data),
              hasArr: data && data.arr,
              arrLength: data?.arr?.length,
              dataStructure: data,
              firstElement: data?.arr?.[0]
            });
            
            // 🚀 CHECK: If Firebase returns empty data, try API fallback
            if (!data?.arr || data.arr.length === 0) {
              console.log("⚠️ [EMPTY DATA] Firebase returned empty data, trying API fallback...");
              
              try {
                const response = await fetch(`/api/public-tarot-data?category=${category}&key=${key}`);
                const apiData = await response.json();
                
                console.log("🎉 [FALLBACK] API data fetched successfully:", {
                  dataType: typeof apiData,
                  hasArr: apiData && apiData.arr,
                  arrLength: apiData?.arr?.length,
                  firstElement: apiData?.arr?.[0]
                });
                
                if (apiData?.arr && apiData.arr.length > 0) {
                  return apiData;
                } else {
                  console.log("⚠️ [FALLBACK] API also returned empty data");
                }
              } catch (apiError) {
                console.error("❌ [FALLBACK] API fallback failed:", apiError);
              }
            }
            
            return data;
          } catch (firebaseError) {
            console.error("❌ [CACHE DISABLED] Error fetching fresh data:", firebaseError);
            console.log("🔄 [FALLBACK] Firebase error - trying API endpoint for public data...");
            
            try {
              const response = await fetch(`/api/public-tarot-data?category=${category}&key=${key}`);
              const apiData = await response.json();
              
              console.log("🎉 [FALLBACK] API data fetched successfully:", {
                dataType: typeof apiData,
                hasArr: apiData && apiData.arr,
                arrLength: apiData?.arr?.length,
                firstElement: apiData?.arr?.[0]
              });
              
              return apiData;
            } catch (apiError) {
              console.error("❌ [FALLBACK] API fallback also failed:", apiError);
              return { arr: [] }; // final fallback
            }
          }
        }
        
        // Regular cache logic for other data
        // Verifică dacă există date în cache
        const cachedData = localStorage.getItem(storageKey);
        const cacheTimestamp = localStorage.getItem(timestampKey);
        
        console.log("💾 [CACHE DEBUG] Cache status:", { 
          hasCachedData: !!cachedData, 
          cacheDataLength: cachedData?.length || 0,
          cacheTimestamp,
          rawCachePreview: cachedData ? cachedData.substring(0, 100) + "..." : "none"
        });
        
        // OPTIMIZAT: Cache cu timestamp - datele expiră după 24 de ore
        const CACHE_EXPIRY_HOURS = 24;
        const CACHE_EXPIRY_MS = CACHE_EXPIRY_HOURS * 60 * 60 * 1000;
        const now = Date.now();
        
        // Verifică dacă cache-ul este fresh
        const isCacheFresh = cacheTimestamp && 
                            (now - parseInt(cacheTimestamp)) < CACHE_EXPIRY_MS;

        if (cachedData && !shouldRefreshData && isCacheFresh) {
          console.log(
            "🗂️ [CACHE OPTIMIZED] Fetching from localStorage - cache is fresh",
            shouldRefreshData
          );
          console.log("📊 [CACHE OPTIMIZED] Enter count:", accessCount);
          console.log("⏰ [CACHE OPTIMIZED] Cache age:", Math.round((now - parseInt(cacheTimestamp)) / (60 * 60 * 1000)), "hours");
          console.log("✅ [CACHE OPTIMIZED] Fetching from --------localstorage--------");
          
          try {
            const parsedCacheData = JSON.parse(cachedData); // Datele sunt în localStorage
            console.log("✅ [CACHE DEBUG] Successfully parsed cached data:", {
              dataType: typeof parsedCacheData,
              isArray: Array.isArray(parsedCacheData),
              hasArr: parsedCacheData && parsedCacheData.arr,
              arrLength: parsedCacheData?.arr?.length,
              dataStructure: parsedCacheData
            });
            return parsedCacheData;
          } catch (parseError) {
            console.error("❌ [CACHE OPTIMIZED] Error parsing cached data, will fetch fresh:", parseError);
            // Continuă să preia date fresh dacă parse-ul eșuează
          }
        }
        
        // Motivele pentru care se preiau date fresh
        if (!cachedData) {
          console.log("📭 [CACHE OPTIMIZED] No cached data found");
        }
        if (shouldRefreshData) {
          console.log("🔄 [CACHE OPTIMIZED] Scheduled refresh due to access count");
        }
        if (!isCacheFresh) {
          console.log("⏰ [CACHE OPTIMIZED] Cache expired, fetching fresh data");
        }

        try {
          console.log("🔥 [CACHE OPTIMIZED] Fetching from !!!!!!!Firebase!!!!!!!!!!");
          const data = await getData(category, key); // Datele sunt preluate de la Firebase
          
          console.log("🎉 [CACHE DEBUG] Fresh data fetched from Firebase:", {
            dataType: typeof data,
            isArray: Array.isArray(data),
            hasArr: data && data.arr,
            arrLength: data?.arr?.length,
            dataStructure: data
          });
          
          // Salvează datele și timestamp-ul
          localStorage.setItem(storageKey, JSON.stringify(data));
          localStorage.setItem(timestampKey, now.toString());
          console.log("💾 [CACHE OPTIMIZED] Data cached successfully with timestamp");
          
          return data;
        } catch (firebaseError) {
          console.error("❌ [CACHE OPTIMIZED] Error fetching from Firebase:", firebaseError);
          
          // FALLBACK: Folosește datele cached chiar dacă sunt expirate
          if (cachedData) {
            console.log("🔄 [CACHE OPTIMIZED] Using expired cache as fallback");
            try {
              return JSON.parse(cachedData);
            } catch (fallbackParseError) {
              console.error("❌ [CACHE OPTIMIZED] Even fallback cache is corrupted:", fallbackParseError);
            }
          }
          
          // FALLBACK FINAL: Returnează date goale pentru a evita crash-ul aplicației
          console.log("🆘 [CACHE OPTIMIZED] Returning empty fallback data");
          return { arr: [] };
        }
      };

      // 🚀 TEMPORARY FIX: Clear corrupted cache for card reading data
      console.log("🧹 [CACHE CLEANUP] Clearing corrupted card reading cache...");
      const cardReadingKeys = [
        "Citire-Personalizata-Carti",
        "Citire-Personalizata-Categorii", 
        "Citire-Viitor-Carti",
        "Citire-Viitor-Categorii",
        "Citire-Personalizata-Carti_timestamp",
        "Citire-Personalizata-Categorii_timestamp",
        "Citire-Viitor-Carti_timestamp", 
        "Citire-Viitor-Categorii_timestamp"
      ];
      
      cardReadingKeys.forEach(key => {
        const existed = localStorage.getItem(key);
        if (existed) {
          localStorage.removeItem(key);
          console.log("🗑️ [CACHE CLEANUP] Removed corrupted cache:", key);
        }
      });

      // Preia datele din fiecare categorie si le salveaza in state
      console.log("🔥 [API CONTEXT] Starting data fetching...");

      const cartiPersonalizateData = await getDataOrFetch("Citire-Personalizata", "Carti");
      console.log("📚 [API CONTEXT] CartiPersonalizate fetched:", cartiPersonalizateData);
      console.log("📚 [API CONTEXT] CartiPersonalizate DETAILED:", {
        data: cartiPersonalizateData,
        type: typeof cartiPersonalizateData,
        isArray: Array.isArray(cartiPersonalizateData),
        hasArr: cartiPersonalizateData && cartiPersonalizateData.arr,
        arrLength: cartiPersonalizateData?.arr?.length,
        keys: cartiPersonalizateData ? Object.keys(cartiPersonalizateData) : 'none',
        firstElement: cartiPersonalizateData?.arr?.[0]
      });
      // 🚀 FIX: Ensure correct structure is set
      if (cartiPersonalizateData && !cartiPersonalizateData.arr) {
        console.warn("⚠️ [API CONTEXT] CartiPersonalizate missing .arr property, wrapping data");
        setCartiPersonalizate({ arr: Array.isArray(cartiPersonalizateData) ? cartiPersonalizateData : [] });
      } else {
        setCartiPersonalizate(cartiPersonalizateData || { arr: [] });
      }

      const categoriiPersonalizateData = await getDataOrFetch("Citire-Personalizata", "Categorii");
      console.log("📂 [API CONTEXT] CategoriiPersonalizate fetched:", categoriiPersonalizateData);
      // 🚀 FIX: Ensure correct structure is set
      if (categoriiPersonalizateData && !categoriiPersonalizateData.arr) {
        console.warn("⚠️ [API CONTEXT] CategoriiPersonalizate missing .arr property, wrapping data");
        setCategoriiPersonalizate({ arr: Array.isArray(categoriiPersonalizateData) ? categoriiPersonalizateData : [] });
      } else {
        setCategoriiPersonalizate(categoriiPersonalizateData || { arr: [] });
      }

      const cartiViitorData = await getDataOrFetch("Citire-Viitor", "Carti");
      console.log("🔮 [API CONTEXT] CartiViitor fetched:", cartiViitorData);
      // 🚀 FIX: Ensure correct structure is set
      if (cartiViitorData && !cartiViitorData.arr) {
        console.warn("⚠️ [API CONTEXT] CartiViitor missing .arr property, wrapping data");
        setCartiViitor({ arr: Array.isArray(cartiViitorData) ? cartiViitorData : [] });
      } else {
        setCartiViitor(cartiViitorData || { arr: [] });
      }

      const categoriiViitorData = await getDataOrFetch("Citire-Viitor", "Categorii");
      console.log("🗂️ [API CONTEXT] CategoriiViitor fetched:", categoriiViitorData);
      // 🚀 FIX: Ensure correct structure is set
      if (categoriiViitorData && !categoriiViitorData.arr) {
        console.warn("⚠️ [API CONTEXT] CategoriiViitor missing .arr property, wrapping data");
        setCategoriiViitor({ arr: Array.isArray(categoriiViitorData) ? categoriiViitorData : [] });
      } else {
        setCategoriiViitor(categoriiViitorData || { arr: [] });
      }
      // setBlogData(await handleGetFirestore("BlogArticole"));

      // setCitateMotivationale(
      //   await getDataOrFetch("Others", "Citate-Motivationale")
      // );
      // setCuloriNorocoase(await getDataOrFetch("Others", "Culori-Norocoase"));
      // setNumereNorocoase(await getDataOrFetch("Others", "Numere-Norocoase"));
      // setOreNorocoase(await getDataOrFetch("Others", "Ore-Norocoase"));

      setLoading(false);
    } catch (err) {
      console.error(err);
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
