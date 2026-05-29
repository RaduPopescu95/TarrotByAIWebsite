#!/usr/bin/env node
/* eslint-disable no-console */
const admin = require("firebase-admin");

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

function parseDateParts(value) {
  if (typeof value !== "string") return null;
  const raw = value.trim();
  if (!raw) return null;
  const parts = raw.replace(/[./]/g, "-").split("-");
  if (parts.length !== 3) return null;
  const [a, b, c] = parts.map((part) => Number.parseInt(part, 10));
  if (![a, b, c].every(Number.isFinite)) return null;
  if (parts[0].length === 4) return { year: a, month: b, day: c };
  return { day: a, month: b, year: c };
}

function parseTimeParts(value) {
  if (typeof value !== "string") return null;
  const raw = value.trim();
  if (!raw) return null;
  const parts = raw.split(":");
  if (parts.length < 2) return null;
  const hour = Number.parseInt(parts[0], 10);
  const minute = Number.parseInt(parts[1], 10);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return { hour, minute };
}

function toDateFromUnknown(value) {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value.toDate === "function") {
    const converted = value.toDate();
    return Number.isNaN(converted?.getTime?.()) ? null : converted;
  }
  if (typeof value === "string" || typeof value === "number") {
    const converted = new Date(value);
    return Number.isNaN(converted.getTime()) ? null : converted;
  }
  if (typeof value === "object" && typeof value.seconds === "number") {
    const converted = new Date(value.seconds * 1000);
    return Number.isNaN(converted.getTime()) ? null : converted;
  }
  return null;
}

function resolveScheduledAt(data) {
  const parsedDate = parseDateParts(data?.dataProgramata);
  const parsedTime = parseTimeParts(data?.timpProgramat);

  if (parsedDate) {
    const dateValue = new Date(
      parsedDate.year,
      parsedDate.month - 1,
      parsedDate.day,
      parsedTime ? parsedTime.hour : 0,
      parsedTime ? parsedTime.minute : 0,
      0,
      0
    );
    if (!Number.isNaN(dateValue.getTime())) return dateValue;
  }

  return (
    toDateFromUnknown(data?.firstUploadTimestamp) ||
    toDateFromUnknown(data?.createdAt) ||
    new Date()
  );
}

async function main() {
  initAdmin();
  const db = admin.firestore();

  const dryRun = process.argv.includes("--dry-run");
  const pageSize = 400;
  let lastDoc = null;

  let scanned = 0;
  let updated = 0;
  let skipped = 0;
  let errors = 0;

  console.log(`[backfill-blog-scheduled-at] start dryRun=${dryRun}`);

  while (true) {
    let queryRef = db.collection("BlogArticole").orderBy(admin.firestore.FieldPath.documentId()).limit(pageSize);
    if (lastDoc) {
      queryRef = queryRef.startAfter(lastDoc);
    }

    const snap = await queryRef.get();
    if (snap.empty) break;

    let batch = db.batch();
    let batchWrites = 0;

    for (const docSnap of snap.docs) {
      scanned += 1;
      try {
        const data = docSnap.data() || {};
        const existing = toDateFromUnknown(data.scheduledAtTs);
        if (existing) {
          skipped += 1;
          continue;
        }

        const scheduledAt = resolveScheduledAt(data);
        if (!dryRun) {
          batch.update(docSnap.ref, { scheduledAtTs: scheduledAt });
          batchWrites += 1;
          if (batchWrites >= 450) {
            await batch.commit();
            batch = db.batch();
            batchWrites = 0;
          }
        }
        updated += 1;
      } catch (error) {
        errors += 1;
        console.error("[backfill-blog-scheduled-at] document failed", {
          documentId: docSnap.id,
          message: error?.message || String(error),
        });
      }
    }

    if (!dryRun && batchWrites > 0) {
      await batch.commit();
    }

    lastDoc = snap.docs[snap.docs.length - 1];
    if (snap.docs.length < pageSize) break;
  }

  console.log("[backfill-blog-scheduled-at] done", {
    dryRun,
    scanned,
    updated,
    skipped,
    errors,
  });
}

main().catch((error) => {
  console.error("[backfill-blog-scheduled-at] fatal", error);
  process.exitCode = 1;
});
