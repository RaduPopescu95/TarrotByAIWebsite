import {
  isCourseVisible,
  isCourseVisibleOnChannel,
  resolveCourseLocaleFields,
  resolveDate,
  toSafeCourse,
} from "./courses";

export const COURSE_BUNDLE_COLLECTION = "courseBundles";
export const COURSE_BUNDLE_STATUSES = ["draft", "published", "archived"];
export const COURSE_BUNDLE_MIN_COURSES = 2;
export const COURSE_BUNDLE_COVER_SOURCES = ["none", "course", "custom"];

export function normalizeBundleCoverSource(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return COURSE_BUNDLE_COVER_SOURCES.includes(trimmed) ? trimmed : null;
}

export function resolveBundleThumbnailUrl(data = {}, courses = []) {
  const source = normalizeBundleCoverSource(data?.coverSource);
  const customUrl =
    typeof data?.thumbnailUrl === "string" && data.thumbnailUrl.trim()
      ? data.thumbnailUrl.trim()
      : null;

  if (source === "course") {
    const coverCourseId =
      typeof data?.coverCourseId === "string" && data.coverCourseId.trim()
        ? data.coverCourseId.trim()
        : null;
    if (!coverCourseId) return null;
    const linked = Array.isArray(courses)
      ? courses.find((c) => c && c.id === coverCourseId)
      : null;
    const linkedUrl =
      linked && typeof linked.thumbnailUrl === "string" && linked.thumbnailUrl.trim()
        ? linked.thumbnailUrl.trim()
        : null;
    return linkedUrl;
  }

  if (source === "custom") {
    return customUrl;
  }

  if (source === "none") {
    return null;
  }

  return customUrl;
}

export function normalizeBundleCourseIds(value) {
  if (!Array.isArray(value)) return [];
  return Array.from(
    new Set(
      value
        .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
        .filter(Boolean)
    )
  );
}

export function hasValidBundleCourseIds(value) {
  return normalizeBundleCourseIds(value).length >= COURSE_BUNDLE_MIN_COURSES;
}

export function isCourseBundleVisible(bundle) {
  return bundle?.status === "published";
}

export function resolveCourseBundleLocaleFields(data = {}, locale = "ro") {
  return resolveCourseLocaleFields(data, locale);
}

export function toSafeCourseBundle(bundleId, data = {}, locale = "ro", courses = []) {
  const localized = resolveCourseBundleLocaleFields(data, locale);
  const normalizedCourses = Array.isArray(courses) ? courses : [];
  const coverSource = normalizeBundleCoverSource(data.coverSource) || "none";
  const coverCourseId =
    typeof data.coverCourseId === "string" && data.coverCourseId.trim()
      ? data.coverCourseId.trim()
      : null;
  return {
    id: bundleId,
    title: localized.title,
    description: localized.description,
    courseIds: normalizeBundleCourseIds(data.courseIds),
    price: typeof data.price === "number" ? data.price : 0,
    currency: typeof data.currency === "string" ? data.currency : "RON",
    status: typeof data.status === "string" ? data.status : "draft",
    thumbnailUrl: resolveBundleThumbnailUrl(data, normalizedCourses),
    coverSource,
    coverCourseId,
    purchaseCount:
      typeof data.purchaseCount === "number" && Number.isFinite(data.purchaseCount)
        ? Math.max(0, Math.trunc(data.purchaseCount))
        : 0,
    courses: normalizedCourses,
    updatedAt: data.updatedAt ?? null,
  };
}

export async function loadBundleCourses(db, courseIds, locale = "ro", options = {}) {
  const normalizedIds = normalizeBundleCourseIds(courseIds);
  const snaps = await Promise.all(
    normalizedIds.map((courseId) => db.collection("courses").doc(courseId).get())
  );

  return snaps
    .map((snap, index) => {
      if (!snap.exists) return null;
      const data = snap.data() || {};
      if (options.visibleOnly === true) {
        const visible = options.channel
          ? isCourseVisibleOnChannel(data, options.channel, Date.now())
          : isCourseVisible(data, Date.now());
        if (!visible) return null;
      }
      return toSafeCourse(normalizedIds[index], data, locale);
    })
    .filter(Boolean);
}

export async function resolveOwnedBundleCourseIds(db, uid, courseIds) {
  if (!uid) return [];
  const normalizedIds = normalizeBundleCourseIds(courseIds);
  const snaps = await Promise.all(
    normalizedIds.map((courseId) =>
      db.collection("users").doc(uid).collection("purchases").doc(courseId).get()
    )
  );
  return normalizedIds.filter(
    (_, index) => snaps[index].exists && snaps[index].data()?.status === "paid"
  );
}

export async function resolveBundleAccess(db, uid, bundleId, bundleData) {
  const courseIds = normalizeBundleCourseIds(bundleData?.courseIds);
  if (!uid) {
    return {
      hasAccess: false,
      bundlePurchasePaid: false,
      ownedCourseIds: [],
      missingCourseIds: courseIds,
    };
  }

  const [bundlePurchaseSnap, ownedCourseIds] = await Promise.all([
    db.collection("users").doc(uid).collection("bundlePurchases").doc(bundleId).get(),
    resolveOwnedBundleCourseIds(db, uid, courseIds),
  ]);
  const bundlePurchasePaid =
    bundlePurchaseSnap.exists && bundlePurchaseSnap.data()?.status === "paid";
  const ownedSet = new Set(ownedCourseIds);
  const missingCourseIds = courseIds.filter((courseId) => !ownedSet.has(courseId));

  return {
    hasAccess: bundlePurchasePaid || missingCourseIds.length === 0,
    bundlePurchasePaid,
    ownedCourseIds,
    missingCourseIds,
  };
}

export function resolveBundlePurchaseDate(value) {
  const date = resolveDate(value);
  return date ? date.toISOString() : null;
}
