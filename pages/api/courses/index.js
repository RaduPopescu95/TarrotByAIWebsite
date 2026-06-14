import { buildPublicCacheControl } from "../../../lib/httpCache";
import { withFirestoreReadTelemetry } from "../../../lib/firestoreCostLogger";
import { loadVisibleCourseCandidates } from "../../../lib/coursesCache";
import {
  isCourseVisible,
  parseQueryBoolean,
  readSingleQueryValue,
  toSafeCourse,
} from "../../../lib/courses";

async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).end("Method Not Allowed");
  }

  try {
    const locale = readSingleQueryValue(req.query?.locale);
    const featuredOnly = parseQueryBoolean(req.query?.featuredOnly);

    const nowMs = Date.now();
    const candidates = await loadVisibleCourseCandidates({
      page: "api.courses.list",
      queryName: "courses.visible_by_updated",
    });
    const filteredCourses = candidates
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
