import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getDatabase } from "firebase-admin/database";
import { getStorage } from "firebase-admin/storage";

function resolveStorageBucket() {
  return (
    process.env.FIREBASE_STORAGE_BUCKET ||
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    (process.env.FIREBASE_PROJECT_ID
      ? `${process.env.FIREBASE_PROJECT_ID}.appspot.com`
      : undefined)
  );
}

function initAdmin() {
  if (getApps().length) return;
  const databaseURL =
    process.env.FIREBASE_DATABASE_URL || process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL;
  const storageBucket = resolveStorageBucket();

  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    }),
    ...(databaseURL ? { databaseURL } : {}),
    ...(storageBucket ? { storageBucket } : {}),
  });
}

export function getAdminAuth() {
  initAdmin();
  return getAuth();
}

export function getAdminDb() {
  initAdmin();
  return getFirestore();
}

export function getAdminRtdb() {
  initAdmin();
  const databaseURL =
    process.env.FIREBASE_DATABASE_URL || process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL;
  if (!databaseURL) {
    throw new Error(
      "Missing Firebase Realtime Database URL. Set FIREBASE_DATABASE_URL or NEXT_PUBLIC_FIREBASE_DATABASE_URL."
    );
  }
  return getDatabase();
}

export function getAdminStorage() {
  initAdmin();
  return getStorage();
}
