import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "../../../../lib/firebaseAdmin";
import { requireDashboardAccess } from "../../../../lib/requireAuth";
import {
  COURSE_PLATFORMS,
  extractVimeoId,
  isValidCourseVideoUrl,
  normalizeCourseMediaForRead,
  normalizeCoursePlatform,
  sanitizeCurriculumLessons,
} from "../../../../lib/courses";
import {
  attachCourseMediaFields,
  buildCourseMediaPayload,
  mergeCourseMediaInput,
} from "../../../../lib/courseMediaAdmin";
import { fetchVimeoPreviewThumbnail } from "../../../../lib/vimeo";

const ALLOWED_CURRENCIES = ["RON", "EUR"];
const ALLOWED_STATUS = ["draft", "published", "scheduled"];
const COURSE_MEDIA_COLLECTION = "courseMedia";

function parseScheduledAt(value) {
  if (value === null) return null;
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
    if (typeof lesson.isCompleted !== "boolean") return false;
    if (typeof lesson.order !== "number" || !Number.isFinite(lesson.order)) return false;
    return true;
  });
}

async function getCourseWithMedia(db, courseId, courseData) {
  const mediaSnap = await db.collection(COURSE_MEDIA_COLLECTION).doc(courseId).get();
  const media = mediaSnap.exists ? mediaSnap.data() : null;
  return attachCourseMediaFields({ id: courseId, ...courseData }, media);
}

function validateLocaleVideoUrls(value) {
  if (value === undefined) return true;
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  return !Object.values(value).some((entry) => typeof entry !== "string");
}

function validateUpdate(input) {
  const errors = [];
  if (input.title !== undefined && typeof input.title !== "string") errors.push("title");
  if (input.description !== undefined && typeof input.description !== "string")
    errors.push("description");
  const hasVideoUrlField = input.videoUrl !== undefined || input.vimeoUrl !== undefined;
  if (hasVideoUrlField) {
    const { platform, rootVideoUrl } = mergeCourseMediaInput(input);
    if (typeof rootVideoUrl !== "string" || !rootVideoUrl.trim()) {
      errors.push("videoUrl");
    } else if (!isValidCourseVideoUrl(platform, rootVideoUrl)) {
      errors.push("videoUrl");
    }
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
    input.price !== undefined &&
    (typeof input.price !== "number" || !Number.isFinite(input.price) || input.price < 0)
  ) {
    errors.push("price");
  }
  if (input.currency !== undefined && !ALLOWED_CURRENCIES.includes(input.currency))
    errors.push("currency");
  if (input.status !== undefined && !ALLOWED_STATUS.includes(input.status)) errors.push("status");
  if (input.scheduledAt !== undefined && input.scheduledAt !== null) {
    if (!parseScheduledAt(input.scheduledAt)) errors.push("scheduledAt");
  }
  if (input.status === "scheduled" && input.scheduledAt === undefined) {
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
    console.warn("[admin.courses.course] unauthorized", {
      method: req.method,
      courseId: req.query?.courseId,
      message: err?.message || "unauthorized",
    });
    return res.status(err.statusCode || 401).json({ error: err.message });
  }

  const {
    query: { courseId },
  } = req;
  const db = getAdminDb();
  const ref = db.collection("courses").doc(courseId);
  const mediaRef = db.collection(COURSE_MEDIA_COLLECTION).doc(courseId);

  if (req.method === "GET") {
    try {
      const snap = await ref.get();
      if (!snap.exists) return res.status(404).json({ error: "Not found" });
      const payload = await getCourseWithMedia(db, snap.id, snap.data());
      return res.status(200).json(payload);
    } catch (error) {
      console.error("[admin.courses.course] get_fail", {
        courseId,
        message: error?.message || "unknown_error",
      });
      return res.status(500).json({ error: "Failed to load course" });
    }
  }

  if (req.method === "PUT") {
    const input = req.body || {};
    const errors = validateUpdate(input);
    if (errors.length > 0) {
      if (errors.includes("curriculumLessons")) {
        console.warn("[admin.courses.course] curriculum_update_fail", {
          courseId,
          fields: errors,
        });
      }
      return res.status(400).json({ error: "Invalid fields", fields: errors });
    }
    let existing;
    try {
      existing = await ref.get();
      if (!existing.exists) {
        return res.status(404).json({ error: "Course not found" });
      }
    } catch (error) {
      console.error("[admin.courses.course] load_before_update_fail", {
        courseId,
        message: error?.message || "unknown_error",
      });
      return res.status(500).json({ error: "Failed to load course" });
    }
    const mergedMediaInput = mergeCourseMediaInput(input);
    let nextRootVideoUrl = null;
    let nextPlatform = null;
    let nextVimeoPreviewThumbnailUrl = null;
    let nextVimeoPreviewVideoId = null;

    if (input.videoUrl !== undefined || input.vimeoUrl !== undefined || input.platform !== undefined) {
      const mediaSnap = await mediaRef.get();
      const existingMedia = mediaSnap.exists ? mediaSnap.data() : null;
      const existingNormalized = normalizeCourseMediaForRead(existingMedia, existing.data());
      nextPlatform = mergedMediaInput.platform || existingNormalized.platform;
      nextRootVideoUrl =
        input.videoUrl !== undefined || input.vimeoUrl !== undefined
          ? mergedMediaInput.rootVideoUrl
          : existingNormalized.videoUrl;
      if (nextPlatform === "vimeo" && nextRootVideoUrl) {
        nextVimeoPreviewVideoId = extractVimeoId(nextRootVideoUrl) || null;
        nextVimeoPreviewThumbnailUrl = await fetchVimeoPreviewThumbnail(nextRootVideoUrl);
      }
    }
    const payload = {
      ...(input.title !== undefined ? { title: input.title.trim() } : {}),
      ...(input.description !== undefined ? { description: input.description.trim() } : {}),
      ...(input.categoryIds !== undefined ? { categoryIds: input.categoryIds } : {}),
      ...(input.price !== undefined ? { price: input.price } : {}),
      ...(input.currency !== undefined ? { currency: input.currency } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.featuredOnHome !== undefined
        ? { featuredOnHome: input.featuredOnHome === true }
        : {}),
      ...(input.sitePremiumAccess !== undefined
        ? { sitePremiumAccess: input.sitePremiumAccess === true }
        : {}),
      ...(input.scheduledAt !== undefined
        ? { scheduledAt: parseScheduledAt(input.scheduledAt) }
        : {}),
      ...(input.locales !== undefined ? { locales: input.locales } : {}),
      ...(input.thumbnailUrl !== undefined
        ? { thumbnailUrl: input.thumbnailUrl?.trim() || null }
        : {}),
      ...(input.curriculumLessons !== undefined
        ? { curriculumLessons: sanitizeCurriculumLessons(input.curriculumLessons) }
        : {}),
      ...(input.notesContent !== undefined ? { notesContent: input.notesContent.trim() } : {}),
      ...(input.contactContent !== undefined
        ? { contactContent: input.contactContent.trim() }
        : {}),
      ...(nextVimeoPreviewVideoId !== null || nextVimeoPreviewThumbnailUrl !== null
        ? {
            vimeoPreviewVideoId: nextVimeoPreviewVideoId,
            vimeoPreviewThumbnailUrl: nextVimeoPreviewThumbnailUrl || null,
          }
        : {}),
      // Hardening: sensitive playback fields are stored in dedicated private collection.
      vimeoUrl: FieldValue.delete(),
      vimeoId: FieldValue.delete(),
      updatedAt: FieldValue.serverTimestamp(),
    };
    try {
      const batch = db.batch();
      batch.update(ref, payload);

      let existingMediaRootUrl = "";
      let existingPlatform = "vimeo";
      const mediaSnapForLocales = await mediaRef.get();
      if (mediaSnapForLocales.exists) {
        const existingNormalized = normalizeCourseMediaForRead(
          mediaSnapForLocales.data(),
          existing.data()
        );
        existingMediaRootUrl = existingNormalized.videoUrl;
        existingPlatform = existingNormalized.platform;
      }

      const shouldUpdateMedia =
        input.videoUrl !== undefined ||
        input.vimeoUrl !== undefined ||
        input.platform !== undefined ||
        input.localeVideoUrls !== undefined ||
        input.localeVimeoUrls !== undefined;

      if (shouldUpdateMedia) {
        const { localeVideoUrls, platform, rootVideoUrl } = mergeCourseMediaInput({
          ...input,
          platform: nextPlatform || input.platform || existingPlatform,
          videoUrl:
            input.videoUrl !== undefined || input.vimeoUrl !== undefined
              ? nextRootVideoUrl
              : existingMediaRootUrl,
          localeVideoUrls: input.localeVideoUrls ?? input.localeVimeoUrls,
        });

        batch.set(
          mediaRef,
          {
            ...buildCourseMediaPayload({
              platform: platform || existingPlatform,
              rootVideoUrl: rootVideoUrl || existingMediaRootUrl,
              localeVideoUrls,
            }),
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
      }

      await batch.commit();
      return res.status(200).json({ id: courseId });
    } catch (error) {
      console.error("[admin.courses.course] update_fail", {
        courseId,
        message: error?.message || "unknown_error",
      });
      if (error?.code === 5 || error?.message?.toLowerCase?.().includes("not found")) {
        return res.status(404).json({ error: "Course not found" });
      }
      return res.status(500).json({ error: "Failed to update course" });
    }
  }

  if (req.method === "DELETE") {
    try {
      const batch = db.batch();
      batch.delete(ref);
      batch.delete(mediaRef);
      await batch.commit();
      return res.status(204).end();
    } catch (error) {
      console.error("[admin.courses.course] delete_fail", {
        courseId,
        message: error?.message || "unknown_error",
      });
      return res.status(500).json({ error: "Failed to delete course" });
    }
  }

  res.setHeader("Allow", "GET, PUT, DELETE");
  return res.status(405).end("Method Not Allowed");
}
