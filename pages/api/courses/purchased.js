import { getAdminDb } from "../../../lib/firebaseAdmin";
import { requireAuth } from "../../../lib/requireAuth";
import { resolveDate, toSafeCourse } from "../../../lib/courses";

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

export default async function handler(req, res) {
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
    const purchasesSnap = await db
      .collection("users")
      .doc(authUser.uid)
      .collection("purchases")
      .where("status", "==", "paid")
      .get();

    if (purchasesSnap.empty) {
      const allPurchasesSnap = await db
        .collection("users")
        .doc(authUser.uid)
        .collection("purchases")
        .get();
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
          purchasedAt: data.purchasedAt || null,
          updatedAt: data.updatedAt || null,
        };
      })
      .sort((left, right) => getPurchaseSortMs(right) - getPurchaseSortMs(left));

    const courseSnaps = await Promise.all(
      purchases.map((purchase) => db.collection("courses").doc(purchase.courseId).get())
    );

    const payload = purchases.map((purchase, index) => {
      const courseSnap = courseSnaps[index];
      const purchasedAt = purchase.purchasedAt || purchase.updatedAt;
      const courseMissing = !courseSnap.exists;

      return {
        courseId: purchase.courseId,
        status: purchase.status,
        purchasedAt: toIsoString(purchasedAt),
        amountPaid: purchase.amountPaid,
        currency: purchase.currency,
        courseMissing,
        course: courseMissing
          ? null
          : toSafeCourse(purchase.courseId, courseSnap.data() || {}, locale),
      };
    });

    console.info("[courses.purchased] success", {
      uid: maskUid(authUser?.uid),
      count: payload.length,
    });

    return res.status(200).json({ purchases: payload });
  } catch (error) {
    console.error("[courses.purchased] fail", {
      uid: maskUid(authUser?.uid),
      message: error?.message || "unknown_error",
    });
    return res.status(500).json({ error: "Failed to load purchased courses" });
  }
}
