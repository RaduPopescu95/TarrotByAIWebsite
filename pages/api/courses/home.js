import { getAdminDb } from "../../../lib/firebaseAdmin";
import {
  extractVimeoId,
  isCourseVisible,
  readSingleQueryValue,
  toSafeCourse,
} from "../../../lib/courses";

const LATEST_LIMIT = 4;
const COURSE_MEDIA_COLLECTION = "courseMedia";
const VIMEO_ID_PATTERN = /^\d+$/;

function normalizeVimeoId(value) {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  if (!normalized || !VIMEO_ID_PATTERN.test(normalized)) return null;
  return normalized;
}

function resolvePreviewVimeoId(course, media) {
  const candidates = [
    course?.vimeoPreviewVideoId,
    course?.vimeoId,
    media?.vimeoId,
    extractVimeoId(media?.vimeoUrl),
    extractVimeoId(course?.vimeoUrl),
  ];

  for (const candidate of candidates) {
    const normalized = normalizeVimeoId(candidate);
    if (normalized) return normalized;
  }

  return null;
}

async function fetchLatestCourseCandidates(db) {
  try {
    const snapshot = await db
      .collection("courses")
      .where("status", "in", ["published", "scheduled"])
      .orderBy("updatedAt", "desc")
      .get();

    return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
  } catch (error) {
    console.warn("[courses.home] latest_query_fallback", {
      message: error?.message || "unknown_error",
    });
    const fallbackSnapshot = await db
      .collection("courses")
      .orderBy("updatedAt", "desc")
      .get();

    return fallbackSnapshot.docs
      .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
      .filter((course) => course.status === "published" || course.status === "scheduled");
  }
}

async function fetchFeaturedCourseCandidates(db) {
  try {
    const snapshot = await db
      .collection("courses")
      .where("featuredOnHome", "==", true)
      .where("status", "in", ["published", "scheduled"])
      .orderBy("updatedAt", "desc")
      .get();

    return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
  } catch (error) {
    console.warn("[courses.home] featured_query_fallback", {
      message: error?.message || "unknown_error",
    });
    const fallbackSnapshot = await db
      .collection("courses")
      .where("featuredOnHome", "==", true)
      .orderBy("updatedAt", "desc")
      .get();

    return fallbackSnapshot.docs
      .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
      .filter((course) => course.status === "published" || course.status === "scheduled");
  }
}

async function loadCourseMediaMap(db, courses = []) {
  const uniqueCourseIds = Array.from(
    new Set(courses.map((course) => (typeof course?.id === "string" ? course.id : null)).filter(Boolean))
  );
  if (uniqueCourseIds.length === 0) return new Map();

  const mediaSnaps = await Promise.all(
    uniqueCourseIds.map((courseId) => db.collection(COURSE_MEDIA_COLLECTION).doc(courseId).get())
  );

  return uniqueCourseIds.reduce((acc, courseId, index) => {
    const media = mediaSnaps[index]?.exists ? mediaSnaps[index].data() : null;
    acc.set(courseId, media);
    return acc;
  }, new Map());
}

function attachPreviewFallback(courses, mediaMap) {
  if (!Array.isArray(courses) || courses.length === 0) return [];

  return courses.map((course) => {
    if (!course || typeof course !== "object") return course;
    const media = mediaMap.get(course.id) || null;
    const fallbackPreviewVimeoId = resolvePreviewVimeoId(course, media);
    if (!fallbackPreviewVimeoId) return course;

    return {
      ...course,
      ...(typeof course.vimeoPreviewVideoId === "string" && course.vimeoPreviewVideoId.trim()
        ? {}
        : { vimeoPreviewVideoId: fallbackPreviewVimeoId }),
    };
  });
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).end("Method Not Allowed");
  }

  const locale = readSingleQueryValue(req.query?.locale);
  console.info("[courses.home] start", {
    locale: locale || "default",
  });

  try {
    const db = getAdminDb();
    const nowMs = Date.now();
    const [latestCandidates, featuredCandidates] = await Promise.all([
      fetchLatestCourseCandidates(db),
      fetchFeaturedCourseCandidates(db),
    ]);

    const visibleLatestCandidates = latestCandidates.filter((course) => isCourseVisible(course, nowMs));
    const visibleFeaturedCandidates = featuredCandidates.filter((course) =>
      isCourseVisible(course, nowMs)
    );
    const mediaMap = await loadCourseMediaMap(db, [
      ...visibleLatestCandidates,
      ...visibleFeaturedCandidates,
    ]);
    const latestWithPreview = attachPreviewFallback(visibleLatestCandidates, mediaMap);
    const featuredWithPreview = attachPreviewFallback(visibleFeaturedCandidates, mediaMap);

    const latestCourses = latestWithPreview
      .slice(0, LATEST_LIMIT)
      .map((course) => toSafeCourse(course.id, course, locale));

    const featuredCourses = featuredWithPreview
      .map((course) => toSafeCourse(course.id, course, locale));

    console.info("[courses.home] success", {
      latestCandidatesCount: latestCandidates.length,
      featuredCandidatesCount: featuredCandidates.length,
      latestCount: latestCourses.length,
      featuredCount: featuredCourses.length,
    });

    return res.status(200).json({ latestCourses, featuredCourses });
  } catch (error) {
    console.error("[courses.home] fail", {
      message: error?.message || "unknown_error",
    });
    return res.status(500).json({ error: "Failed to load homepage courses" });
  }
}
