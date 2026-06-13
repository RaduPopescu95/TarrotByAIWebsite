import { buildPublicCacheControl } from "../../../lib/httpCache";
import { getAdminDb } from "../../../lib/firebaseAdmin";
import {
  withFirestoreCostLog,
  withFirestoreReadTelemetry,
} from "../../../lib/firestoreCostLogger";
import {
  isCourseVisible,
  readSingleQueryValue,
  toSafeCourse,
} from "../../../lib/courses";

const LATEST_LIMIT = 4;

async function fetchLatestCourseCandidates(db) {
  try {
    const snapshot = await withFirestoreCostLog(
      { page: "api.courses.home", queryName: "courses.latest_visible" },
      () =>
        db
          .collection("courses")
          .where("status", "in", ["published", "scheduled"])
          .orderBy("updatedAt", "desc")
          .get()
    );

    return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
  } catch (error) {
    console.warn("[courses.home] latest_query_fallback", {
      message: error?.message || "unknown_error",
    });
    const fallbackSnapshot = await withFirestoreCostLog(
      { page: "api.courses.home", queryName: "courses.latest_fallback" },
      () => db.collection("courses").orderBy("updatedAt", "desc").get()
    );

    return fallbackSnapshot.docs
      .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
      .filter((course) => course.status === "published" || course.status === "scheduled");
  }
}

async function fetchFeaturedCourseCandidates(db) {
  try {
    const snapshot = await withFirestoreCostLog(
      { page: "api.courses.home", queryName: "courses.featured_visible" },
      () =>
        db
          .collection("courses")
          .where("featuredOnHome", "==", true)
          .where("status", "in", ["published", "scheduled"])
          .orderBy("updatedAt", "desc")
          .get()
    );

    return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
  } catch (error) {
    console.warn("[courses.home] featured_query_fallback", {
      message: error?.message || "unknown_error",
    });
    const fallbackSnapshot = await withFirestoreCostLog(
      { page: "api.courses.home", queryName: "courses.featured_fallback" },
      () =>
        db
          .collection("courses")
          .where("featuredOnHome", "==", true)
          .orderBy("updatedAt", "desc")
          .get()
    );

    return fallbackSnapshot.docs
      .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
      .filter((course) => course.status === "published" || course.status === "scheduled");
  }
}

async function handler(req, res) {
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
    const latestCourses = visibleLatestCandidates
      .slice(0, LATEST_LIMIT)
      .map((course) => toSafeCourse(course.id, course, locale));

    const featuredCourses = visibleFeaturedCandidates
      .map((course) => toSafeCourse(course.id, course, locale));

    console.info("[courses.home] success", {
      latestCandidatesCount: latestCandidates.length,
      featuredCandidatesCount: featuredCandidates.length,
      latestCount: latestCourses.length,
      featuredCount: featuredCourses.length,
    });

    res.setHeader(
      "Cache-Control",
      buildPublicCacheControl({
        sMaxageSeconds: 300,
        staleWhileRevalidateSeconds: 600,
      })
    );

    return res.status(200).json({ latestCourses, featuredCourses });
  } catch (error) {
    console.error("[courses.home] fail", {
      message: error?.message || "unknown_error",
    });
    return res.status(500).json({ error: "Failed to load homepage courses" });
  }
}

export default withFirestoreReadTelemetry("/api/courses/home", handler);
