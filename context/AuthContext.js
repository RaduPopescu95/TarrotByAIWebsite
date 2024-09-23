"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { authentication, db } from "../firebase";
import {
  handleGetUserInfo,
  handleGetUserInfoJobs,
} from "../utils/handleFirebaseQuery";
import { handleGetFirestore } from "@/utils/firestoreUtils";
import { doc, setDoc } from "firebase/firestore";

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null); // Inițializare cu null
  const [userData, setUserData] = useState(null); // Inițializare cu null
  const [loading, setLoading] = useState(true);
  const [isGuestUser, setIsGuestUser] = useState(false);

  // Acces la localStorage doar pe client
  useEffect(() => {
    const storedCurrentUser = localStorage.getItem("currentUser");
    const storedUserData = localStorage.getItem("userData");
    const storedIsGuestUser = localStorage.getItem("isGuestUser");

    if (storedCurrentUser) {
      setCurrentUser(JSON.parse(storedCurrentUser));
    }

    if (storedUserData) {
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
      if (user) {
        try {
          let userDataFromFirestore = await handleGetUserInfoJobs();
          console.log(
            "User data fetched at onAuthStateChanged from handleGetUserInfoJobs...",
            userDataFromFirestore
          );

          if (!userDataFromFirestore) {
            console.log(
              "No data found in handleGetUserInfoJobs, trying handleGetUsersInfo..."
            );
            userDataFromFirestore = await handleGetUserInfo();
          }

          setUserData(userDataFromFirestore);
        } catch (error) {
          console.error("Failed to fetch user data:", error);
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
    setLoading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
