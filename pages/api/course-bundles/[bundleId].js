import { getAdminDb } from "../../../lib/firebaseAdmin";
import { getOptionalAuth } from "../../../lib/requireAuth";
import {
  COURSE_BUNDLE_COLLECTION,
  isCourseBundleVisible,
  loadBundleCourses,
  normalizeBundleCourseIds,
  resolveBundleAccess,
  toSafeCourseBundle,
} from "../../../lib/courseBundles";
import { resolveCourseRequestChannel } from "../../../lib/courses";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).end("Method Not Allowed");
  }

  const bundleId = Array.isArray(req.query?.bundleId)
    ? req.query.bundleId[0]
    : req.query?.bundleId;
  if (!bundleId || typeof bundleId !== "string") {
    return res.status(400).json({ error: "Missing bundleId" });
  }

  const locale =
    typeof req.query?.locale === "string"
      ? req.query.locale
      : Array.isArray(req.query?.locale)
      ? req.query.locale[0]
      : "ro";
  const channel = resolveCourseRequestChannel(req);

  try {
    const db = getAdminDb();
    const snap = await db.collection(COURSE_BUNDLE_COLLECTION).doc(bundleId).get();
    if (!snap.exists || !isCourseBundleVisible(snap.data())) {
      return res.status(404).json({ error: "Course bundle not found" });
    }

    const data = snap.data() || {};
    const authUser = await getOptionalAuth(req);
    const access = await resolveBundleAccess(db, authUser?.uid || null, bundleId, data);
    const courses = await loadBundleCourses(db, data.courseIds, locale, {
      visibleOnly: true,
      ...(access.hasAccess ? {} : { channel }),
    });
    const courseIds = normalizeBundleCourseIds(data.courseIds);
    if (courses.length < 2 || (!access.hasAccess && courses.length !== courseIds.length)) {
      return res.status(404).json({ error: "Course bundle not available" });
    }
    res.setHeader("Cache-Control", "private, no-store, max-age=0");
    return res.status(200).json({
      bundle: toSafeCourseBundle(bundleId, data, locale, courses),
      hasAccess: access.hasAccess,
      ownedCourseIds: access.ownedCourseIds,
      missingCourseIds: access.missingCourseIds,
    });
  } catch (error) {
    console.error("[course-bundles.detail] fail", {
      bundleId,
      message: error?.message || "unknown_error",
    });
    return res.status(500).json({ error: "Failed to load course bundle" });
  }
}
