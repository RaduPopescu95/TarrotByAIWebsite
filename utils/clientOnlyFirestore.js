// Client-only wrapper pentru Firebase Firestore operations
// Previne erorile de ES6 imports în SSR

import { useState, useEffect } from 'react';

let firestoreUtils = null;

// Încarcă Firebase utils doar pe client-side
export const getFirestoreUtils = async () => {
  if (typeof window === 'undefined') {
    // Dacă suntem pe server (SSR), returnează funcții mock
    return {
      handleQueryFirestore: async () => null,
      handleUpdateFirestore: async () => null,
      handleAddFirestore: async () => null,
      handleDeleteFirestore: async () => null,
    };
  }

  // Pe client-side, încarcă modulul real
  if (!firestoreUtils) {
    firestoreUtils = await import('./firestoreUtils');
  }
  
  return firestoreUtils;
};

// Helper function pentru Firebase queries cu SSR safety
export const safeHandleQueryFirestore = async (collection, field, value) => {
  if (typeof window === 'undefined') {
    console.log('SSR: Firebase query skipped for', collection);
    return null;
  }

  try {
    const { handleQueryFirestore } = await getFirestoreUtils();
    return await handleQueryFirestore(collection, field, value);
  } catch (error) {
    console.error('Error in safeHandleQueryFirestore:', error);
    return null;
  }
};

// Hook pentru Firebase operations în React components
export const useFirestoreUtils = () => {
  const [firestoreOps, setFirestoreOps] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFirestore = async () => {
      if (typeof window !== 'undefined') {
        try {
          const utils = await getFirestoreUtils();
          setFirestoreOps(utils);
        } catch (error) {
          console.error('Failed to load Firestore utils:', error);
        }
      }
      setLoading(false);
    };

    loadFirestore();
  }, []);

  return { firestoreOps, loading };
}; 