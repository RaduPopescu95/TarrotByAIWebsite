#!/usr/bin/env node
/* eslint-disable no-console */
const path = require("path");
const dotenv = require("dotenv");
const admin = require("firebase-admin");

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

function extractVimeoId(url) {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.includes("vimeo.com")) return null;
    const parts = parsed.pathname.split("/").filter(Boolean);
    const last = parts[parts.length - 1] || "";
    return /^\d+$/.test(last) ? last : null;
  } catch (_) {
    return null;
  }
}

function initAdmin() {
  if (admin.apps.length) return;
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY
        ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
        : undefined,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    }),
  });
}

async function main() {
  initAdmin();
  const db = admin.firestore();
  const snapshot = await db.collection("courses").get();

  let scanned = 0;
  let migrated = 0;
  let skipped = 0;

  let batch = db.batch();
  let opCount = 0;

  const flush = async () => {
    if (opCount === 0) return;
    await batch.commit();
    batch = db.batch();
    opCount = 0;
  };

  for (const docSnap of snapshot.docs) {
    scanned += 1;
    const data = docSnap.data() || {};
    const legacyUrl = typeof data.vimeoUrl === "string" ? data.vimeoUrl.trim() : "";
    const legacyId = typeof data.vimeoId === "string" ? data.vimeoId : null;

    if (!legacyUrl && !legacyId) {
      skipped += 1;
      continue;
    }

    const nextVimeoId = legacyId || extractVimeoId(legacyUrl);
    const mediaRef = db.collection("courseMedia").doc(docSnap.id);
    const courseRef = db.collection("courses").doc(docSnap.id);

    batch.set(
      mediaRef,
      {
        vimeoUrl: legacyUrl,
        vimeoId: nextVimeoId || null,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    opCount += 1;

    batch.update(courseRef, {
      vimeoUrl: admin.firestore.FieldValue.delete(),
      vimeoId: admin.firestore.FieldValue.delete(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    opCount += 1;
    migrated += 1;

    // Firestore max is 500 operations per batch.
    if (opCount >= 450) {
      await flush();
    }
  }

  await flush();

  console.log("Migration completed");
  console.log(`Scanned: ${scanned}`);
  console.log(`Migrated: ${migrated}`);
  console.log(`Skipped: ${skipped}`);
}

main().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
