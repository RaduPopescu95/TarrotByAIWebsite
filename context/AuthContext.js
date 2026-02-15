"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { authentication } from "../firebase";
import { handleGetUserInfoJobs } from "../utils/handleFirebaseQuery";
import { signInWithGooglePopupOrRedirect } from "../utils/googleAuthWeb";
import { deriveNameParts, upsertGoogleUserProfile } from "../utils/googleUserProfileSync";

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export { AuthContext };

function isGoogleProviderUser(user) {
  if (!user || !Array.isArray(user.providerData)) return false;
  return user.providerData.some((provider) => provider?.providerId === "google.com");
}

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null); // Inițializare cu null
  const [userData, setUserData] = useState(null); // Inițializare cu null
  const [loading, setLoading] = useState(true);
  const [isGuestUser, setIsGuestUser] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState({ day: null, slot: null }); // ziua și slotul curent pentru ștergerea unui slot

  const persistAuthSnapshot = (user, profile) => {
    if (user) {
      localStorage.setItem("currentUser", JSON.stringify(user));
    } else {
      localStorage.removeItem("currentUser");
    }

    if (profile) {
      setUserData(profile);
      localStorage.setItem("userData", JSON.stringify(profile));
    }
  };

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

  const loginWithGoogle = async ({ returnUrl = "/" } = {}) => {
    setLoading(true);
    try {
      const authResult = await signInWithGooglePopupOrRedirect(authentication);

      if (authResult?.status === "redirecting") {
        return { status: "redirecting" };
      }

      const signedUser = authResult?.user || authentication.currentUser;
      if (signedUser) {
        await upsertGoogleUserProfile(signedUser);
        const profile = await handleGetUserInfoJobs();
        if (profile) {
          persistAuthSnapshot(signedUser, profile);
        } else {
          const { firstName, lastName } = deriveNameParts({
            displayName: signedUser.displayName,
            email: signedUser.email,
          });
          const fallbackProfile = {
            owner_uid: signedUser.uid,
            auth_provider: "Google",
            first_name: firstName,
            last_name: lastName,
            email: signedUser.email || "",
            photoURL: signedUser.photoURL || "",
          };
          persistAuthSnapshot(signedUser, fallbackProfile);
        }
      }

      return { status: "signed_in", returnUrl, user: signedUser || null };
    } catch (error) {
      console.error("❌ [AUTH] Google sign-in failed", {
        message: error?.message || "unknown_error",
        code: error?.code || "unknown_code",
      });
      throw error;
    } finally {
      setLoading(false);
    }
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
      
      if (user && user.isAnonymous) {
        console.log("🔑 [AUTH] Anonymous user detected, setting minimal data for public access");
        let anonymousUserData = {
          first_name: "Guest",
          last_name: "User",
          email: "",
          owner_uid: user.uid,
          isAnonymous: true
        };
        persistAuthSnapshot(user, anonymousUserData);
        setCurrentUser(user);
        setLoading(false);
        return;
      }

      const googleProviderUser = isGoogleProviderUser(user);

      if (googleProviderUser) {
        try {
          const syncResult = await upsertGoogleUserProfile(user);
          console.log("✅ [AUTH] Google profile synced", {
            uid: user.uid,
            created: syncResult.created,
            updatedFields: syncResult.updatedFields,
          });
        } catch (syncError) {
          console.error("❌ [AUTH] Google profile sync failed", {
            uid: user.uid,
            message: syncError?.message || "unknown_error",
          });
        }

        try {
          const userDataFromFirestore = await handleGetUserInfoJobs();
          if (userDataFromFirestore) {
            persistAuthSnapshot(user, userDataFromFirestore);
          } else {
            const { firstName, lastName } = deriveNameParts({
              displayName: user.displayName,
              email: user.email,
            });
            const fallbackGoogleData = {
              owner_uid: user.uid,
              auth_provider: "Google",
              first_name: firstName,
              last_name: lastName,
              email: user.email || "",
              photoURL: user.photoURL || "",
            };
            persistAuthSnapshot(user, fallbackGoogleData);
          }
        } catch (error) {
          console.error("Failed to fetch Google user data:", error);
          const { firstName, lastName } = deriveNameParts({
            displayName: user.displayName,
            email: user.email,
          });
          const fallbackGoogleData = {
            owner_uid: user.uid,
            auth_provider: "Google",
            first_name: firstName,
            last_name: lastName,
            email: user.email || "",
            photoURL: user.photoURL || "",
          };
          persistAuthSnapshot(user, fallbackGoogleData);
        }
      } else {
        try {
          console.log("user....firebase...", user);
          let userDataFromFirestore = await handleGetUserInfoJobs();
          console.log(
            "User data fetched at onAuthStateChanged from handleGetUserInfoJobs...",
            userDataFromFirestore
          );

          if (userDataFromFirestore) {
            persistAuthSnapshot(user, userDataFromFirestore);
          } else {
            const { firstName, lastName } = deriveNameParts({
              displayName: user.displayName,
              email: user.email,
            });
            let basicUserData = {
              first_name: firstName,
              last_name: lastName,
              email: user.email || "",
              owner_uid: user.uid
            };
            persistAuthSnapshot(user, basicUserData);
          }
        } catch (error) {
          console.error("Failed to fetch user data:", error);
          if (error.message && error.message.includes("Permission denied")) {
            console.log("🚨 [AUTH] Permission denied detected, clearing cache and re-authenticating...");
            await clearAuthCache();
            setLoading(false);
            return;
          }

          const { firstName, lastName } = deriveNameParts({
            displayName: user.displayName,
            email: user.email,
          });
          let fallbackUserData = {
            first_name: firstName,
            last_name: lastName,
            email: user.email || "",
            owner_uid: user.uid
          };
          persistAuthSnapshot(user, fallbackUserData);
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
    loginWithGoogle,
    selectedSlot,
    setSelectedSlot,
    clearAuthCache, // 🚀 NEW: Export function to clear auth cache
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
