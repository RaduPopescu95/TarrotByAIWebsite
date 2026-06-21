export const COURSE_STATUSES = ["draft", "published", "scheduled", "archived"];

export function normalizePurchaseCount(data) {
  const raw = data?.purchaseCount;
  if (typeof raw !== "number" || !Number.isFinite(raw)) return 0;
  return Math.max(0, Math.trunc(raw));
}

export async function resolveCoursePurchaseCount(db, courseId, courseData) {
  const storedCount = normalizePurchaseCount(courseData);
  if (!db || !courseId) return storedCount;

  try {
    const purchasesSnap = await db
      .collectionGroup("purchases")
      .where("courseId", "==", courseId)
      .where("status", "==", "paid")
      .get();
    return Math.max(storedCount, purchasesSnap.size);
  } catch (error) {
    console.warn("[coursePurchases] collection_group_count_fail", {
      courseId,
      storedCount,
      message: error?.message || "unknown_error",
    });
    return storedCount;
  }
}
