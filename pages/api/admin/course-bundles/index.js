import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "../../../../lib/firebaseAdmin";
import { requireDashboardAccess } from "../../../../lib/requireAuth";
import {
  COURSE_BUNDLE_COLLECTION,
  COURSE_BUNDLE_COVER_SOURCES,
  COURSE_BUNDLE_STATUSES,
  hasValidBundleCourseIds,
  loadBundleCourses,
  normalizeBundleCourseIds,
  resolveBundleCourseChannelCompatibility,
} from "../../../../lib/courseBundles";

const ALLOWED_CURRENCIES = ["RON", "EUR"];

function validateLocales(value) {
  if (value === undefined) return true;
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  return Object.values(value).every(
    (entry) =>
      entry &&
      typeof entry === "object" &&
      !Array.isArray(entry) &&
      typeof entry.title === "string" &&
      (entry.description === undefined || typeof entry.description === "string")
  );
}

function validateInput(input) {
  const errors = [];
  if (typeof input.title !== "string" || !input.title.trim()) errors.push("title");
  if (typeof input.description !== "string" || !input.description.trim()) {
    errors.push("description");
  }
  if (!hasValidBundleCourseIds(input.courseIds)) errors.push("courseIds");
  if (
    typeof input.price !== "number" ||
    !Number.isFinite(input.price) ||
    input.price <= 0
  ) {
    errors.push("price");
  }
  if (!ALLOWED_CURRENCIES.includes(input.currency)) errors.push("currency");
  if (!COURSE_BUNDLE_STATUSES.includes(input.status)) errors.push("status");
  if (input.availableOnWebsite !== undefined && typeof input.availableOnWebsite !== "boolean") {
    errors.push("availableOnWebsite");
  }
  if (input.availableOnMobile !== undefined && typeof input.availableOnMobile !== "boolean") {
    errors.push("availableOnMobile");
  }
  if (
    input.status === "published" &&
    input.availableOnWebsite === false &&
    input.availableOnMobile === false
  ) {
    errors.push("availability");
  }
  if (
    input.thumbnailUrl !== undefined &&
    input.thumbnailUrl !== null &&
    typeof input.thumbnailUrl !== "string"
  ) {
    errors.push("thumbnailUrl");
  }

  const coverSource =
    input.coverSource === undefined || input.coverSource === null
      ? "none"
      : input.coverSource;
  if (!COURSE_BUNDLE_COVER_SOURCES.includes(coverSource)) {
    errors.push("coverSource");
  } else {
    const courseIds = normalizeBundleCourseIds(input.courseIds);
    if (coverSource === "course") {
      const coverCourseId =
        typeof input.coverCourseId === "string" ? input.coverCourseId.trim() : "";
      if (!coverCourseId || !courseIds.includes(coverCourseId)) {
        errors.push("coverCourseId");
      }
    }
    if (coverSource === "custom") {
      const thumb =
        typeof input.thumbnailUrl === "string" ? input.thumbnailUrl.trim() : "";
      if (!thumb) errors.push("thumbnailUrl");
    }
  }

  if (!validateLocales(input.locales)) errors.push("locales");
  return errors;
}

export default async function handler(req, res) {
  try {
    requireDashboardAccess(req);
  } catch (error) {
    return res.status(error.statusCode || 401).json({ error: error.message });
  }

  const db = getAdminDb();
  if (req.method === "GET") {
    try {
      const snapshot = await db.collection(COURSE_BUNDLE_COLLECTION).get();
      const bundles = await Promise.all(
        snapshot.docs.map(async (docSnap) => {
          const data = docSnap.data() || {};
          const courses = await loadBundleCourses(db, data.courseIds, "ro");
          return { id: docSnap.id, ...data, courses };
        })
      );
      bundles.sort((left, right) => {
        const leftMs = left?.updatedAt?.toMillis?.() || left?.updatedAt?.seconds * 1000 || 0;
        const rightMs = right?.updatedAt?.toMillis?.() || right?.updatedAt?.seconds * 1000 || 0;
        return rightMs - leftMs;
      });
      return res.status(200).json({ bundles });
    } catch (error) {
      console.error("[admin.course-bundles] list_fail", {
        message: error?.message || "unknown_error",
      });
      return res.status(500).json({ error: "Failed to load course bundles" });
    }
  }

  if (req.method === "POST") {
    const input = req.body || {};
    const errors = validateInput(input);
    if (errors.length) {
      return res.status(400).json({ error: "Invalid fields", fields: errors });
    }
    const courseIds = normalizeBundleCourseIds(input.courseIds);
    const availableOnWebsite = input.availableOnWebsite !== false;
    const availableOnMobile = input.availableOnMobile !== false;
    const courses = await loadBundleCourses(db, courseIds, "ro");
    if (courses.length !== courseIds.length) {
      return res.status(400).json({ error: "All selected courses must exist" });
    }
    if (input.status === "published") {
      const compatibility = await resolveBundleCourseChannelCompatibility(db, courseIds, {
        availableOnWebsite,
        availableOnMobile,
      });
      if (!compatibility.compatible) {
        return res.status(400).json({
          error: "Selected courses are not available on all enabled bundle channels",
          fields: ["availability"],
          ...compatibility,
        });
      }
    }

    const coverSource =
      input.coverSource === undefined || input.coverSource === null
        ? "none"
        : input.coverSource;
    const coverCourseId =
      coverSource === "course" && typeof input.coverCourseId === "string"
        ? input.coverCourseId.trim() || null
        : null;
    const persistedThumbnailUrl =
      coverSource === "custom"
        ? (typeof input.thumbnailUrl === "string" && input.thumbnailUrl.trim()) || null
        : null;

    try {
      const ref = db.collection(COURSE_BUNDLE_COLLECTION).doc();
      await ref.set({
        title: input.title.trim(),
        description: input.description.trim(),
        courseIds,
        price: input.price,
        currency: input.currency,
        status: input.status,
        availableOnWebsite,
        availableOnMobile,
        thumbnailUrl: persistedThumbnailUrl,
        coverSource,
        coverCourseId,
        locales: input.locales || {},
        purchaseCount: 0,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        createdBy: "dashboard",
      });
      return res.status(201).json({ id: ref.id });
    } catch (error) {
      console.error("[admin.course-bundles] create_fail", {
        message: error?.message || "unknown_error",
      });
      return res.status(500).json({ error: "Failed to create course bundle" });
    }
  }

  res.setHeader("Allow", "GET, POST");
  return res.status(405).end("Method Not Allowed");
}
