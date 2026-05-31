import { buildPublicCacheControl } from "../../../lib/httpCache";
import { getAdminDb } from "../../../lib/firebaseAdmin";
import {
  extractVimeoId,
  isCourseVisible,
  parseQueryBoolean,
  readSingleQueryValue,
  toSafeCourse,
} from "../../../lib/courses";

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

async function fetchCourseCandidates(db) {
  try {
    const snapshot = await db
      .collection("courses")
      .where("status", "in", ["published", "scheduled"])
      .orderBy("updatedAt", "desc")
      .get();

    return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
  } catch (error) {
    console.warn("[courses.list] list_query_fallback", {
      message: error?.message || "unknown_error",
    });
    const fallbackSnapshot = await db.collection("courses").orderBy("updatedAt", "desc").get();
    return fallbackSnapshot.docs
      .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
      .filter((course) => course.status === "published" || course.status === "scheduled");
  }
}

async function attachPreviewFallbackFromMedia(db, courses) {
  if (!Array.isArray(courses) || courses.length === 0) return [];

  const mediaSnaps = await Promise.all(
    courses.map((course) => db.collection(COURSE_MEDIA_COLLECTION).doc(course.id).get())
  );

  return courses.map((course, index) => {
    if (!course || typeof course !== "object") return course;
    const media = mediaSnaps[index]?.exists ? mediaSnaps[index].data() : null;
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

  try {
    const db = getAdminDb();
    const locale = readSingleQueryValue(req.query?.locale);
    const featuredOnly = parseQueryBoolean(req.query?.featuredOnly);

    const nowMs = Date.now();
    const filteredCourses = (await fetchCourseCandidates(db))
      .filter((course) => isCourseVisible(course, nowMs))
      .filter((course) => {
        if (featuredOnly === null) return true;
        return (course.featuredOnHome === true) === featuredOnly;
      });

    const coursesWithPreview = await attachPreviewFallbackFromMedia(db, filteredCourses);
    const courses = coursesWithPreview
      .map((course) => toSafeCourse(course.id, course, locale));

    res.setHeader(
      "Cache-Control",
      buildPublicCacheControl({
        sMaxageSeconds: 300,
        staleWhileRevalidateSeconds: 600,
      })
    );

    return res.status(200).json({ courses });
  } catch (error) {
    console.error("[courses.list] fail", {
      locale: req.query?.locale,
      featuredOnly: req.query?.featuredOnly,
      message: error?.message || "unknown_error",
    });
    return res.status(500).json({ error: "Failed to load courses" });
  }
}
