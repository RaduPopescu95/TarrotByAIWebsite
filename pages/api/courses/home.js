import { getAdminDb } from "../../../lib/firebaseAdmin";
import { isCourseVisible, readSingleQueryValue, toSafeCourse } from "../../../lib/courses";

const LATEST_LIMIT = 4;
const DEFAULT_LATEST_CANDIDATE_LIMIT = 24;
const DEFAULT_FEATURED_CANDIDATE_LIMIT = 32;

function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(String(value || ""), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
}

async function fetchLatestCourseCandidates(db, candidateLimit) {
  try {
    const snapshot = await db
      .collection("courses")
      .where("status", "in", ["published", "scheduled"])
      .orderBy("updatedAt", "desc")
      .limit(candidateLimit)
      .get();
    return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
  } catch (error) {
    console.warn("[courses.home] latest_query_fallback", {
      message: error?.message || "unknown_error",
    });
    const fallbackSnapshot = await db
      .collection("courses")
      .orderBy("updatedAt", "desc")
      .limit(candidateLimit)
      .get();
    return fallbackSnapshot.docs
      .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
      .filter((course) => course.status === "published" || course.status === "scheduled");
  }
}

async function fetchFeaturedCourseCandidates(db, candidateLimit) {
  try {
    const snapshot = await db
      .collection("courses")
      .where("featuredOnHome", "==", true)
      .where("status", "in", ["published", "scheduled"])
      .orderBy("updatedAt", "desc")
      .limit(candidateLimit)
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
      .limit(candidateLimit)
      .get();
    return fallbackSnapshot.docs
      .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
      .filter((course) => course.status === "published" || course.status === "scheduled");
  }
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
    const latestCandidateLimit = parsePositiveInt(
      process.env.COURSES_HOME_LATEST_CANDIDATE_LIMIT,
      DEFAULT_LATEST_CANDIDATE_LIMIT
    );
    const featuredCandidateLimit = parsePositiveInt(
      process.env.COURSES_HOME_FEATURED_CANDIDATE_LIMIT,
      DEFAULT_FEATURED_CANDIDATE_LIMIT
    );

    const [latestCandidates, featuredCandidates] = await Promise.all([
      fetchLatestCourseCandidates(db, latestCandidateLimit),
      fetchFeaturedCourseCandidates(db, featuredCandidateLimit),
    ]);

    const visibleLatestCandidates = latestCandidates.filter((course) => isCourseVisible(course, nowMs));
    const visibleFeaturedCandidates = featuredCandidates.filter((course) =>
      isCourseVisible(course, nowMs)
    );

    const latestCourses = visibleLatestCandidates
      .slice(0, LATEST_LIMIT)
      .map((course) => toSafeCourse(course.id, course, locale));

    const featuredCourses = visibleFeaturedCandidates
      .map((course) => toSafeCourse(course.id, course, locale));

    console.info("[courses.home] success", {
      latestCandidateLimit,
      featuredCandidateLimit,
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
