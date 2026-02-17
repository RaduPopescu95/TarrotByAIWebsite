import { getAdminDb } from "../../../lib/firebaseAdmin";
import { getOptionalAuth } from "../../../lib/requireAuth";
import { extractVimeoId, isCourseVisible, toSafeCourse } from "../../../lib/courses";

const COURSE_MEDIA_COLLECTION = "courseMedia";
const VIMEO_ID_PATTERN = /^\d+$/;

function normalizeVimeoId(value) {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  if (!normalized || !VIMEO_ID_PATTERN.test(normalized)) return null;
  return normalized;
}

function resolvePreviewVimeoId(course, media) {
  const candidates = [
    course?.vimeoPreviewVideoId,
    course?.vimeoId,
    media?.vimeoId,
    extractVimeoId(media?.vimeoUrl),
    extractVimeoId(course?.vimeoUrl),
  ];

  for (const candidate of candidates) {
    const normalized = normalizeVimeoId(candidate);
    if (normalized) return normalized;
  }

  return null;
}

async function attachPreviewFallbackFromMedia(db, courseId, courseData = {}) {
  try {
    const mediaSnap = await db.collection(COURSE_MEDIA_COLLECTION).doc(courseId).get();
    const media = mediaSnap.exists ? mediaSnap.data() : null;
    const fallbackPreviewVimeoId = resolvePreviewVimeoId(courseData, media);
    if (!fallbackPreviewVimeoId) return courseData;

    if (typeof courseData.vimeoPreviewVideoId === "string" && courseData.vimeoPreviewVideoId.trim()) {
      return courseData;
    }

    return {
      ...courseData,
      vimeoPreviewVideoId: fallbackPreviewVimeoId,
    };
  } catch (error) {
    console.warn("[courses.entitlement] preview_media_fallback_failed", {
      courseId,
      message: error?.message || "unknown_error",
    });
    return courseData;
  }
}

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

    const rawCourseData = courseSnap.data() || {};
    const courseData = await attachPreviewFallbackFromMedia(db, courseId, rawCourseData);
    const isVisible = isCourseVisible(courseData, Date.now());

    let hasAccess = false;
    let purchaseStatus = "none";
    const decoded = await getOptionalAuth(req);
    const uidLabel = maskUid(decoded?.uid);
    if (decoded?.uid) {
      const purchaseSnap = await db
        .collection("users")
        .doc(decoded.uid)
        .collection("purchases")
        .doc(courseId)
        .get();
      const purchaseData = purchaseSnap.exists ? purchaseSnap.data() || {} : {};
      purchaseStatus =
        purchaseSnap.exists && typeof purchaseData.status === "string"
          ? purchaseData.status
          : purchaseSnap.exists
          ? "missing_status"
          : "missing_purchase_doc";
      hasAccess = purchaseSnap.exists && purchaseData.status === "paid";

      console.info("[courses.entitlement] purchase_lookup", {
        courseId,
        uid: uidLabel,
        purchaseExists: purchaseSnap.exists,
        purchaseStatus,
        paymentStatus: purchaseData?.paymentStatus || null,
        lastWebhookEventType: purchaseData?.lastWebhookEventType || null,
        lastWebhookEventId: purchaseData?.lastWebhookEventId || null,
      });
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
      purchaseStatus,
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
