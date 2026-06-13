import { hasPremiumAccess } from "./premiumAccess";
import { withFirestoreCostLog } from "./firestoreCostLogger";

/**
 * Video complet gratuit: preț 0 în Firestore (setat din dashboard).
 */
export function isCourseFreeFullAccess(courseData) {
  if (!courseData || typeof courseData !== "object") return false;
  const price = Number(courseData.price);
  return Number.isFinite(price) && price === 0;
}

/**
 * Cursul poate fi marcat în admin ca „inclus în premium” (`sitePremiumAccess`), dar
 * accesul efectiv prin abonament este dezactivat — cursurile se deblochează doar prin achiziție (sau gratuit).
 */
export function courseIncludedInSitePremium(courseData) {
  if (!courseData || typeof courseData !== "object") return false;
  return courseData.sitePremiumAccess !== false;
}

export async function getSitePremiumAccessForUid(db, uid) {
  if (!uid || typeof uid !== "string") return false;
  const snap = await withFirestoreCostLog(
    {
      page: "api.courses.entitlement",
      queryName: "Users.by_uid",
      operationType: "document",
    },
    () => db.collection("Users").doc(uid).get()
  );
  if (!snap.exists) return false;
  return hasPremiumAccess(snap.data() || {});
}

export async function resolvePaidPurchase(db, uid, courseId) {
  if (!uid || !courseId) return false;
  const purchaseSnap = await withFirestoreCostLog(
    {
      page: "api.courses.entitlement",
      queryName: "users.purchases.by_course",
      operationType: "document",
    },
    () =>
      db
        .collection("users")
        .doc(uid)
        .collection("purchases")
        .doc(courseId)
        .get()
  );
  return purchaseSnap.exists && purchaseSnap.data()?.status === "paid";
}

/**
 * Entitlement: curs gratuit (vizibil) OR achiziție plătită. Abonamentul site nu mai deblochează cursuri.
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
  const subscriptionUnlock = false;
  const hasAccess = purchasePaid;

  let accessSource = null;
  if (hasAccess) {
    if (purchasePaid) accessSource = "purchase";
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
