import { hasPremiumAccess } from "./premiumAccess";

/**
 * Video complet gratuit: preț 0 în Firestore (setat din dashboard).
 */
export function isCourseFreeFullAccess(courseData) {
  if (!courseData || typeof courseData !== "object") return false;
  const price = Number(courseData.price);
  return Number.isFinite(price) && price === 0;
}

/**
 * Cursurile sunt deblocate de abonamentul site dacă `sitePremiumAccess` nu e explicit false.
 */
export function courseIncludedInSitePremium(courseData) {
  if (!courseData || typeof courseData !== "object") return false;
  return courseData.sitePremiumAccess !== false;
}

export async function getSitePremiumAccessForUid(db, uid) {
  if (!uid || typeof uid !== "string") return false;
  const snap = await db.collection("Users").doc(uid).get();
  if (!snap.exists) return false;
  return hasPremiumAccess(snap.data() || {});
}

export async function resolvePaidPurchase(db, uid, courseId) {
  if (!uid || !courseId) return false;
  const purchaseSnap = await db
    .collection("users")
    .doc(uid)
    .collection("purchases")
    .doc(courseId)
    .get();
  return purchaseSnap.exists && purchaseSnap.data()?.status === "paid";
}

/**
 * Entitlement: curs gratuit vizibil OR achiziție OR abonament site + curs inclus.
 * @param {{ courseVisible?: boolean }} options - gratuit doar dacă cursul e vizibil acum (draft ascuns rămâne blocat).
 */
export async function resolveCourseEntitlement(
  db,
  uid,
  courseId,
  courseData,
  options = {}
) {
  const courseVisible = options.courseVisible === true;
  const courseIncludedInPremium = courseIncludedInSitePremium(courseData);

  if (isCourseFreeFullAccess(courseData) && courseVisible) {
    return {
      hasAccess: true,
      purchasePaid: false,
      subscriptionUnlock: false,
      sitePremiumActive: false,
      courseIncludedInPremium,
      accessSource: "free",
    };
  }

  if (!uid) {
    return {
      hasAccess: false,
      purchasePaid: false,
      subscriptionUnlock: false,
      sitePremiumActive: false,
      courseIncludedInPremium,
      accessSource: null,
    };
  }

  const purchasePaid = await resolvePaidPurchase(db, uid, courseId);
  const sitePremiumActive = await getSitePremiumAccessForUid(db, uid);
  const subscriptionUnlock = courseIncludedInPremium && sitePremiumActive;
  const hasAccess = purchasePaid || subscriptionUnlock;

  let accessSource = null;
  if (hasAccess) {
    if (purchasePaid) accessSource = "purchase";
    else if (subscriptionUnlock) accessSource = "site_premium";
  }

  return {
    hasAccess,
    purchasePaid,
    subscriptionUnlock,
    sitePremiumActive,
    courseIncludedInPremium,
    accessSource,
  };
}
