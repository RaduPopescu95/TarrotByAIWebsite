#!/usr/bin/env node

require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

const { initializeApp, getApps, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

const execute = process.argv.includes("--execute");
const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
const collections = ["FirestoreReadTelemetryDaily", "ReadTelemetryDaily"];

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

async function cleanupCollection(db, collectionName) {
  let total = 0;
  while (true) {
    const snapshot = await db
      .collection(collectionName)
      .where("date", "<", cutoff)
      .limit(400)
      .get();
    if (snapshot.empty) break;
    total += snapshot.size;
    if (!execute) break;
    const batch = db.batch();
    snapshot.docs.forEach((docSnap) => batch.delete(docSnap.ref));
    await batch.commit();
  }
  console.log(`${collectionName}: ${total} documente ${execute ? "șterse" : "identificate"}`);
}

async function main() {
  console.log(`Cutoff: ${cutoff}. Mode: ${execute ? "EXECUTE" : "DRY RUN"}`);
  const db = getFirestore();
  for (const collectionName of collections) {
    await cleanupCollection(db, collectionName);
  }
  if (!execute) console.log("Rulează din nou cu --execute pentru ștergere.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
