"use client";
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { authentication } from "../firebase";
import { handleGetUserInfoJobs } from "../utils/handleFirebaseQuery";
import { signInWithGooglePopupOrRedirect, resolvePendingGoogleRedirectResult, resetGoogleRedirectResultCache } from "../utils/googleAuthWeb";
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
  const [googleRedirectHandled, setGoogleRedirectHandled] = useState(false);
  const [isGuestUser, setIsGuestUser] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState({ day: null, slot: null }); // ziua și slotul curent pentru ștergerea unui slot
  const googleRedirectPendingRef = useRef(typeof window !== "undefined");

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

      resetGoogleRedirectResultCache();
      
      // Sign out from Firebase (if signed in)
      if (authentication.currentUser) {
        const { signOut } = await import("firebase/auth");
        await signOut(authentication);
        console.log("✅ [AUTH] Firebase sign-out successful");
      }
      
      console.log("✅ [AUTH] Cache cleared successfully");
      
    } catch (error) {
      console.error("❌ [AUTH] Error clearing auth cache:", error);
    }
  };

  // 🚀 NEW: Function to detect account switches and handle them
  const handleAccountSwitch = async (newUser) => {
    if (!newUser?.uid) return false;

    const storedUser = localStorage.getItem("currentUser");
    if (!storedUser) return false;

    try {
      const parsedStoredUser = JSON.parse(storedUser);
      if (!parsedStoredUser?.uid || parsedStoredUser.uid === newUser.uid) {
        return false;
      }

      console.log("🔄 [AUTH] Account switch detected – clearing stale cached profile", {
        previous: parsedStoredUser.uid,
        current: newUser.uid,
      });

      localStorage.removeItem("currentUser");
      localStorage.removeItem("userData");
      localStorage.removeItem("isGuestUser");
      setUserData(null);
      setIsGuestUser(false);
      return false;
    } catch (error) {
      console.error("❌ [AUTH] Failed to parse stored user during account switch check:", error);
      localStorage.removeItem("currentUser");
      localStorage.removeItem("userData");
      localStorage.removeItem("isGuestUser");
      return false;
    }
  };

  const clearLoggedOutSession = useCallback((reason = "unknown") => {
    console.log("🔑 [AUTH] Clearing logged-out session", { reason });
    setCurrentUser(null);
    setUserData(null);
    setIsGuestUser(false);
    localStorage.removeItem("currentUser");
    localStorage.removeItem("userData");
    localStorage.removeItem("isGuestUser");
    resetGoogleRedirectResultCache();
    setLoading(false);
  }, []);

  const finalizeGoogleUserSession = useCallback(async (signedUser) => {
    if (!signedUser) return null;

    console.log("✅ [GOOGLE_AUTH] Finalizing Google session", {
      uid: signedUser.uid,
      email: signedUser.email,
      displayName: signedUser.displayName,
    });

    // Firebase Authentication has already succeeded at this point. Publish the
    // authenticated user immediately; profile synchronization is auxiliary and
    // must never turn a valid Google login into a failed login screen.
    setCurrentUser(signedUser);
    setIsGuestUser(false);
    setLoading(false);
    localStorage.setItem("isGuestUser", "false");

    try {
      const syncResult = await upsertGoogleUserProfile(signedUser);
      console.log("✅ [GOOGLE_AUTH] Firestore profile upsert", {
        uid: signedUser.uid,
        created: syncResult.created,
        updatedFields: syncResult.updatedFields,
        role: syncResult.role,
      });
    } catch (syncError) {
      console.error("❌ [GOOGLE_AUTH] Firestore profile upsert failed after successful login", {
        uid: signedUser.uid,
        code: syncError?.code || "unknown_code",
        message: syncError?.message || "unknown_error",
      });
    }

    let profile = null;
    try {
      profile = await handleGetUserInfoJobs();
    } catch (profileError) {
      console.error("❌ [GOOGLE_AUTH] Profile read failed after successful login", {
        uid: signedUser.uid,
        code: profileError?.code || "unknown_code",
        message: profileError?.message || "unknown_error",
      });
    }

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
    return signedUser;
  }, []);

  const finalizeEmailPasswordSession = useCallback(async (signedUser, profileOverride = null) => {
    if (!signedUser) return null;

    if (profileOverride && typeof profileOverride === "object") {
      persistAuthSnapshot(signedUser, profileOverride);
    } else {
      try {
        const profile = await handleGetUserInfoJobs();
        if (profile) {
          persistAuthSnapshot(signedUser, profile);
        } else {
          const { firstName, lastName } = deriveNameParts({
            displayName: signedUser.displayName,
            email: signedUser.email,
          });
          persistAuthSnapshot(signedUser, {
            owner_uid: signedUser.uid,
            first_name: firstName,
            last_name: lastName,
            email: signedUser.email || "",
          });
        }
      } catch (error) {
        console.error("❌ [AUTH] Email/password profile fetch failed", {
          uid: signedUser.uid,
          message: error?.message || "unknown_error",
        });
        const { firstName, lastName } = deriveNameParts({
          displayName: signedUser.displayName,
          email: signedUser.email,
        });
        persistAuthSnapshot(signedUser, {
          owner_uid: signedUser.uid,
          first_name: firstName,
          last_name: lastName,
          email: signedUser.email || "",
        });
      }
    }

    setCurrentUser(signedUser);
    setIsGuestUser(false);
    localStorage.setItem("isGuestUser", "false");
    return signedUser;
  }, []);

  const loginWithGoogle = async ({ returnUrl = "/" } = {}) => {
    setLoading(true);
    try {
      const authResult = await signInWithGooglePopupOrRedirect(authentication, {
        returnUrl,
      });

      if (authResult?.status === "redirecting") {
        return { status: "redirecting" };
      }

      const signedUser = authResult?.user || authentication.currentUser;
      if (signedUser) {
        await finalizeGoogleUserSession(signedUser);
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
    let active = true;

    const bootstrapGoogleRedirect = async () => {
      console.log("🔄 [GOOGLE_AUTH] Bootstrap: resolving pending redirect result");
      try {
        const redirectResult = await resolvePendingGoogleRedirectResult(authentication);
        if (!active) return;

        console.log("🔄 [GOOGLE_AUTH] Bootstrap: redirect resolution finished", {
          status: redirectResult?.status,
          method: redirectResult?.method,
          uid: redirectResult?.user?.uid || null,
          email: redirectResult?.user?.email || null,
        });

        if (redirectResult?.status === "signed_in" && redirectResult.user) {
          await finalizeGoogleUserSession(redirectResult.user);
        } else if (!authentication.currentUser) {
          clearLoggedOutSession("google_redirect_empty");
        }
      } catch (error) {
        console.error("❌ [GOOGLE_AUTH] Redirect bootstrap failed", {
          message: error?.message || "unknown_error",
          code: error?.code || "unknown_code",
        });
        if (active && !authentication.currentUser) {
          clearLoggedOutSession("google_redirect_error");
        }
      } finally {
        googleRedirectPendingRef.current = false;
        if (active) {
          setGoogleRedirectHandled(true);
        }
      }
    };

    bootstrapGoogleRedirect();

    return () => {
      active = false;
    };
  }, [finalizeGoogleUserSession, clearLoggedOutSession]);

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
        await handleAccountSwitch(user);
      }
      
      // Wait for getRedirectResult() before treating null as logged out (redirect race).
      if (!user) {
        await authentication.authStateReady();
        if (authentication.currentUser) {
          return;
        }

        if (googleRedirectPendingRef.current) {
          console.log("🔑 [GOOGLE_AUTH] No user yet — waiting for redirect bootstrap");
          return;
        }

        clearLoggedOutSession("onAuthStateChanged_null");
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
    googleRedirectHandled,
    isGuestUser,
    setAsGuestUser,
    setUserData,
    setCurrentUser,
    setLoading,
    loginWithGoogle,
    finalizeGoogleUserSession,
    finalizeEmailPasswordSession,
    selectedSlot,
    setSelectedSlot,
    clearAuthCache, // 🚀 NEW: Export function to clear auth cache
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
