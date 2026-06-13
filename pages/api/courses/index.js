import { buildPublicCacheControl } from "../../../lib/httpCache";
import { getAdminDb } from "../../../lib/firebaseAdmin";
import {
  withFirestoreCostLog,
  withFirestoreReadTelemetry,
} from "../../../lib/firestoreCostLogger";
import {
  isCourseVisible,
  parseQueryBoolean,
  readSingleQueryValue,
  toSafeCourse,
} from "../../../lib/courses";

async function fetchCourseCandidates(db) {
  try {
    const snapshot = await withFirestoreCostLog(
      { page: "api.courses.list", queryName: "courses.visible_by_updated" },
      () =>
        db
          .collection("courses")
          .where("status", "in", ["published", "scheduled"])
          .orderBy("updatedAt", "desc")
          .get()
    );

    return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
  } catch (error) {
    console.warn("[courses.list] list_query_fallback", {
      message: error?.message || "unknown_error",
    });
    const fallbackSnapshot = await withFirestoreCostLog(
      { page: "api.courses.list", queryName: "courses.updated_fallback" },
      () => db.collection("courses").orderBy("updatedAt", "desc").get()
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

    const courses = filteredCourses.map((course) => toSafeCourse(course.id, course, locale));

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

export default withFirestoreReadTelemetry("/api/courses", handler);
