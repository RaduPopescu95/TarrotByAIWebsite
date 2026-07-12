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

function validateUpdate(input) {
  const errors = [];
  if (input.title !== undefined && (typeof input.title !== "string" || !input.title.trim())) {
    errors.push("title");
  }
  if (
    input.description !== undefined &&
    (typeof input.description !== "string" || !input.description.trim())
  ) {
    errors.push("description");
  }
  if (input.courseIds !== undefined && !hasValidBundleCourseIds(input.courseIds)) {
    errors.push("courseIds");
  }
  if (
    input.price !== undefined &&
    (typeof input.price !== "number" || !Number.isFinite(input.price) || input.price <= 0)
  ) {
    errors.push("price");
  }
  if (input.currency !== undefined && !ALLOWED_CURRENCIES.includes(input.currency)) {
    errors.push("currency");
  }
  if (
    input.revenueCatProductId !== undefined &&
    input.revenueCatProductId !== null &&
    typeof input.revenueCatProductId !== "string"
  ) {
    errors.push("revenueCatProductId");
  }
  if (input.status !== undefined && !COURSE_BUNDLE_STATUSES.includes(input.status)) {
    errors.push("status");
  }
  if (input.availableOnWebsite !== undefined && typeof input.availableOnWebsite !== "boolean") {
    errors.push("availableOnWebsite");
  }
  if (input.availableOnMobile !== undefined && typeof input.availableOnMobile !== "boolean") {
    errors.push("availableOnMobile");
  }
  if (
    input.locales !== undefined &&
    (!input.locales || typeof input.locales !== "object" || Array.isArray(input.locales))
  ) {
    errors.push("locales");
  }
  if (
    input.thumbnailUrl !== undefined &&
    input.thumbnailUrl !== null &&
    typeof input.thumbnailUrl !== "string"
  ) {
    errors.push("thumbnailUrl");
  }
  if (
    input.coverSource !== undefined &&
    input.coverSource !== null &&
    !COURSE_BUNDLE_COVER_SOURCES.includes(input.coverSource)
  ) {
    errors.push("coverSource");
  }
  if (
    input.coverCourseId !== undefined &&
    input.coverCourseId !== null &&
    typeof input.coverCourseId !== "string"
  ) {
    errors.push("coverCourseId");
  }
  return errors;
}

export default async function handler(req, res) {
  try {
    requireDashboardAccess(req);
  } catch (error) {
    return res.status(error.statusCode || 401).json({ error: error.message });
  }

  const bundleId = Array.isArray(req.query?.bundleId)
    ? req.query.bundleId[0]
    : req.query?.bundleId;
  if (!bundleId) return res.status(400).json({ error: "Missing bundleId" });

  const db = getAdminDb();
  const ref = db.collection(COURSE_BUNDLE_COLLECTION).doc(bundleId);
  const existing = await ref.get();
  if (!existing.exists) return res.status(404).json({ error: "Course bundle not found" });

  if (req.method === "GET") {
    const data = existing.data() || {};
    const courses = await loadBundleCourses(db, data.courseIds, "ro");
    return res.status(200).json({ id: existing.id, ...data, courses });
  }

  if (req.method === "PUT") {
    const input = req.body || {};
    const errors = validateUpdate(input);
    if (errors.length) {
      return res.status(400).json({ error: "Invalid fields", fields: errors });
    }

    const current = existing.data() || {};
    const purchaseCount = Number(current.purchaseCount || 0);
    if (
      purchaseCount > 0 &&
      input.courseIds !== undefined &&
      JSON.stringify(normalizeBundleCourseIds(input.courseIds)) !==
        JSON.stringify(normalizeBundleCourseIds(current.courseIds))
    ) {
      return res.status(409).json({
        error: "Bundle courses cannot be changed after the first purchase",
      });
    }

    if (input.courseIds !== undefined) {
      const normalizedInputIds = normalizeBundleCourseIds(input.courseIds);
      const courses = await loadBundleCourses(db, input.courseIds, "ro");
      if (courses.length !== normalizedInputIds.length) {
        return res.status(400).json({ error: "All selected courses must exist" });
      }
    }
    const nextStatus = input.status ?? current.status;
    const nextCourseIds =
      input.courseIds !== undefined ? input.courseIds : current.courseIds;
    const nextAvailableOnWebsite =
      input.availableOnWebsite ?? current.availableOnWebsite ?? true;
    const nextAvailableOnMobile =
      input.availableOnMobile ?? current.availableOnMobile ?? true;
    if (nextStatus === "published" && !nextAvailableOnWebsite && !nextAvailableOnMobile) {
      return res.status(400).json({ error: "Invalid fields", fields: ["availability"] });
    }
    if (nextStatus === "published") {
      const normalizedNextIds = normalizeBundleCourseIds(nextCourseIds);
      const compatibility = await resolveBundleCourseChannelCompatibility(db, normalizedNextIds, {
        availableOnWebsite: nextAvailableOnWebsite,
        availableOnMobile: nextAvailableOnMobile,
      });
      if (!compatibility.compatible) {
        return res.status(400).json({
          error: "Selected courses are not available on all enabled bundle channels",
          fields: ["availability"],
          ...compatibility,
        });
      }
    }

    const coverFieldsTouched =
      input.coverSource !== undefined ||
      input.coverCourseId !== undefined ||
      input.thumbnailUrl !== undefined;
    const coverPayload = {};

    if (!coverFieldsTouched && input.courseIds !== undefined) {
      const currentCoverSource = current.coverSource || "none";
      const currentCoverCourseId =
        typeof current.coverCourseId === "string" ? current.coverCourseId : null;
      const effectiveCourseIds = normalizeBundleCourseIds(nextCourseIds);
      if (
        currentCoverSource === "course" &&
        (!currentCoverCourseId || !effectiveCourseIds.includes(currentCoverCourseId))
      ) {
        coverPayload.coverSource = "none";
        coverPayload.coverCourseId = null;
        coverPayload.thumbnailUrl = null;
      }
    }

    if (coverFieldsTouched) {
      const nextCoverSource =
        input.coverSource !== undefined && input.coverSource !== null
          ? input.coverSource
          : current.coverSource || "none";
      const effectiveCourseIds = normalizeBundleCourseIds(nextCourseIds);
      if (nextCoverSource === "course") {
        const candidate =
          input.coverCourseId !== undefined
            ? input.coverCourseId
            : current.coverCourseId;
        const coverCourseId =
          typeof candidate === "string" ? candidate.trim() : "";
        if (!coverCourseId || !effectiveCourseIds.includes(coverCourseId)) {
          return res.status(400).json({
            error: "Invalid fields",
            fields: ["coverCourseId"],
          });
        }
        coverPayload.coverSource = "course";
        coverPayload.coverCourseId = coverCourseId;
        coverPayload.thumbnailUrl = null;
      } else if (nextCoverSource === "custom") {
        const candidate =
          input.thumbnailUrl !== undefined
            ? input.thumbnailUrl
            : current.thumbnailUrl;
        const thumb = typeof candidate === "string" ? candidate.trim() : "";
        if (!thumb) {
          return res.status(400).json({
            error: "Invalid fields",
            fields: ["thumbnailUrl"],
          });
        }
        coverPayload.coverSource = "custom";
        coverPayload.coverCourseId = null;
        coverPayload.thumbnailUrl = thumb;
      } else {
        coverPayload.coverSource = "none";
        coverPayload.coverCourseId = null;
        coverPayload.thumbnailUrl = null;
      }
    }

    const payload = {
      ...(input.title !== undefined ? { title: input.title.trim() } : {}),
      ...(input.description !== undefined
        ? { description: input.description.trim() }
        : {}),
      ...(input.courseIds !== undefined
        ? { courseIds: normalizeBundleCourseIds(input.courseIds) }
        : {}),
      ...(input.price !== undefined ? { price: input.price } : {}),
      ...(input.currency !== undefined ? { currency: input.currency } : {}),
      ...(input.revenueCatProductId !== undefined
        ? {
            revenueCatProductId:
              typeof input.revenueCatProductId === "string"
                ? input.revenueCatProductId.trim() || null
                : null,
          }
        : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.availableOnWebsite !== undefined
        ? { availableOnWebsite: input.availableOnWebsite === true }
        : {}),
      ...(input.availableOnMobile !== undefined
        ? { availableOnMobile: input.availableOnMobile === true }
        : {}),
      ...coverPayload,
      ...(input.locales !== undefined ? { locales: input.locales } : {}),
      updatedAt: FieldValue.serverTimestamp(),
    };
    await ref.set(payload, { merge: true });
    return res.status(200).json({ id: bundleId });
  }

  if (req.method === "DELETE") {
    const purchaseCount = Number(existing.data()?.purchaseCount || 0);
    if (purchaseCount > 0) {
      await ref.set(
        { status: "archived", updatedAt: FieldValue.serverTimestamp() },
        { merge: true }
      );
      return res.status(200).json({ id: bundleId, archived: true });
    }
    await ref.delete();
    return res.status(204).end();
  }

  res.setHeader("Allow", "GET, PUT, DELETE");
  return res.status(405).end("Method Not Allowed");
}
