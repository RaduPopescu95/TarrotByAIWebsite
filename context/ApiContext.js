import React, { createContext, useState, useContext, useEffect } from "react";
import firebase from "firebase/app";

import { getData } from "../utils/realtimeUtils";
import {
  handleGetFirestore,
  handleUploadFirestore,
  handleUploadFirestoreSubcollection,
} from "../utils/firestoreUtils";
import { authentication } from "../firebase";

const ApiDataContext = createContext();

export const useApiData = () => useContext(ApiDataContext);

export const ApiDataProvider = ({ children }) => {
  const [cartiPersonalizate, setCartiPersonalizate] = useState([]);
  const [categoriiPersonalizate, setCategoriiPersonalizate] = useState([]);
  const [shuffledCartiPersonalizate, setShuffledCartiPersonalizate] = useState(
    []
  );
  const [varianteCarti, setVarianteCarti] = useState([]);
  const [cartiViitor, setCartiViitor] = useState([]);
  const [shuffledCartiViitor, setShuffledCartiViitor] = useState([]);
  const [categoriiViitor, setCategoriiViitor] = useState([]);
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

        // Apelează funcția ajutătoare pentru a amesteca array-ul de cărți
        let shuffledArray = shuffleArray([...cartiPersonalizate.arr]);

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

      // Apelează funcția ajutătoare pentru a amesteca array-ul de cărți
      let shuffledArray = shuffleArray([...cartiViitor.arr]);

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

      // Actualizează sau obține contorul de accesări
      let accessCount = parseInt(localStorage.getItem("accessCount") || "0");
      accessCount += 1;
      localStorage.setItem("accessCount", accessCount.toString());

      // Verifică dacă trebuie să actualizezi datele (la a 7-a accesare)
      const shouldRefreshData = accessCount % 50 === 0;

      const getDataOrFetch = async (category, key) => {
        console.log("Start fetch from firebase real time or localstorage");
        const storageKey = `${category}-${key}`;
        const cachedData = localStorage.getItem(storageKey);

        if (cachedData && !shouldRefreshData) {
          console.log(
            "fetching because is the 10th enter.....",
            shouldRefreshData
          );
          console.log("Enter count is...........", accessCount);
          console.log("Fetching from --------localstorage--------");
          return JSON.parse(cachedData); // Datele sunt în localStorage
        } else {
          console.log("Fetching from !!!!!!!Firebase!!!!!!!!!!");
          const data = await getData(category, key); // Datele sunt preluate de la Firebase
          localStorage.setItem(storageKey, JSON.stringify(data));
          return data;
        }
      };

      // Preia datele din fiecare categorie si le salveaza in state

      setCartiPersonalizate(
        await getDataOrFetch("Citire-Personalizata", "Carti")
      );
      setCategoriiPersonalizate(
        await getDataOrFetch("Citire-Personalizata", "Categorii")
      );
      setCartiViitor(await getDataOrFetch("Citire-Viitor", "Carti"));
      setCategoriiViitor(await getDataOrFetch("Citire-Viitor", "Categorii"));
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
      }}
    >
      {children}
    </ApiDataContext.Provider>
  );
};

export default ApiDataProvider;
