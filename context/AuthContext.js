import React, { createContext, useContext, useEffect, useState } from "react";
import { authentication } from "../firebase";
import { handleGetUserInfo } from "../utils/handleFirebaseQuery";

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isGuestUser, setIsGuestUser] = useState(false); // Inițializat ca false

  useEffect(() => {
    // Verificăm dacă suntem pe partea de client (browser)
    if (typeof window !== "undefined") {
      const storedUser = localStorage.getItem("currentUser");
      const storedUserData = localStorage.getItem("userData");
      const storedGuestUser = localStorage.getItem("isGuestUser");

      // Inițializăm stările cu valorile din localStorage (dacă există)
      setCurrentUser(storedUser ? JSON.parse(storedUser) : null);
      setUserData(storedUserData ? JSON.parse(storedUserData) : null);
      setIsGuestUser(storedGuestUser === "true");
    }
  }, []);

  // Funcția pentru a seta utilizatorul ca guest user
  const setAsGuestUser = (isGuest) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("isGuestUser", isGuest ? "true" : "false");
    }
    setIsGuestUser(isGuest);
  };

  useEffect(() => {
    if (currentUser && typeof window !== "undefined") {
      localStorage.setItem("currentUser", JSON.stringify(currentUser));
    }
  }, [currentUser]);

  useEffect(() => {
    if (userData && typeof window !== "undefined") {
      localStorage.setItem("userData", JSON.stringify(userData));
    }
  }, [userData]);

  const value = {
    currentUser,
    userData,
    loading,
    isGuestUser,
    setAsGuestUser,
    setUserData,
    setCurrentUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
