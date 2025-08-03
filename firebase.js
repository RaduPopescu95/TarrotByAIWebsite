// Client-side only Firebase initialization
let storage, authentication, database, db, functions;

if (typeof window !== 'undefined') {
  // Doar pe client-side
  const { initializeApp } = require("firebase/app");
  const { getAuth } = require("firebase/auth");
  const { getDatabase } = require("firebase/database");
  const { getFirestore } = require("firebase/firestore");
  const { getStorage } = require("firebase/storage");
  const { getFunctions } = require("firebase/functions");

  // Your Firebase configuration
  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);

  // Initialize other Firebase services
  storage = getStorage(app);
  authentication = getAuth(app);
  database = getDatabase(app);
  db = getFirestore(app);
  functions = getFunctions(app);
} else {
  // Pe server-side, returnează mock objects
  storage = null;
  authentication = null;
  database = null;
  db = null;
  functions = null;
}

export { storage, authentication, database, db, functions };
