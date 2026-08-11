import { getAdminDb } from "../../../lib/firebaseAdmin";
import { requireAuth } from "../../../lib/requireAuth";
import { isCourseVisible, resolveDate } from "../../../lib/courses";
import { resolveCourseEntitlement } from "../../../lib/courseSubscriptionAccess";

function maskUid(value) {
  if (typeof value !== "string" || !value) return "unknown";
  if (value.length <= 6) return value;
  return `${value.slice(0, 3)}...${value.slice(-3)}`;
}

function readSingleQueryValue(value) {
  if (Array.isArray(value)) return value[0];
  return value;
}

function toIsoString(value) {
  const date = resolveDate(value);
  return date ? date.toISOString() : null;
}

function pickPurchaseSnapshot(docSnap) {
  if (!docSnap?.exists) {
    return {
      exists: false,
      data: null,
    };
  }

  const data = docSnap.data() || {};
  return {
    exists: true,
    data: {
      courseId: data.courseId || docSnap.id,
      status: data.status || null,
      paymentStatus: data.paymentStatus || null,
      stripeCheckoutSessionId: data.stripeCheckoutSessionId || null,
      stripePaymentIntentId: data.stripePaymentIntentId || null,
      amountPaid: typeof data.amountPaid === "number" ? data.amountPaid : null,
      amountPaidCents: typeof data.amountPaidCents === "number" ? data.amountPaidCents : null,
      currency: data.currency || null,
      purchasedAt: toIsoString(data.purchasedAt),
      updatedAt: toIsoString(data.updatedAt),
      lastWebhookEventId: data.lastWebhookEventId || null,
      lastWebhookEventType: data.lastWebhookEventType || null,
    },
  };
}

function pickCheckoutSession(docSnap) {
  if (!docSnap?.exists) return null;
  const data = docSnap.data() || {};
  return {
    id: docSnap.id,
    courseId: data.courseId || null,
    uid: data.uid || null,
    paymentStatus: data.paymentStatus || null,
    status: data.status || null,
    sourcePlatform: data.sourcePlatform || null,
    returnUrls: data.returnUrls || null,
    invoiceStatus: data.invoiceStatus || null,
    invoiceError: data.invoiceError || null,
    lastWebhookEventId: data.lastWebhookEventId || null,
    lastWebhookEventType: data.lastWebhookEventType || null,
    createdAt: toIsoString(data.createdAt),
    updatedAt: toIsoString(data.updatedAt),
  };
}

function pickPayment(docSnap) {
  if (!docSnap?.exists) return null;
  const data = docSnap.data() || {};
  return {
    id: docSnap.id,
    uid: data.uid || null,
    courseId: data.courseId || null,
    stripeCheckoutSessionId: data.stripeCheckoutSessionId || null,
    stripePaymentIntentId: data.stripePaymentIntentId || null,
    paymentStatus: data.paymentStatus || null,
    entitlementGranted: data.entitlementGranted === true,
    amountPaid: typeof data.amountPaid === "number" ? data.amountPaid : null,
    amountPaidCents: typeof data.amountPaidCents === "number" ? data.amountPaidCents : null,
    expectedAmountCents:
      typeof data.expectedAmountCents === "number" ? data.expectedAmountCents : null,
    amountMatches: data.amountMatches === true,
    currency: data.currency || null,
    expectedCurrency: data.expectedCurrency || null,
    currencyMatches: data.currencyMatches === true,
    rawEventType: data.rawEventType || null,
    lastWebhookEventId: data.lastWebhookEventId || null,
    updatedAt: toIsoString(data.updatedAt),
    oblioStatus: data?.oblio?.status || null,
    oblioError: data?.oblio?.errorText || null,
  };
}

function pickWebhookEvent(docSnap) {
  const data = docSnap.data() || {};
  return {
    eventId: data.eventId || docSnap.id,
    eventType: data.eventType || null,
    courseId: data.courseId || null,
    stripeCheckoutSessionId: data.stripeCheckoutSessionId || null,
    entitlementGranted: data.entitlementGranted === true,
    processedAt: toIsoString(data.processedAt),
  };
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).end("Method Not Allowed");
  }

  let authUser;
  try {
    authUser = await requireAuth(req);
  } catch (err) {
    console.warn("[courses.debug] unauthorized", {
      message: err?.message || "unauthorized",
    });
    return res.status(err?.statusCode || 401).json({ error: err?.message || "Unauthorized" });
  }

  const courseId = readSingleQueryValue(req.query?.courseId);
  const requestedSessionId = readSingleQueryValue(req.query?.sessionId);
  if (typeof courseId !== "string" || !courseId.trim()) {
    return res.status(400).json({ error: "Missing courseId query param" });
  }

  const normalizedCourseId = courseId.trim();
  const normalizedRequestedSessionId =
    typeof requestedSessionId === "string" && requestedSessionId.trim()
      ? requestedSessionId.trim()
      : null;

  console.info("[courses.debug] start", {
    uid: maskUid(authUser.uid),
    courseId: normalizedCourseId,
    requestedSessionId: normalizedRequestedSessionId,
  });

  try {
    const db = getAdminDb();
    const purchaseRef = db
      .collection("users")
      .doc(authUser.uid)
      .collection("purchases")
      .doc(normalizedCourseId);
    const courseRef = db.collection("courses").doc(normalizedCourseId);

    const [purchaseSnap, courseSnap] = await Promise.all([purchaseRef.get(), courseRef.get()]);
    const purchase = pickPurchaseSnapshot(purchaseSnap);
    const courseData = courseSnap.exists ? courseSnap.data() || {} : {};
    const courseVisible = courseSnap.exists ? isCourseVisible(courseData, Date.now()) : false;
    const entitlement = courseSnap.exists
      ? await resolveCourseEntitlement(db, authUser.uid, normalizedCourseId, courseData, {
          courseVisible,
        })
      : null;
    const purchaseSessionId =
      purchase?.data?.stripeCheckoutSessionId && typeof purchase.data.stripeCheckoutSessionId === "string"
        ? purchase.data.stripeCheckoutSessionId
        : null;
    const linkedSessionId = normalizedRequestedSessionId || purchaseSessionId;

    const [linkedCheckoutSessionSnap, linkedPaymentSnap, recentWebhookEventsSnap] = await Promise.all([
      linkedSessionId
        ? db.collection("courseCheckoutSessions").doc(linkedSessionId).get()
        : Promise.resolve(null),
      linkedSessionId ? db.collection("payments").doc(linkedSessionId).get() : Promise.resolve(null),
      db.collection("stripeWebhookEvents").where("uid", "==", authUser.uid).limit(40).get(),
    ]);

    const recentWebhookEvents = recentWebhookEventsSnap.docs
      .map((docSnap) => pickWebhookEvent(docSnap))
      .filter((event) => event.courseId === normalizedCourseId)
      .sort((a, b) => {
        const left = a.processedAt ? new Date(a.processedAt).getTime() : 0;
        const right = b.processedAt ? new Date(b.processedAt).getTime() : 0;
        return right - left;
      })
      .slice(0, 20);

    const linkedCheckoutSession = pickCheckoutSession(linkedCheckoutSessionSnap);
    const linkedPayment = pickPayment(linkedPaymentSnap);

    const responsePayload = {
      debug: {
        nowIso: new Date().toISOString(),
        uidMasked: maskUid(authUser.uid),
        uid: authUser.uid,
        courseId: normalizedCourseId,
      },
      course: {
        exists: courseSnap.exists,
        status: courseSnap.exists ? (courseSnap.data()?.status || null) : null,
        currency: courseSnap.exists ? courseSnap.data()?.currency || null : null,
        sitePremiumAccess: courseSnap.exists ? courseData.sitePremiumAccess !== false : null,
        courseVisible,
        // Stored catalog price, before VAT. Public catalog APIs return it with VAT added.
        netPrice: courseSnap.exists ? courseData.price ?? null : null,
      },
      purchase,
      derived: {
        hasAccess: Boolean(entitlement?.hasAccess),
        accessSource: entitlement?.accessSource || null,
        purchasePaid: Boolean(entitlement?.purchasePaid),
        subscriptionUnlock: Boolean(entitlement?.subscriptionUnlock),
        sitePremiumActive: Boolean(entitlement?.sitePremiumActive),
        courseIncludedInPremium: Boolean(entitlement?.courseIncludedInPremium),
        purchaseStatus: purchase?.data?.status || "missing_purchase_doc",
        linkedSessionId,
      },
      linked: {
        checkoutSession: linkedCheckoutSession,
        payment: linkedPayment,
      },
      webhookEvents: recentWebhookEvents,
    };

    console.info("[courses.debug] success", {
      uid: maskUid(authUser.uid),
      courseId: normalizedCourseId,
      hasAccess: responsePayload.derived.hasAccess,
      purchaseStatus: responsePayload.derived.purchaseStatus,
      webhookEventCount: recentWebhookEvents.length,
      linkedSessionId,
      hasLinkedPayment: Boolean(linkedPayment),
    });

    return res.status(200).json(responsePayload);
  } catch (error) {
    console.error("[courses.debug] failed", {
      uid: maskUid(authUser.uid),
      courseId: normalizedCourseId,
      message: error?.message || "unknown_error",
    });
    return res.status(500).json({ error: "Failed to load courses debug details" });
  }
}
