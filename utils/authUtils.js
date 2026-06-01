import {
  EmailAuthProvider,
  FacebookAuthProvider,
  GoogleAuthProvider,
  deleteUser,
  reauthenticateWithCredential,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateEmail,
  updatePassword,
  verifyBeforeUpdateEmail,
} from "firebase/auth";

import { authentication } from "../firebase";
import { FirebaseError } from "firebase/app";

import { deleteUserData } from "./deleteFirebaseData";
import { emailWithoutSpace } from "./strintText";

// 🚀 Authentication utilities for handling account switches and permission errors

/**
 * Detects if user has switched Google accounts by comparing stored UID with current UID
 * @param {Object} currentUser - Current Firebase user object
 * @returns {boolean} - True if account switch detected
 */
export const detectAccountSwitch = (currentUser) => {
  if (!currentUser) return false;
  
  const storedUser = localStorage.getItem("currentUser");
  if (!storedUser) return false;
  
  try {
    const parsedStoredUser = JSON.parse(storedUser);
    if (parsedStoredUser.uid !== currentUser.uid) {
      console.log("🔄 [AUTH UTILS] Account switch detected!", {
        previous: parsedStoredUser.uid,
        current: currentUser.uid,
        previousEmail: parsedStoredUser.email,
        currentEmail: currentUser.email
      });
      return true;
    }
  } catch (error) {
    console.error("❌ [AUTH UTILS] Error parsing stored user:", error);
    return true; // Treat as account switch to force refresh
  }
  
  return false;
};

/**
 * Clears all authentication and application cache
 */
export const clearAllCache = async () => {
  console.log("🧹 [AUTH UTILS] Clearing all cache...");
  
  try {
    // Clear localStorage
    const keysToRemove = [
      "currentUser",
      "userData", 
      "isGuestUser",
      "accessCount",
      "hasSeenLanguageDialog",
      "selectedLanguage"
    ];
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });
    
    // Clear all cache data with pattern matching
    Object.keys(localStorage).forEach(key => {
      if (key.includes("Citire-") || key.includes("_timestamp") || key.includes("Others-")) {
        localStorage.removeItem(key);
      }
    });
    
    console.log("✅ [AUTH UTILS] localStorage cleared");
    
    // Clear sessionStorage as well
    sessionStorage.clear();
    console.log("✅ [AUTH UTILS] sessionStorage cleared");
    
  } catch (error) {
    console.error("❌ [AUTH UTILS] Error clearing cache:", error);
  }
};

/**
 * Forces clearing of authentication without re-authentication
 */
export const forceAnonymousAuth = async () => {
  try {
    console.log("🔑 [AUTH UTILS] Clearing authentication...");
    
    // Sign out current user if exists
    if (authentication.currentUser) {
      await signOut(authentication);
      console.log("✅ [AUTH UTILS] Previous user signed out");
    }
    
    // 🚀 REMOVED: No anonymous auth due to admin restrictions
    console.log("✅ [AUTH UTILS] Authentication cleared");
    
    return null; // No user
  } catch (error) {
    console.error("❌ [AUTH UTILS] Error clearing authentication:", error);
    throw error;
  }
};

/**
 * Handles complete account switch recovery
 */
export const handleAccountSwitchRecovery = async () => {
  console.log("🔄 [AUTH UTILS] Starting account switch recovery...");
  
  try {
    // Step 1: Clear all cache
    await clearAllCache();
    
    // Step 2: Clear authentication (no anonymous auth)
    await forceAnonymousAuth();
    
    // Step 3: Force page reload to reinitialize everything
    console.log("🔄 [AUTH UTILS] Reloading page to complete recovery...");
    window.location.reload();
    
  } catch (error) {
    console.error("❌ [AUTH UTILS] Account switch recovery failed:", error);
    // Force reload anyway as last resort
    window.location.reload();
  }
};

/**
 * Checks if error is permission denied and handles it
 * @param {Error} error - The error to check
 * @returns {boolean} - True if permission denied error was handled
 */
export const handlePermissionDeniedError = async (error) => {
  if (error && error.message && error.message.includes("Permission denied")) {
    console.log("🚨 [AUTH UTILS] Permission denied detected, initiating recovery...");
    await handleAccountSwitchRecovery();
    return true;
  }
  return false;
};

/**
 * Monitors for account switches and automatically handles them
 */
export const initAccountSwitchMonitor = () => {
  if (typeof window === "undefined") return; // Server-side guard
  
  console.log("👀 [AUTH UTILS] Initializing account switch monitor...");
  
  // Monitor storage events (when user changes account in another tab)
  window.addEventListener("storage", (event) => {
    if (event.key === "currentUser" && event.newValue !== event.oldValue) {
      console.log("🔄 [AUTH UTILS] Account change detected via storage event");
      handleAccountSwitchRecovery();
    }
  });

  console.log("✅ [AUTH UTILS] Account switch monitor initialized");
};

const auth = authentication;

export const handleChangeEmail = async (currentPassword, newEmail) => {
  try {
    const user = auth.currentUser;
    const credential = EmailAuthProvider.credential(
      user.email,
      currentPassword
    );
    console.log("user...", user);
    // Încercăm reautentificarea
    await reauthenticateWithCredential(user, credential);
    console.log("Reautentificare reușită.");

    // Dacă reautentificarea a reușit, încercăm să actualizăm emailul
    try {
      await verifyBeforeUpdateEmail(user, newEmail);
      console.log("Actualizarea emailului reușită.");
      return ""; // Returnăm un șir gol pentru a indica succesul
    } catch (error) {
      // Prindem orice eroare care apare la actualizarea emailului
      console.error("Eroare la actualizarea emailului:", error);
      return handleFirebaseAuthError(error); // Returnăm mesajul de eroare
    }
  } catch (error) {
    // Prindem orice eroare care apare la reautentificare
    console.error("Eroare la reautentificare:", error);
    return handleFirebaseAuthError(error); // Returnăm mesajul de eroare
  }
};

export const handleChangePassword = async (currentPassword, newPassword) => {
  console.log("change passowrd...");
  try {
    const user = auth.currentUser;
    const credential = EmailAuthProvider.credential(
      user.email,
      currentPassword
    );
    await reauthenticateWithCredential(user, credential)
      .then(async () => {
        await updatePassword(user, newPassword)
          .then(() => {
            console.log("password succesfuly changed");
          })
          .catch((error) => {
            console.log("password error changed", error);
          });
      })
      .catch((err) => {
        if (err.code == "auth/wrong-password") {
        } else if (err.code == "auth/too-many-requests") {
        }
      });
  } catch (err) {
    console.log("error on handlechange pass", err);
  }
};

export const handleLogout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error(error);
    Alert.alert("Error", "Failed to log out.");
  }
};

export const handleDeleteAccount = async (currentPassword) => {
  try {
    const auth = authentication;
    const credential = EmailAuthProvider.credential(
      auth.currentUser.email,
      currentPassword
    );
    console.log("-------test----");
    const result = await reauthenticateWithCredential(
      auth.currentUser,
      credential
    );

    await deleteUser(result.user).then(() => {
      console.log("deleted successfuly...auth account");
    });
  } catch (error) {
    console.error("error delete user auth or firestore...", error);
  }
};

export const handleResetPassword = async (email) => {
  const user = auth.currentUser;
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    console.error(error);
  }
};

// firebaseErrors.js

// handleFirebaseAuthError.js
export const handleFirebaseAuthError = (error) => {
  let message = "";
  console.log("test...", error.code);
  switch (error.code) {
    case "auth/invalid-email":
      message = "firebaseErrorInvalidEmail";
      break;
    case "auth/email-already-in-use":
      message = "firebaseErrorEmailAlreadyInUse";
      break;
    case "auth/weak-password":
      message = "firebaseErrorWeakPassword";
      break;
    case "auth/user-not-found":
      message = "firebaseErrorUserNotFound";
      break;
    case "auth/user-disabled":
      message = "firebaseErrorUserDisabled";
      break;
    case "auth/wrong-password":
      message = "firebaseErrorWrongPassword";
      break;
    case "auth/too-many-requests":
      message = "firebaseErrorTooManyRequests";
      break;
    case "auth/operation-not-allowed":
      message = "firebaseErrorOperationNotAllowed";
      break;
    case "auth/network-request-failed":
      message = "firebaseErrorNetworkRequestFailed";
      break;
    case "auth/invalid-credential":
      message = "firebaseErrorInvalidCredentials";
      break;
    default:
      message = "firebaseErrorUnknown";
  }
  return message;
};

// HANLDE SIGN IN AND RETURN INFOR
export const handleSignIn = async (email, password) => {
  const emailNew = emailWithoutSpace(email);

  try {
    const userCredentials = await signInWithEmailAndPassword(
      authentication,
      emailNew,
      password
    );
    console.log("userCredentials...", userCredentials.user.uid);
    return userCredentials; // Returnează userCredentials pentru succes
  } catch (error) {
    console.log("error on sign in user...message...", error.message);
    console.log("error on sign in user...code...", error.code);
    throw error; // Propagă eroarea mai departe
  }
};

// Autentificare cu Google
export const handleGoogleSignIn = async () => {
  const provider = new GoogleAuthProvider();
  
  try {
    const result = await signInWithPopup(auth, provider);
    console.log("rezultate la google sign in...", result)
    return result; // Returnează credențialele utilizatorului dacă autentificarea are succes
  } catch (error) {
    console.error("Error during Google sign in:", error.message); // Afișează eroarea în consolă
    throw new Error("Autentificarea cu Google a eșuat: " + error.message); // Returnează eroarea pentru a fi gestionată în componenta apelantă
  }
};

// Autentificare cu Facebook
export const handleFacebookSignIn = async () => {
  const provider = new FacebookAuthProvider();
  
  // Adaugă permisiunea 'email' explicit
  provider.addScope('email');
  
  try {
    const result = await signInWithPopup(auth, provider);
    console.log("Rezultate la Facebook sign in...", result);
    return result; // Returnează credențialele utilizatorului dacă autentificarea are succes
  } catch (error) {
    console.error("Error during Facebook sign in:", error.message); // Afișează eroarea în consolă
    throw new Error("Autentificarea cu Facebook a eșuat: " + error.message); // Returnează eroarea pentru a fi gestionată în componenta apelantă
  }
};