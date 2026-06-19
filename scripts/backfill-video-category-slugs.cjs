#!/usr/bin/env node
/* eslint-disable no-console */
const admin = require("firebase-admin");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(process.cwd(), ".env.local") });
dotenv.config({ path: path.join(process.cwd(), ".env") });

function initAdmin() {
  if (admin.apps.length) return;
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Missing Firebase Admin envs. Required: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY."
    );
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
    ...(process.env.FIREBASE_DATABASE_URL ? { databaseURL: process.env.FIREBASE_DATABASE_URL } : {}),
  });
}

function slugify(text) {
  if (!text || typeof text !== "string") return "";
  return text
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function reserveUniqueSlug(baseSlug, usedSlugs) {
  if (!baseSlug) return "";
  if (!usedSlugs.has(baseSlug)) {
    usedSlugs.add(baseSlug);
    return baseSlug;
  }

  let suffix = 2;
  while (usedSlugs.has(`${baseSlug}-${suffix}`)) {
    suffix += 1;
  }
  const resolved = `${baseSlug}-${suffix}`;
  usedSlugs.add(resolved);
  return resolved;
}

async function main() {
  initAdmin();
  const db = admin.firestore();
  const dryRun = process.argv.includes("--dry-run");

  const snap = await db.collection("videoCategories").orderBy("name", "asc").get();
  const usedSlugs = new Set();
  const updates = [];

  snap.docs.forEach((docSnap) => {
    const data = docSnap.data() || {};
    const name = typeof data.name === "string" ? data.name.trim() : "";
    const currentSlug = typeof data.slug === "string" ? data.slug.trim() : "";
    const baseSlug = slugify(currentSlug || name);
    const nextSlug = reserveUniqueSlug(baseSlug, usedSlugs);

    if (!name || !nextSlug) {
      console.warn("[video-category-slugs] skipped", {
        id: docSnap.id,
        name,
        currentSlug,
      });
      return;
    }

    if (currentSlug !== nextSlug) {
      updates.push({ ref: docSnap.ref, id: docSnap.id, name, currentSlug, nextSlug });
    }
  });

  console.log("[video-category-slugs] planned", {
    dryRun,
    scanned: snap.size,
    updates: updates.length,
  });

  if (dryRun) {
    updates.forEach((item) => {
      console.log("[video-category-slugs] would_update", {
        id: item.id,
        name: item.name,
        from: item.currentSlug || null,
        to: item.nextSlug,
      });
    });
    return;
  }

  let batch = db.batch();
  let batchWrites = 0;
  let written = 0;

  for (const item of updates) {
    batch.update(item.ref, { slug: item.nextSlug });
    batchWrites += 1;
    written += 1;

    if (batchWrites >= 450) {
      await batch.commit();
      batch = db.batch();
      batchWrites = 0;
    }
  }

  if (batchWrites > 0) {
    await batch.commit();
  }

  console.log("[video-category-slugs] done", { written });
}

main().catch((error) => {
  console.error("[video-category-slugs] failed", error);
  process.exit(1);
});
