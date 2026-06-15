#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Backfill course text locales (27 langs) and per-locale video URLs (copy of RO URL).
 *
 * Usage:
 *   node scripts/backfill-course-locales.cjs --dry-run
 *   node scripts/backfill-course-locales.cjs --courseId=abc123
 *
 * QA checklist (manual):
 * - Web/mobile: switch language → course title/description/curriculum localized
 * - Web/mobile: playback uses correct platform embed for selected locale (or RO fallback)
 * - Admin: select platform + set EN/FR video URLs
 * - Certificate: course title in user's language
 * - After backfill: legacy Vimeo courses show localized content + platform=vimeo
 */
const path = require("path");
const dotenv = require("dotenv");
const admin = require("firebase-admin");

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const nextI18nRoot = require("../next-i18next.config.js");
const SITE_LOCALES = Array.isArray(nextI18nRoot.i18n?.locales)
  ? [...nextI18nRoot.i18n.locales]
  : ["ro"];

const COURSE_MEDIA_COLLECTION = "courseMedia";
const DEFAULT_LOCALE = "ro";

function parseArgs(argv) {
  const args = { dryRun: false, courseId: null };
  for (const arg of argv) {
    if (arg === "--dry-run") args.dryRun = true;
    if (arg.startsWith("--courseId=")) args.courseId = arg.slice("--courseId=".length).trim();
  }
  return args;
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

async function translateText(text, target) {
  const trimmedText = typeof text === "string" ? text.trim() : "";
  if (!trimmedText) return "";
  if (target === DEFAULT_LOCALE) return trimmedText;

  const rapidApiKey = process.env.RAPIDAPI_TRANSLATE_KEY;
  const rapidApiHost =
    process.env.RAPIDAPI_TRANSLATE_HOST || "google-translate113.p.rapidapi.com";
  if (!rapidApiKey) {
    throw new Error("RAPIDAPI_TRANSLATE_KEY is required for backfill translations");
  }

  const response = await fetch(`https://${rapidApiHost}/api/v1/translator/text`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-RapidAPI-Key": rapidApiKey,
      "X-RapidAPI-Host": rapidApiHost,
    },
    body: JSON.stringify({
      from: "auto",
      to: target,
      text: trimmedText,
    }),
  });

  const result = await response.json().catch(() => ({}));
  const translated =
    (typeof result?.trans === "string" && result.trans) ||
    (typeof result?.translation === "string" && result.translation) ||
    "";
  if (!response.ok || !translated) {
    throw new Error(`Translation failed for target=${target}`);
  }
  return translated;
}

function sanitizeCurriculumLessons(lessons) {
  if (!Array.isArray(lessons)) return [];
  return lessons
    .filter((lesson) => lesson && typeof lesson === "object")
    .map((lesson, index) => ({
      id: typeof lesson.id === "string" && lesson.id.trim() ? lesson.id.trim() : `lesson-${index + 1}`,
      title: typeof lesson.title === "string" ? lesson.title.trim() : "",
      durationMinutes: lesson.durationMinutes ?? null,
      summary: typeof lesson.summary === "string" ? lesson.summary.trim() : "",
      isCompleted: lesson.isCompleted === true,
      order: typeof lesson.order === "number" ? lesson.order : index,
    }));
}

function countLocalesWithTitle(locales) {
  if (!locales || typeof locales !== "object") return 0;
  return SITE_LOCALES.filter((lang) => {
    const title = locales[lang]?.title;
    return typeof title === "string" && title.trim().length > 0;
  }).length;
}

async function buildCourseLocales(courseData) {
  const baseTitle = typeof courseData.title === "string" ? courseData.title.trim() : "";
  if (!baseTitle) return null;

  const baseDescription = typeof courseData.description === "string" ? courseData.description.trim() : "";
  const baseNotes = typeof courseData.notesContent === "string" ? courseData.notesContent.trim() : "";
  const baseContact = typeof courseData.contactContent === "string" ? courseData.contactContent.trim() : "";
  const baseLessons = sanitizeCurriculumLessons(courseData.curriculumLessons).map((lesson) => ({
    id: lesson.id,
    title: lesson.title,
    ...(lesson.summary ? { summary: lesson.summary } : {}),
  }));

  const locales = {};

  for (const lang of SITE_LOCALES) {
    if (lang === DEFAULT_LOCALE) {
      locales[lang] = {
        title: baseTitle,
        ...(baseDescription ? { description: baseDescription } : {}),
        ...(baseNotes ? { notesContent: baseNotes } : {}),
        ...(baseContact ? { contactContent: baseContact } : {}),
        curriculumLessons: baseLessons,
      };
      continue;
    }

    const [titleTranslated, descriptionTranslated, notesTranslated, contactTranslated] =
      await Promise.all([
        translateText(baseTitle, lang),
        baseDescription ? translateText(baseDescription, lang) : Promise.resolve(""),
        baseNotes ? translateText(baseNotes, lang) : Promise.resolve(""),
        baseContact ? translateText(baseContact, lang) : Promise.resolve(""),
      ]);

    const translatedLessons = await Promise.all(
      baseLessons.map(async (lesson) => {
        const [titleLessonTranslated, summaryLessonTranslated] = await Promise.all([
          lesson.title ? translateText(lesson.title, lang) : Promise.resolve(""),
          lesson.summary ? translateText(lesson.summary, lang) : Promise.resolve(""),
        ]);
        return {
          id: lesson.id,
          title: titleLessonTranslated || lesson.title,
          ...(summaryLessonTranslated || lesson.summary
            ? { summary: summaryLessonTranslated || lesson.summary }
            : {}),
        };
      })
    );

    locales[lang] = {
      title: titleTranslated || baseTitle,
      ...(descriptionTranslated || baseDescription
        ? { description: descriptionTranslated || baseDescription }
        : {}),
      ...(notesTranslated || baseNotes ? { notesContent: notesTranslated || baseNotes } : {}),
      ...(contactTranslated || baseContact
        ? { contactContent: contactTranslated || baseContact }
        : {}),
      curriculumLessons: translatedLessons,
    };
  }

  return locales;
}

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

async function buildLocaleVideoUrls(mediaData, rootVideoUrl) {
  const rootUrl =
    (typeof mediaData?.videoUrl === "string" && mediaData.videoUrl.trim()) ||
    (typeof mediaData?.vimeoUrl === "string" && mediaData.vimeoUrl.trim()) ||
    (typeof rootVideoUrl === "string" ? rootVideoUrl.trim() : "");
  if (!rootUrl) return null;

  const locales = {};
  for (const lang of SITE_LOCALES) {
    locales[lang] = { videoUrl: rootUrl };
    const vimeoId = extractVimeoId(rootUrl);
    if (vimeoId) {
      locales[lang].vimeoUrl = rootUrl;
      locales[lang].vimeoId = vimeoId;
    }
  }
  return locales;
}

async function main() {
  const { dryRun, courseId } = parseArgs(process.argv.slice(2));
  initAdmin();
  const db = admin.firestore();

  const query = db.collection("courses");

  let courseDocs;
  if (courseId) {
    const snap = await db.collection("courses").doc(courseId).get();
    if (!snap.exists) {
      console.error(`Course not found: ${courseId}`);
      process.exit(1);
    }
    courseDocs = [snap];
  } else {
    courseDocs = (await query.get()).docs;
  }

  let scanned = 0;
  let updatedCourses = 0;
  let updatedMedia = 0;
  let skipped = 0;

  for (const courseSnap of courseDocs) {
    scanned += 1;
    const courseData = courseSnap.data() || {};
    const existingLocales = courseData.locales;
    const completeCount = countLocalesWithTitle(existingLocales);
    const needsLocales = completeCount < SITE_LOCALES.length;

    const mediaSnap = await db.collection(COURSE_MEDIA_COLLECTION).doc(courseSnap.id).get();
    const mediaData = mediaSnap.exists ? mediaSnap.data() : null;
    const hasMediaLocales =
      mediaData?.locales &&
      typeof mediaData.locales === "object" &&
      Object.keys(mediaData.locales).length >= SITE_LOCALES.length;
    const rootVideoUrl =
      mediaData?.videoUrl || mediaData?.vimeoUrl || courseData.vimeoUrl || "";
    const needsMediaPlatform =
      !mediaData?.platform ||
      (typeof mediaData?.videoUrl !== "string" && Boolean(rootVideoUrl));

    if (!needsLocales && hasMediaLocales && !needsMediaPlatform) {
      skipped += 1;
      console.log(`[skip] ${courseSnap.id} locales complete (${completeCount}/${SITE_LOCALES.length})`);
      continue;
    }

    console.log(`[process] ${courseSnap.id} title="${courseData.title || ""}"`);

    if (dryRun) {
      console.log(
        `  dry-run: would update locales=${needsLocales} mediaLocales=${!hasMediaLocales} mediaPlatform=${needsMediaPlatform}`
      );
      continue;
    }

    const batch = db.batch();

    if (needsLocales) {
      const locales = await buildCourseLocales(courseData);
      if (locales) {
        batch.update(courseSnap.ref, {
          locales,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        updatedCourses += 1;
      }
    }

    if ((!hasMediaLocales || needsMediaPlatform) && rootVideoUrl) {
      const mediaLocales = hasMediaLocales ? null : await buildLocaleVideoUrls(mediaData, rootVideoUrl);
      const mediaPatch = {
        platform: mediaData?.platform || "vimeo",
        videoUrl: rootVideoUrl,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };
      if (mediaLocales) {
        mediaPatch.locales = mediaLocales;
      }
      batch.set(db.collection(COURSE_MEDIA_COLLECTION).doc(courseSnap.id), mediaPatch, {
        merge: true,
      });
      updatedMedia += 1;
    }

    await batch.commit();
  }

  console.log(
    JSON.stringify(
      {
        dryRun,
        scanned,
        updatedCourses,
        updatedMedia,
        skipped,
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error("[backfill-course-locales] failed", error?.message || error);
  process.exit(1);
});
