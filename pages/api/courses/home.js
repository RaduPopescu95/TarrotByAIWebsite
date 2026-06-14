import { buildPublicCacheControl } from "../../../lib/httpCache";
import {
  recordFirestoreCacheHit,
  withFirestoreReadTelemetry,
} from "../../../lib/firestoreCostLogger";
import { loadVisibleCourseCandidates } from "../../../lib/coursesCache";
import {
  isCourseVisible,
  readSingleQueryValue,
  toSafeCourse,
} from "../../../lib/courses";

const LATEST_LIMIT = 4;

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
    const nowMs = Date.now();
    // Single shared candidate read (status in [published, scheduled], ordered
    // by updatedAt desc) serves both the "latest" and "featured" sections. The
    // featured set is the same docs the previous dedicated query returned
    // (featuredOnHome === true, same order), so the response is unchanged.
    const candidates = await loadVisibleCourseCandidates({
      page: "api.courses.home",
      queryName: "courses.latest_visible",
    });
    recordFirestoreCacheHit({
      page: "api.courses.home",
      queryName: "courses.featured_visible",
    });

    const visibleCandidates = candidates.filter((course) => isCourseVisible(course, nowMs));
    const latestCourses = visibleCandidates
      .slice(0, LATEST_LIMIT)
      .map((course) => toSafeCourse(course.id, course, locale));

    const featuredCourses = visibleCandidates
      .filter((course) => course.featuredOnHome === true)
      .map((course) => toSafeCourse(course.id, course, locale));

    console.info("[courses.home] success", {
      candidatesCount: candidates.length,
      visibleCandidatesCount: visibleCandidates.length,
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
