import { getAdminDb } from "../../../lib/firebaseAdmin";
import { getOptionalAuth } from "../../../lib/requireAuth";
import {
  isCourseVisible,
  toSafeCourse,
  applyCourseDetailContentGate,
  resolveCourseAvailableLocales,
} from "../../../lib/courses";
import { resolveCourseEntitlement } from "../../../lib/courseSubscriptionAccess";
import {
  withFirestoreCostLog,
  withFirestoreReadTelemetry,
} from "../../../lib/firestoreCostLogger";

function maskUid(value) {
  if (typeof value !== "string" || !value) return "anonymous";
  if (value.length <= 6) return value;
  return `${value.slice(0, 3)}...${value.slice(-3)}`;
}

async function handler(req, res) {
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
    const courseSnap = await withFirestoreCostLog(
      {
        page: "api.courses.detail",
        queryName: "courses.by_id",
        operationType: "document",
      },
      () => courseRef.get()
    );

    if (!courseSnap.exists) {
      console.warn("[courses.entitlement] course_not_found", {
        courseId,
      });
      return res.status(404).json({ error: "Course not found" });
    }

    const rawCourseData = courseSnap.data() || {};
    const courseData = rawCourseData;
    const isVisible = isCourseVisible(courseData, Date.now());

    let purchaseStatus = "none";
    const decoded = await getOptionalAuth(req);
    const uidLabel = maskUid(decoded?.uid);

    const entitlement = await resolveCourseEntitlement(
      db,
      decoded?.uid || null,
      courseId,
      rawCourseData,
      { courseVisible: isVisible }
    );
    const hasAccess = entitlement.hasAccess;
    const accessSource = entitlement.accessSource;

    if (decoded?.uid) {
      const purchaseSnap = await withFirestoreCostLog(
        {
          page: "api.courses.detail",
          queryName: "users.purchases.debug_by_course",
          operationType: "document",
        },
        () =>
          db
            .collection("users")
            .doc(decoded.uid)
            .collection("purchases")
            .doc(courseId)
            .get()
      );
      const purchaseData = purchaseSnap.exists ? purchaseSnap.data() || {} : {};
      purchaseStatus =
        purchaseSnap.exists && typeof purchaseData.status === "string"
          ? purchaseData.status
          : purchaseSnap.exists
          ? "missing_status"
          : "missing_purchase_doc";

      console.info("[courses.entitlement] purchase_lookup", {
        courseId,
        uid: uidLabel,
        purchaseExists: purchaseSnap.exists,
        purchaseStatus,
        paymentStatus: purchaseData?.paymentStatus || null,
        lastWebhookEventType: purchaseData?.lastWebhookEventType || null,
        lastWebhookEventId: purchaseData?.lastWebhookEventId || null,
        subscriptionUnlock: entitlement.subscriptionUnlock,
        sitePremiumActive: entitlement.sitePremiumActive,
        courseIncludedInPremium: entitlement.courseIncludedInPremium,
        accessSource,
        freeCourse: entitlement.accessSource === "free",
      });
    } else if (entitlement.accessSource === "free") {
      console.info("[courses.entitlement] free_course_anonymous", { courseId });
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

    const safeCourse = applyCourseDetailContentGate(
      toSafeCourse(courseId, courseData, locale, {
        includeDetailContent: true,
      }),
      hasAccess
    );

    const mediaSnap = await withFirestoreCostLog(
      {
        page: "api.courses.detail",
        queryName: "courseMedia.by_course_id",
        operationType: "document",
      },
      () => db.collection("courseMedia").doc(courseId).get()
    );
    const mediaData = mediaSnap.exists ? mediaSnap.data() || {} : null;
    const availableLocales = resolveCourseAvailableLocales(courseData, mediaData);

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
      accessSource,
      freeCourse: accessSource === "free",
      hasCustomThumbnail: safeCourse.hasCustomThumbnail === true,
      hasVimeoPreview: safeCourse.hasVimeoPreview === true,
      hasPreviewVimeoId: Boolean(safeCourse.previewVimeoId),
      hasThumbnailUrl: Boolean(safeCourse.thumbnailUrl),
    });

    return res.status(200).json({
      course: safeCourse,
      isVisible,
      hasAccess,
      availableLocales,
      ...(accessSource ? { accessSource } : {}),
    });
  } catch (error) {
    console.error("[courses.entitlement] state_failed", {
      courseId,
      message: error?.message || "unknown_error",
    });
    return res.status(500).json({ error: "Failed to load course" });
  }
}

export default withFirestoreReadTelemetry("/api/courses/[courseId]", handler);
