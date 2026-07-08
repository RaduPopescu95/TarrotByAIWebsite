import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "../../../../lib/firebaseAdmin";
import { requireDashboardAccess } from "../../../../lib/requireAuth";
import {
  COURSE_PLATFORMS,
  extractVimeoId,
  isValidCourseVideoUrl,
  normalizeCoursePlatform,
  sanitizeCurriculumLessons,
} from "../../../../lib/courses";
import {
  attachCourseMediaFields,
  buildCourseMediaPayload,
  mergeCourseMediaInput,
} from "../../../../lib/courseMediaAdmin";
import { fetchVimeoPreviewThumbnail } from "../../../../lib/vimeo";
import { COURSE_STATUSES } from "../../../../lib/coursePurchases";

const ALLOWED_CURRENCIES = ["RON", "EUR"];
const ALLOWED_STATUS = COURSE_STATUSES;
const COURSE_MEDIA_COLLECTION = "courseMedia";

function parseScheduledAt(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function hasValidLocalizedCurriculumLessons(value) {
  if (value === undefined) return true;
  if (!Array.isArray(value)) return false;
  return value.every((lesson) => {
    if (!lesson || typeof lesson !== "object" || Array.isArray(lesson)) return false;
    if (typeof lesson.id !== "string" || !lesson.id.trim()) return false;
    if (lesson.title !== undefined && typeof lesson.title !== "string") return false;
    if (lesson.summary !== undefined && typeof lesson.summary !== "string") return false;
    return true;
  });
}

function isCourseLocales(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  return Object.values(value).every((entry) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) return false;
    if (typeof entry.title !== "string") return false;
    if (entry.description !== undefined && typeof entry.description !== "string") return false;
    if (entry.notesContent !== undefined && typeof entry.notesContent !== "string") return false;
    if (entry.contactContent !== undefined && typeof entry.contactContent !== "string")
      return false;
    if (!hasValidLocalizedCurriculumLessons(entry.curriculumLessons)) return false;
    return true;
  });
}

function hasValidCurriculumLessons(value) {
  if (!Array.isArray(value)) return false;
  return value.every((lesson) => {
    if (!lesson || typeof lesson !== "object" || Array.isArray(lesson)) return false;
    if (typeof lesson.id !== "string" || !lesson.id.trim()) return false;
    if (typeof lesson.title !== "string" || !lesson.title.trim()) return false;
    if (lesson.durationMinutes !== null && lesson.durationMinutes !== undefined) {
      if (
        typeof lesson.durationMinutes !== "number" ||
        !Number.isInteger(lesson.durationMinutes) ||
        lesson.durationMinutes <= 0
      ) {
        return false;
      }
    }
    if (lesson.summary !== undefined && typeof lesson.summary !== "string") return false;
    if (typeof lesson.order !== "number" || !Number.isFinite(lesson.order)) return false;
    return true;
  });
}

async function attachCourseMedia(db, courses) {
  if (!Array.isArray(courses) || courses.length === 0) return [];
  const mediaSnaps = await Promise.all(
    courses.map((course) => db.collection(COURSE_MEDIA_COLLECTION).doc(course.id).get())
  );
  return courses.map((course, index) => {
    const media = mediaSnaps[index]?.exists ? mediaSnaps[index].data() : null;
    return attachCourseMediaFields(course, media);
  });
}

function validateLocaleVideoUrls(value) {
  if (value === undefined) return true;
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  return !Object.values(value).some((entry) => typeof entry !== "string");
}

function validateCourseInput(input) {
  const errors = [];
  const { platform, rootVideoUrl } = mergeCourseMediaInput(input);
  if (!input.title || typeof input.title !== "string") errors.push("title");
  if (!input.description || typeof input.description !== "string") errors.push("description");
  if (!rootVideoUrl) {
    errors.push("videoUrl");
  } else if (!isValidCourseVideoUrl(platform, rootVideoUrl)) {
    errors.push("videoUrl");
  }
  if (input.platform !== undefined && !COURSE_PLATFORMS.includes(normalizeCoursePlatform(input.platform))) {
    errors.push("platform");
  }
  if (input.categoryIds !== undefined) {
    if (!Array.isArray(input.categoryIds) || input.categoryIds.some((id) => typeof id !== "string")) {
      errors.push("categoryIds");
    }
  }
  if (
    typeof input.price !== "number" ||
    !Number.isFinite(input.price) ||
    input.price < 0
  ) {
    errors.push("price");
  }
  if (!ALLOWED_CURRENCIES.includes(input.currency)) errors.push("currency");
  if (!ALLOWED_STATUS.includes(input.status)) errors.push("status");
  if (input.status === "scheduled") {
    if (!input.scheduledAt || !parseScheduledAt(input.scheduledAt)) errors.push("scheduledAt");
  } else if (input.scheduledAt && !parseScheduledAt(input.scheduledAt)) {
    errors.push("scheduledAt");
  }
  if (input.featuredOnHome !== undefined && typeof input.featuredOnHome !== "boolean") {
    errors.push("featuredOnHome");
  }
  if (input.sitePremiumAccess !== undefined && typeof input.sitePremiumAccess !== "boolean") {
    errors.push("sitePremiumAccess");
  }
  if (input.curriculumLessons !== undefined && !hasValidCurriculumLessons(input.curriculumLessons)) {
    errors.push("curriculumLessons");
  }
  if (input.notesContent !== undefined && typeof input.notesContent !== "string") {
    errors.push("notesContent");
  }
  if (input.contactContent !== undefined && typeof input.contactContent !== "string") {
    errors.push("contactContent");
  }
  if (input.locales !== undefined && !isCourseLocales(input.locales)) errors.push("locales");
  if (!validateLocaleVideoUrls(input.localeVideoUrls)) errors.push("localeVideoUrls");
  if (!validateLocaleVideoUrls(input.localeVimeoUrls)) errors.push("localeVimeoUrls");
  return errors;
}

export default async function handler(req, res) {
  try {
    requireDashboardAccess(req);
  } catch (err) {
    console.warn("[admin.courses] unauthorized", {
      method: req.method,
      message: err?.message || "unauthorized",
    });
    return res.status(err.statusCode || 401).json({ error: err.message });
  }

  const db = getAdminDb();

  if (req.method === "GET") {
    try {
      const snapshot = await db.collection("courses").orderBy("updatedAt", "desc").get();
      const rawCourses = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      const courses = await attachCourseMedia(db, rawCourses);
      return res.status(200).json({ courses });
    } catch (error) {
      console.error("[admin.courses] list_fail", {
        message: error?.message || "unknown_error",
      });
      return res.status(500).json({ error: "Failed to load courses" });
    }
  }

  if (req.method === "POST") {
    const input = req.body || {};
    const errors = validateCourseInput(input);
    if (errors.length > 0) {
      if (errors.includes("curriculumLessons")) {
        console.warn("[admin.courses] curriculum_validate_fail", {
          fields: errors,
        });
      }
      return res.status(400).json({ error: "Invalid fields", fields: errors });
    }
    const { localeVideoUrls, platform, rootVideoUrl } = mergeCourseMediaInput(input);
    const vimeoPreviewVideoId =
      platform === "vimeo" ? extractVimeoId(rootVideoUrl) || null : null;
    const vimeoPreviewThumbnailUrl =
      platform === "vimeo" ? await fetchVimeoPreviewThumbnail(rootVideoUrl) : null;
    const payload = {
      title: input.title.trim(),
      description: input.description.trim(),
      categoryIds: Array.isArray(input.categoryIds) ? input.categoryIds : [],
      price: input.price,
      currency: input.currency,
      status: input.status,
      featuredOnHome: input.featuredOnHome === true,
      sitePremiumAccess: input.sitePremiumAccess === true,
      scheduledAt: input.status === "scheduled" ? parseScheduledAt(input.scheduledAt) : null,
      ...(input.locales ? { locales: input.locales } : {}),
      thumbnailUrl: input.thumbnailUrl?.trim() || null,
      curriculumLessons: sanitizeCurriculumLessons(input.curriculumLessons),
      notesContent: typeof input.notesContent === "string" ? input.notesContent.trim() : "",
      contactContent: typeof input.contactContent === "string" ? input.contactContent.trim() : "",
      vimeoPreviewVideoId,
      vimeoPreviewThumbnailUrl: vimeoPreviewThumbnailUrl || null,
      purchaseCount: 0,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      createdBy: "dashboard",
    };
    const mediaPayload = {
      ...buildCourseMediaPayload({ platform, rootVideoUrl, localeVideoUrls }),
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };
    try {
      const docRef = db.collection("courses").doc();
      const mediaRef = db.collection(COURSE_MEDIA_COLLECTION).doc(docRef.id);
      const batch = db.batch();
      batch.set(docRef, payload);
      batch.set(mediaRef, mediaPayload);
      await batch.commit();
      return res.status(201).json({ id: docRef.id });
    } catch (error) {
      console.error("[admin.courses] create_fail", {
        message: error?.message || "unknown_error",
      });
      return res.status(500).json({ error: "Failed to create course" });
    }
  }

  res.setHeader("Allow", "GET, POST");
  return res.status(405).end("Method Not Allowed");
}
