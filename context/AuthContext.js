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

  // 🚀 NEW: Function to clear auth cache and force re-authentication
  const clearAuthCache = async () => {
    try {
      console.log("🧹 [AUTH] Clearing authentication cache...");
      
      // Clear localStorage
      localStorage.removeItem("currentUser");
      localStorage.removeItem("userData");
      localStorage.removeItem("isGuestUser");
      localStorage.removeItem("accessCount");
      
      // Clear state
      setCurrentUser(null);
      setUserData(null);
      setIsGuestUser(false);
      
      // Sign out from Firebase (if signed in)
      if (authentication.currentUser) {
        const { signOut } = await import("firebase/auth");
        await signOut(authentication);
        console.log("✅ [AUTH] Firebase sign-out successful");
      }
      
      // 🚀 REMOVED: No more anonymous auth - just clear cache
      console.log("✅ [AUTH] Cache cleared successfully");
      
    } catch (error) {
      console.error("❌ [AUTH] Error clearing auth cache:", error);
    }
  };

  // 🚀 NEW: Function to detect account switches and handle them
  const handleAccountSwitch = async (newUser) => {
    const storedUser = localStorage.getItem("currentUser");
    
    if (storedUser) {
      const parsedStoredUser = JSON.parse(storedUser);
      
      // Check if user has switched accounts
      if (newUser && parsedStoredUser.uid !== newUser.uid) {
        console.log("🔄 [AUTH] Account switch detected!", {
          previous: parsedStoredUser.uid,
          current: newUser.uid
        });
        
        await clearAuthCache();
        return true; // Indicates an account switch occurred
      }
    }
    
    return false;
  };

  useEffect(() => {
    const unsubscribe = authentication.onAuthStateChanged(async (user) => {
      console.log("🔥 [AUTH CONTEXT] onAuthStateChanged triggered:", user ? {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        isAnonymous: user.isAnonymous,
        providerData: user.providerData?.map(p => ({ providerId: p.providerId, email: p.email }))
      } : "NULL USER");
      
      // 🚀 NEW: Check for account switch first
      if (user && !user.isAnonymous) {
        const accountSwitched = await handleAccountSwitch(user);
        if (accountSwitched) {
          console.log("🔄 [AUTH] Account switch handled, returning early");
          setLoading(false);
          return; // onAuthStateChanged will be called again
        }
      }
      
      // 🚀 FIXED: Handle no user properly - set state and complete loading
      if (!user) {
        console.log("🔑 [AUTH CONTEXT] No user found, clearing state");
        console.log("🔑 [AUTH CONTEXT] Setting loading to false");
        setCurrentUser(null);
        setUserData(null);
        setIsGuestUser(false);
        localStorage.removeItem("currentUser");
        localStorage.removeItem("userData");
        localStorage.removeItem("isGuestUser");
        setLoading(false);
        console.log("🔑 [AUTH CONTEXT] State cleared completely");
        return;
      }
      
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
          // 🚀 NEW: Handle permission denied errors
          if (error.message && error.message.includes("Permission denied")) {
            console.log("🚨 [AUTH] Permission denied detected, clearing cache and re-authenticating...");
            await clearAuthCache();
            setLoading(false);
            return;
          }
          
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
        
        // Handle anonymous users (for public data access)
        if (user && user.isAnonymous) {
          console.log("🔑 [AUTH] Anonymous user detected, setting minimal data for public access");
          let anonymousUserData = {
            first_name: "Guest",
            last_name: "User",
            email: "",
            owner_uid: user.uid,
            isAnonymous: true
          };
          setUserData(anonymousUserData);
          localStorage.setItem("currentUser", JSON.stringify(user));
          localStorage.setItem("userData", JSON.stringify(anonymousUserData));
          setCurrentUser(user);
          setLoading(false);
          return;
        }
        
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
      
      console.log("🔑 [AUTH CONTEXT] Setting currentUser:", user ? {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName
      } : "NULL");
      setCurrentUser(user);

      console.log("🔑 [AUTH CONTEXT] Setting loading to false - AUTH COMPLETE");
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
    clearAuthCache, // 🚀 NEW: Export function to clear auth cache
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
