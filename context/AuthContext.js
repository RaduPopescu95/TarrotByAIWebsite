import React, { createContext, useContext, useEffect, useState } from "react";
import { authentication } from "../../firebase";
import { handleGetUserInfo } from "../utils/handleFirebaseQuery";
const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null); // Starea pentru datele utilizatorului
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = authentication.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          const userDataFromFirestore = await handleGetUserInfo();
          setUserData(userDataFromFirestore); // Actualizează starea cu datele utilizatorului
        } catch (error) {
          console.error("Failed to fetch user data:", error);
        }
      }
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userData, // Includeți datele utilizatorului în context
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
