import { getAdminDb } from "../../../lib/firebaseAdmin";
import {
  isCourseVisible,
  parseQueryBoolean,
  parseQueryPositiveLimit,
  readSingleQueryValue,
  toSafeCourse,
} from "../../../lib/courses";

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

    const nowMs = Date.now();
    const courses = (await fetchCourseCandidates(db))
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
