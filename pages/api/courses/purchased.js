import { getAdminDb } from "../../../lib/firebaseAdmin";
import { requireAuth } from "../../../lib/requireAuth";
import {
  applyFixedVatDisplayPrice,
  isCourseVisible,
  resolveDate,
  toSafeCourse,
} from "../../../lib/courses";
import {
  COURSE_BUNDLE_COLLECTION,
  isCourseBundleVisible,
  loadBundleCourses,
  toSafeCourseBundle,
} from "../../../lib/courseBundles";
import {
  withFirestoreCostLog,
  withFirestoreReadTelemetry,
} from "../../../lib/firestoreCostLogger";

function maskUid(value) {
  if (typeof value !== "string" || !value) return "unknown";
  if (value.length <= 6) return value;
  return `${value.slice(0, 3)}...${value.slice(-3)}`;
}

function toIsoString(value) {
  const date = resolveDate(value);
  return date ? date.toISOString() : null;
}

function getPurchaseSortMs(purchase) {
  const purchasedAtMs = resolveDate(purchase?.purchasedAt)?.getTime() || 0;
  if (purchasedAtMs > 0) return purchasedAtMs;
  return resolveDate(purchase?.updatedAt)?.getTime() || 0;
}

export function shouldExposePurchasedCourse(courseMissing, courseData, nowMs = Date.now()) {
  if (courseMissing) return true;
  return isCourseVisible(courseData, nowMs);
}

export function shouldExposePurchasedBundle(bundleMissing, bundleData) {
  if (bundleMissing) return true;
  return isCourseBundleVisible(bundleData);
}

async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).end("Method Not Allowed");
  }

  res.setHeader("Cache-Control", "private, no-store, max-age=0");

  let authUser;
  try {
    authUser = await requireAuth(req);
  } catch (err) {
    console.warn("[courses.purchased] unauthorized", {
      message: err?.message || "unauthorized",
    });
    return res.status(err.statusCode || 401).json({ error: err.message });
  }

  const locale =
    typeof req.query?.locale === "string"
      ? req.query.locale
      : Array.isArray(req.query?.locale)
      ? req.query.locale[0]
      : undefined;

  console.info("[courses.purchased] start", {
    uid: maskUid(authUser?.uid),
    locale: locale || "default",
  });

  try {
    const db = getAdminDb();
    const purchasesSnap = await withFirestoreCostLog(
      { page: "api.courses.purchased", queryName: "users.purchases.paid" },
      () =>
        db
          .collection("users")
          .doc(authUser.uid)
          .collection("purchases")
          .where("status", "==", "paid")
          .get()
    );

    if (purchasesSnap.empty) {
      const allPurchasesSnap = await withFirestoreCostLog(
        { page: "api.courses.purchased", queryName: "users.purchases.debug_all" },
        () =>
          db
            .collection("users")
            .doc(authUser.uid)
            .collection("purchases")
            .get()
      );
      const purchaseStatuses = allPurchasesSnap.docs.map((docSnap) => {
        const data = docSnap.data() || {};
        return {
          courseId:
            typeof data.courseId === "string" && data.courseId.trim()
              ? data.courseId.trim()
              : docSnap.id,
          status: typeof data.status === "string" ? data.status : "missing_status",
          paymentStatus: typeof data.paymentStatus === "string" ? data.paymentStatus : null,
          lastWebhookEventType:
            typeof data.lastWebhookEventType === "string" ? data.lastWebhookEventType : null,
          lastWebhookEventId:
            typeof data.lastWebhookEventId === "string" ? data.lastWebhookEventId : null,
        };
      });

      console.info("[courses.purchased] no_paid_purchases_debug", {
        uid: maskUid(authUser?.uid),
        allCount: allPurchasesSnap.size,
        statuses: purchaseStatuses,
      });
    }

    const purchases = purchasesSnap.docs
      .map((docSnap) => {
        const data = docSnap.data() || {};
        const fallbackCourseId = docSnap.id;
        const courseId =
          typeof data.courseId === "string" && data.courseId.trim()
            ? data.courseId.trim()
            : fallbackCourseId;

        return {
          docId: docSnap.id,
          courseId,
          status: typeof data.status === "string" ? data.status : "paid",
          amountPaid: typeof data.amountPaid === "number" ? data.amountPaid : 0,
          currency: typeof data.currency === "string" ? data.currency : "RON",
          provider:
            typeof data.provider === "string" && data.provider.trim()
              ? data.provider.trim()
              : "stripe",
          accessSource:
            data.accessSource === "bundle" ? "bundle" : "purchase",
          bundleId:
            typeof data.bundleId === "string" && data.bundleId.trim()
              ? data.bundleId.trim()
              : null,
          purchasedAt: data.purchasedAt || null,
          updatedAt: data.updatedAt || null,
        };
      })
      .sort((left, right) => getPurchaseSortMs(right) - getPurchaseSortMs(left));

    const courseSnaps = await Promise.all(
      purchases.map((purchase) =>
        withFirestoreCostLog(
          {
            page: "api.courses.purchased",
            queryName: "courses.by_purchased_id",
            operationType: "document",
          },
          () => db.collection("courses").doc(purchase.courseId).get()
        )
      )
    );
    const payload = purchases
      .map((purchase, index) => {
        const courseSnap = courseSnaps[index];
        const purchasedAt = purchase.purchasedAt || purchase.updatedAt;
        const courseMissing = !courseSnap.exists;
        const courseData = courseMissing ? null : courseSnap.data() || {};

        if (!shouldExposePurchasedCourse(courseMissing, courseData)) {
          return null;
        }

        return {
          courseId: purchase.courseId,
          status: purchase.status,
          purchasedAt: toIsoString(purchasedAt),
          amountPaid: purchase.amountPaid,
          currency: purchase.currency,
          provider: purchase.provider,
          accessSource: purchase.accessSource,
          bundleId: purchase.bundleId,
          courseMissing,
          course: courseData
            ? applyFixedVatDisplayPrice(toSafeCourse(purchase.courseId, courseData, locale))
            : null,
        };
      })
      .filter(Boolean);

    const bundlePurchasesSnap = await withFirestoreCostLog(
      { page: "api.courses.purchased", queryName: "users.bundlePurchases.paid" },
      () =>
        db
          .collection("users")
          .doc(authUser.uid)
          .collection("bundlePurchases")
          .where("status", "==", "paid")
          .get()
    );

    const purchasedBundles = await Promise.all(
      bundlePurchasesSnap.docs.map(async (docSnap) => {
        const data = docSnap.data() || {};
        const bundleId = docSnap.id;
        const bundleSnap = await withFirestoreCostLog(
          { page: "api.courses.purchased", queryName: "courseBundles.by_purchased_id", operationType: "document" },
          () => db.collection(COURSE_BUNDLE_COLLECTION).doc(bundleId).get()
        );
        const bundleMissing = !bundleSnap.exists;
        const bundleData = bundleMissing ? null : bundleSnap.data() || {};
        if (!shouldExposePurchasedBundle(bundleMissing, bundleData)) {
          return null;
        }
        let bundle = null;
        if (bundleData) {
          const courses = await loadBundleCourses(db, bundleData.courseIds, locale, {
            visibleOnly: true,
          });
          bundle = toSafeCourseBundle(bundleId, bundleData, locale, courses);
        }
        return {
          bundleId,
          status: typeof data.status === "string" ? data.status : "paid",
          purchasedAt: toIsoString(data.purchasedAt || data.updatedAt),
          amountPaid: typeof data.amountPaid === "number" ? data.amountPaid : 0,
          currency: typeof data.currency === "string" ? data.currency : "RON",
          provider:
            typeof data.provider === "string" && data.provider.trim()
              ? data.provider.trim()
              : "stripe",
          bundleMissing,
          bundle,
        };
      })
    );
    const visiblePurchasedBundles = purchasedBundles.filter(Boolean);

    visiblePurchasedBundles.sort(
      (left, right) => getPurchaseSortMs(right) - getPurchaseSortMs(left)
    );

    console.info("[courses.purchased] success", {
      uid: maskUid(authUser?.uid),
      count: payload.length,
      bundleCount: visiblePurchasedBundles.length,
    });

    return res.status(200).json({ purchases: payload, purchasedBundles: visiblePurchasedBundles });
  } catch (error) {
    console.error("[courses.purchased] fail", {
      uid: maskUid(authUser?.uid),
      message: error?.message || "unknown_error",
    });
    return res.status(500).json({ error: "Failed to load purchased courses" });
  }
}

export default withFirestoreReadTelemetry("/api/courses/purchased", handler);
