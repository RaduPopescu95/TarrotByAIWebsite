import { getAdminDb } from "../../../lib/firebaseAdmin";
import { getOptionalAuth } from "../../../lib/requireAuth";
import { isCourseVisible, toSafeCourse } from "../../../lib/courses";

function maskUid(value) {
  if (typeof value !== "string" || !value) return "anonymous";
  if (value.length <= 6) return value;
  return `${value.slice(0, 3)}...${value.slice(-3)}`;
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).end("Method Not Allowed");
  }

  const {
    query: { courseId },
  } = req;

  if (!courseId || typeof courseId !== "string") {
    return res.status(400).json({ error: "Missing courseId" });
  }

  console.info("[courses.entitlement] state_start", {
    courseId,
  });

  try {
    const db = getAdminDb();
    const locale =
      typeof req.query?.locale === "string"
        ? req.query.locale
        : Array.isArray(req.query?.locale)
        ? req.query.locale[0]
        : undefined;

    const courseRef = db.collection("courses").doc(courseId);
    const courseSnap = await courseRef.get();

    if (!courseSnap.exists) {
      console.warn("[courses.entitlement] course_not_found", {
        courseId,
      });
      return res.status(404).json({ error: "Course not found" });
    }

    const courseData = courseSnap.data() || {};
    const isVisible = isCourseVisible(courseData, Date.now());

    let hasAccess = false;
    const decoded = await getOptionalAuth(req);
    const uidLabel = maskUid(decoded?.uid);
    if (decoded?.uid) {
      const purchaseSnap = await db
        .collection("users")
        .doc(decoded.uid)
        .collection("purchases")
        .doc(courseId)
        .get();
      hasAccess = purchaseSnap.exists && purchaseSnap.data()?.status === "paid";
    }

    if (!isVisible && !hasAccess) {
      console.info("[courses.entitlement] state_hidden", {
        courseId,
        uid: uidLabel,
        isVisible,
        hasAccess,
      });
      return res.status(404).json({ error: "Course not found" });
    }

    const safeCourse = toSafeCourse(courseId, courseData, locale, {
      includeDetailContent: true,
    });

    if (
      Array.isArray(safeCourse.curriculumLessons) &&
      safeCourse.curriculumLessons.length === 0 &&
      !safeCourse.notesContent &&
      !safeCourse.contactContent
    ) {
      console.warn("[courses.entitlement] detail_content_missing", {
        courseId,
        uid: uidLabel,
      });
    }

    console.info("[courses.entitlement] state_ok", {
      courseId,
      uid: uidLabel,
      isVisible,
      hasAccess,
      hasCustomThumbnail: safeCourse.hasCustomThumbnail === true,
      hasVimeoPreview: safeCourse.hasVimeoPreview === true,
      hasPreviewVimeoId: Boolean(safeCourse.previewVimeoId),
      hasThumbnailUrl: Boolean(safeCourse.thumbnailUrl),
    });

    return res.status(200).json({
      course: safeCourse,
      isVisible,
      hasAccess,
    });
  } catch (error) {
    console.error("[courses.entitlement] state_failed", {
      courseId,
      message: error?.message || "unknown_error",
    });
    return res.status(500).json({ error: "Failed to load course" });
  }
}
