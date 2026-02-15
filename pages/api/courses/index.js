import { getAdminDb } from "../../../lib/firebaseAdmin";
import {
  isCourseVisible,
  parseQueryBoolean,
  parseQueryPositiveLimit,
  readSingleQueryValue,
  toSafeCourse,
} from "../../../lib/courses";

const DEFAULT_LIMITED_CANDIDATE_FLOOR = 24;
const DEFAULT_LIMITED_CANDIDATE_MULTIPLIER = 4;
const DEFAULT_LIMITED_CANDIDATE_CAP = 200;

function resolveCandidateLimit(requestedLimit) {
  if (typeof requestedLimit !== "number") return null;
  const floor = Number.parseInt(process.env.COURSES_LIST_CANDIDATE_FLOOR || "", 10);
  const multiplier = Number.parseInt(process.env.COURSES_LIST_CANDIDATE_MULTIPLIER || "", 10);
  const cap = Number.parseInt(process.env.COURSES_LIST_CANDIDATE_CAP || "", 10);
  const effectiveFloor = Number.isFinite(floor) && floor > 0 ? floor : DEFAULT_LIMITED_CANDIDATE_FLOOR;
  const effectiveMultiplier =
    Number.isFinite(multiplier) && multiplier > 0 ? multiplier : DEFAULT_LIMITED_CANDIDATE_MULTIPLIER;
  const effectiveCap = Number.isFinite(cap) && cap > 0 ? cap : DEFAULT_LIMITED_CANDIDATE_CAP;
  return Math.min(Math.max(requestedLimit * effectiveMultiplier, effectiveFloor), effectiveCap);
}

async function fetchCourseCandidates(db, candidateLimit = null) {
  try {
    let collectionQuery = db
      .collection("courses")
      .where("status", "in", ["published", "scheduled"])
      .orderBy("updatedAt", "desc");
    if (typeof candidateLimit === "number") {
      collectionQuery = collectionQuery.limit(candidateLimit);
    }
    const snapshot = await collectionQuery.get();
    return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
  } catch (error) {
    console.warn("[courses.list] list_query_fallback", {
      message: error?.message || "unknown_error",
    });
    let fallbackQuery = db.collection("courses").orderBy("updatedAt", "desc");
    if (typeof candidateLimit === "number") {
      fallbackQuery = fallbackQuery.limit(candidateLimit);
    }
    const fallbackSnapshot = await fallbackQuery.get();
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

  try {
    const db = getAdminDb();
    const locale = readSingleQueryValue(req.query?.locale);
    const featuredOnly = parseQueryBoolean(req.query?.featuredOnly);
    const limit = parseQueryPositiveLimit(req.query?.limit);
    const candidateLimit = resolveCandidateLimit(limit);

    const nowMs = Date.now();
    const courses = (await fetchCourseCandidates(db, candidateLimit))
      .filter((course) => isCourseVisible(course, nowMs))
      .filter((course) => {
        if (featuredOnly === null) return true;
        return (course.featuredOnHome === true) === featuredOnly;
      })
      .map((course) => toSafeCourse(course.id, course, locale));

    const limitedCourses = typeof limit === "number" ? courses.slice(0, limit) : courses;

    return res.status(200).json({ courses: limitedCourses });
  } catch (error) {
    console.error("[courses.list] fail", {
      locale: req.query?.locale,
      featuredOnly: req.query?.featuredOnly,
      limit: req.query?.limit,
      message: error?.message || "unknown_error",
    });
    return res.status(500).json({ error: "Failed to load courses" });
  }
}
