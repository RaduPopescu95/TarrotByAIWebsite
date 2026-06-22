import { buildPublicCacheControl } from "../../../lib/httpCache";
import { getAdminDb } from "../../../lib/firebaseAdmin";
import {
  COURSE_BUNDLE_COLLECTION,
  isCourseBundleVisible,
  loadBundleCourses,
  toSafeCourseBundle,
} from "../../../lib/courseBundles";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).end("Method Not Allowed");
  }

  const locale =
    typeof req.query?.locale === "string"
      ? req.query.locale
      : Array.isArray(req.query?.locale)
      ? req.query.locale[0]
      : "ro";

  try {
    const db = getAdminDb();
    const snapshot = await db
      .collection(COURSE_BUNDLE_COLLECTION)
      .where("status", "==", "published")
      .get();
    const rows = await Promise.all(
      snapshot.docs.map(async (docSnap) => {
        const data = docSnap.data() || {};
        if (!isCourseBundleVisible(data)) return null;
        const courses = await loadBundleCourses(db, data.courseIds, locale, {
          visibleOnly: true,
        });
        if (courses.length < 2) return null;
        return toSafeCourseBundle(docSnap.id, data, locale, courses);
      })
    );
    const bundles = rows
      .filter(Boolean)
      .sort((left, right) => {
        const leftMs = left?.updatedAt?.toMillis?.() || left?.updatedAt?.seconds * 1000 || 0;
        const rightMs = right?.updatedAt?.toMillis?.() || right?.updatedAt?.seconds * 1000 || 0;
        return rightMs - leftMs;
      });

    res.setHeader(
      "Cache-Control",
      buildPublicCacheControl({
        sMaxageSeconds: 300,
        staleWhileRevalidateSeconds: 600,
      })
    );
    return res.status(200).json({ bundles });
  } catch (error) {
    console.error("[course-bundles.list] fail", {
      message: error?.message || "unknown_error",
    });
    return res.status(500).json({ error: "Failed to load course bundles" });
  }
}
