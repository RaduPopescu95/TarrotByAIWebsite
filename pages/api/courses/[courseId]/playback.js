import { getAdminDb } from "../../../../lib/firebaseAdmin";
import { getOptionalAuth } from "../../../../lib/requireAuth";
import { extractVimeoId, isCourseVisible } from "../../../../lib/courses";
import {
  isCourseFreeFullAccess,
  resolveCourseEntitlement,
} from "../../../../lib/courseSubscriptionAccess";
import {
  withFirestoreCostLog,
  withFirestoreReadTelemetry,
} from "../../../../lib/firestoreCostLogger";

const COURSE_MEDIA_COLLECTION = "courseMedia";

function maskUid(value) {
  if (typeof value !== "string" || !value) return "unknown";
  if (value.length <= 6) return value;
  return `${value.slice(0, 3)}...${value.slice(-3)}`;
}

async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).end("Method Not Allowed");
  }

  res.setHeader("Cache-Control", "private, no-store, max-age=0");

  const {
    query: { courseId },
  } = req;

  if (!courseId || typeof courseId !== "string") {
    return res.status(400).json({ error: "Missing courseId" });
  }

  const decoded = await getOptionalAuth(req);
  const uid = decoded?.uid || null;

  console.info("[courses.entitlement] playback_start", {
    courseId,
    uid: maskUid(uid),
  });

  try {
    const db = getAdminDb();

    const courseSnap = await withFirestoreCostLog(
      {
        page: "api.courses.playback",
        queryName: "courses.by_id",
        operationType: "document",
      },
      () => db.collection("courses").doc(courseId).get()
    );
    if (!courseSnap.exists) {
      console.warn("[courses.entitlement] playback_course_not_found", {
        courseId,
        uid: maskUid(uid),
      });
      return res.status(404).json({ error: "Course not found" });
    }

    const courseData = courseSnap.data() || {};
    const courseVisible = isCourseVisible(courseData, Date.now());
    const entitlement = await resolveCourseEntitlement(db, uid, courseId, courseData, {
      courseVisible,
    });

    if (!entitlement.hasAccess) {
      console.info("[courses.entitlement] playback_denied", {
        courseId,
        uid: maskUid(uid),
      });
      if (!uid && !isCourseFreeFullAccess(courseData)) {
        return res.status(401).json({ error: "Authentication required" });
      }
      return res.status(403).json({ error: "No active entitlement for this course" });
    }

    const mediaSnap = await withFirestoreCostLog(
      {
        page: "api.courses.playback",
        queryName: "courseMedia.by_course",
        operationType: "document",
      },
      () => db.collection(COURSE_MEDIA_COLLECTION).doc(courseId).get()
    );

    const mediaData = mediaSnap.exists ? mediaSnap.data() : null;
    const vimeoUrl =
      (typeof mediaData?.vimeoUrl === "string" && mediaData.vimeoUrl) ||
      (typeof courseData?.vimeoUrl === "string" ? courseData.vimeoUrl : "");
    const vimeoId = mediaData?.vimeoId || courseData?.vimeoId || extractVimeoId(vimeoUrl);

    if (!vimeoId) {
      console.warn("[courses.entitlement] playback_source_missing", {
        courseId,
        uid: maskUid(uid),
      });
      return res.status(404).json({ error: "Playback source not found" });
    }

    console.info("[courses.entitlement] playback_ok", {
      courseId,
      uid: maskUid(uid),
      provider: "vimeo",
    });

    return res.status(200).json({ provider: "vimeo", vimeoId });
  } catch (error) {
    console.error("[courses.entitlement] playback_failed", {
      courseId,
      uid: maskUid(uid),
      message: error?.message || "unknown_error",
    });
    return res.status(500).json({ error: "Failed to load playback source" });
  }
}

export default withFirestoreReadTelemetry("/api/courses/[courseId]/playback", handler);
