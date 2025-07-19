"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { authentication, db } from "../firebase";
import {
  handleGetUserInfo,
  handleGetUserInfoJobs,
} from "../utils/handleFirebaseQuery";
import { handleGetFirestore } from "../utils/firestoreUtils";
import { doc, setDoc } from "firebase/firestore";

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export { AuthContext };

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null); // Inițializare cu null
  const [userData, setUserData] = useState(null); // Inițializare cu null
  const [loading, setLoading] = useState(true);
  const [isGuestUser, setIsGuestUser] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState({ day: null, slot: null }); // ziua și slotul curent pentru ștergerea unui slot

  // Acces la localStorage doar pe client
  useEffect(() => {
    const storedCurrentUser = localStorage.getItem("currentUser");
    const storedUserData = localStorage.getItem("userData");
    const storedIsGuestUser = localStorage.getItem("isGuestUser");

    if (storedCurrentUser) {
      setCurrentUser(JSON.parse(storedCurrentUser));
    }

    if (storedUserData && storedUserData !== "undefined") {
      setUserData(JSON.parse(storedUserData));
    }

    if (storedIsGuestUser) {
      setIsGuestUser(storedIsGuestUser === "true");
    }
  }, []);

  const setAsGuestUser = (isGuest) => {
    try {
      localStorage.setItem("isGuestUser", isGuest ? "true" : "false");
      setIsGuestUser(isGuest);
    } catch (e) {
      console.error("Failed to update isGuestUser in localStorage:", e);
    }
  };

  useEffect(() => {
    const unsubscribe = authentication.onAuthStateChanged(async (user) => {
      console.log("start use effect from auth context", user);
      if (user && user.providerData[0]?.providerId !== "google.com") {
        try {
          console.log("user....firebase...", user);
          let userDataFromFirestore = await handleGetUserInfoJobs();
          console.log(
            "User data fetched at onAuthStateChanged from handleGetUserInfoJobs...",
            userDataFromFirestore
          );

          // Handle null/undefined userData properly
          if (userDataFromFirestore) {
            setUserData(userDataFromFirestore);
            localStorage.setItem("currentUser", JSON.stringify(user));
            localStorage.setItem("userData", JSON.stringify(userDataFromFirestore));
          } else {
            console.log("No user data found in Firestore, user might not have a profile yet");
            // Set basic user data from Firebase Auth
            let basicUserData = {
              first_name: user.displayName || "",
              last_name: "",
              email: user.email || "",
              owner_uid: user.uid
            };
            setUserData(basicUserData);
            localStorage.setItem("currentUser", JSON.stringify(user));
            localStorage.setItem("userData", JSON.stringify(basicUserData));
          }
        } catch (error) {
          console.error("Failed to fetch user data:", error);
          // Set fallback user data in case of error
          let fallbackUserData = {
            first_name: user.displayName || "",
            last_name: "",
            email: user.email || "",
            owner_uid: user.uid
          };
          setUserData(fallbackUserData);
          localStorage.setItem("currentUser", JSON.stringify(user));
          localStorage.setItem("userData", JSON.stringify(fallbackUserData));
        }
      } else {
        console.log("user....other...", user);
        if (user?.displayName) {
          let first_name = user.displayName;
          let last_name = "";
          let email = user.email;
          let owner_uid = user.uid;
          let data = { first_name, last_name, email, owner_uid };
          setUserData(data);
          localStorage.setItem("currentUser", JSON.stringify(user));
          localStorage.setItem("userData", JSON.stringify(data));
        } else if (user) {
          // Handle case where user exists but has no displayName
          let basicData = {
            first_name: "",
            last_name: "",
            email: user.email || "",
            owner_uid: user.uid
          };
          setUserData(basicData);
          localStorage.setItem("currentUser", JSON.stringify(user));
          localStorage.setItem("userData", JSON.stringify(basicData));
        }
      }
      setCurrentUser(user);

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Salvarea userData în localStorage
  useEffect(() => {
    if (userData) {
      localStorage.setItem("userData", JSON.stringify(userData));
    } else {
      localStorage.removeItem("userData");
    }
  }, [userData]);

  // Salvarea currentUser în localStorage
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem("currentUser", JSON.stringify(currentUser));
    } else {
      localStorage.removeItem("currentUser");
    }
  }, [currentUser]);

  const value = {
    currentUser,
    userData,
    loading,
    isGuestUser,
    setAsGuestUser,
    setUserData,
    setCurrentUser,
    setLoading,
    selectedSlot,
    setSelectedSlot,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
