import { getAdminDb } from "../../../lib/firebaseAdmin";
import { isCourseVisible, readSingleQueryValue, toSafeCourse } from "../../../lib/courses";

const LATEST_LIMIT = 4;

async function fetchCourseCandidates(db) {
  try {
    const snapshot = await db
      .collection("courses")
      .where("status", "in", ["published", "scheduled"])
      .orderBy("updatedAt", "desc")
      .get();
    return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
  } catch (error) {
    console.warn("[courses.home] list_query_fallback", {
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

  const locale = readSingleQueryValue(req.query?.locale);
  console.info("[courses.home] start", {
    locale: locale || "default",
  });

  try {
    const db = getAdminDb();
    const nowMs = Date.now();
    const visibleCourses = (await fetchCourseCandidates(db)).filter((course) =>
      isCourseVisible(course, nowMs)
    );

    const latestCourses = visibleCourses
      .slice(0, LATEST_LIMIT)
      .map((course) => toSafeCourse(course.id, course, locale));

    const featuredCourses = visibleCourses
      .filter((course) => course.featuredOnHome === true)
      .map((course) => toSafeCourse(course.id, course, locale));

    console.info("[courses.home] success", {
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
