#!/usr/bin/env node
/* eslint-disable no-console */
const path = require("path");
const dotenv = require("dotenv");
const admin = require("firebase-admin");

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const OEMBED_ENDPOINT = "https://vimeo.com/api/oembed.json";
const COURSE_MEDIA_COLLECTION = "courseMedia";

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

async function fetchPreview(vimeoUrl) {
  const vimeoId = extractVimeoId(vimeoUrl);
  if (!vimeoId) return null;
  const requestUrl = `${OEMBED_ENDPOINT}?url=${encodeURIComponent(`https://vimeo.com/${vimeoId}`)}`;
  try {
    const response = await fetch(requestUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });
    if (!response.ok) return null;
    const payload = await response.json();
    const thumbnailUrl =
      typeof payload?.thumbnail_url === "string" ? payload.thumbnail_url.trim() : "";
    return thumbnailUrl || null;
  } catch (_) {
    return null;
  }
}

async function main() {
  initAdmin();
  const db = admin.firestore();
  const coursesSnap = await db.collection("courses").get();

  let scanned = 0;
  let updated = 0;
  let skipped = 0;
  let failed = 0;

  let batch = db.batch();
  let opCount = 0;

  const flush = async () => {
    if (opCount === 0) return;
    await batch.commit();
    batch = db.batch();
    opCount = 0;
  };

  for (const courseSnap of coursesSnap.docs) {
    scanned += 1;
    const course = courseSnap.data() || {};
    const hasExistingPreview =
      typeof course.vimeoPreviewThumbnailUrl === "string" &&
      course.vimeoPreviewThumbnailUrl.trim().length > 0;
    const hasExistingPreviewVideoId =
      typeof course.vimeoPreviewVideoId === "string" && course.vimeoPreviewVideoId.trim().length > 0;
    if (hasExistingPreview) {
      if (hasExistingPreviewVideoId) {
        skipped += 1;
        continue;
      }
    }

    const mediaSnap = await db.collection(COURSE_MEDIA_COLLECTION).doc(courseSnap.id).get();
    const media = mediaSnap.exists ? mediaSnap.data() || {} : {};
    const vimeoUrl =
      (typeof media.vimeoUrl === "string" && media.vimeoUrl.trim()) ||
      (typeof course.vimeoUrl === "string" && course.vimeoUrl.trim()) ||
      "";

    if (!vimeoUrl) {
      skipped += 1;
      continue;
    }

    const vimeoPreviewVideoId = extractVimeoId(vimeoUrl);
    const previewUrl = await fetchPreview(vimeoUrl);
    const updatePayload = {};
    if (vimeoPreviewVideoId) {
      updatePayload.vimeoPreviewVideoId = vimeoPreviewVideoId;
    }
    if (previewUrl) {
      updatePayload.vimeoPreviewThumbnailUrl = previewUrl;
    }

    if (Object.keys(updatePayload).length === 0) {
      failed += 1;
      continue;
    }

    const courseRef = db.collection("courses").doc(courseSnap.id);
    batch.update(courseRef, {
      ...updatePayload,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    opCount += 1;
    updated += 1;

    if (opCount >= 450) {
      await flush();
    }
  }

  await flush();

  console.log("[courses.preview.backfill] done");
  console.log(`Scanned: ${scanned}`);
  console.log(`Updated: ${updated}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Failed: ${failed}`);
}

main().catch((error) => {
  console.error("[courses.preview.backfill] failed", error);
  process.exit(1);
});
