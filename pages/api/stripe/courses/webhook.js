import Stripe from "stripe";
import { buffer } from "micro";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "../../../../lib/firebaseAdmin";
import { createOlbioInvoiceFromPayload } from "../../../../utils/olbioClient";
import {
  buildInvoiceDecision,
  buildOblioClientFromNormalized,
  logBillingAudit,
  normalizeBillingContext,
} from "../../../../utils/billingAudit.mjs";
import { getOblioVatSettings, resolveCheckoutSessionOblioTax, shouldSendOblioEInvoice } from "../../../../utils/oblioTax";
import {
  COURSE_BUNDLE_COLLECTION,
  normalizeBundleCourseIds,
} from "../../../../lib/courseBundles";
import {
  BILLING_ERROR_CODES,
  getBillingRequestId,
  logBillingObs,
  setBillingRequestId,
} from "../../../../lib/billingObservability";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const HANDLED_EVENTS = new Set([
  "checkout.session.completed",
  "checkout.session.async_payment_succeeded",
  "checkout.session.async_payment_failed",
]);
const CHECKOUT_SESSION_COLLECTION = "courseCheckoutSessions";

function resolveWebhookSecret() {
  if (process.env.STRIPE_WEBHOOK_SECRET_COURSES) {
    return {
      value: process.env.STRIPE_WEBHOOK_SECRET_COURSES,
      source: "STRIPE_WEBHOOK_SECRET_COURSES",
    };
  }
  if (process.env.STRIPE_WEBHOOK_SECRET_COURSES_TEST) {
    return {
      value: process.env.STRIPE_WEBHOOK_SECRET_COURSES_TEST,
      source: "STRIPE_WEBHOOK_SECRET_COURSES_TEST",
    };
  }
  if (process.env.STRIPE_WEBHOOK_SECRET_TEST) {
    return {
      value: process.env.STRIPE_WEBHOOK_SECRET_TEST,
      source: "STRIPE_WEBHOOK_SECRET_TEST",
    };
  }
  return { value: "", source: "none" };
}

function maskUid(value) {
  if (typeof value !== "string" || !value) return "unknown";
  if (value.length <= 6) return value;
  return `${value.slice(0, 3)}...${value.slice(-3)}`;
}

export const config = {
  api: {
    bodyParser: false,
  },
};

function normalizeCurrency(value, fallback = "RON") {
  if (typeof value !== "string" || !value.trim()) return fallback;
  return value.trim().toUpperCase();
}

function toAmountCents(value) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) return null;
  return Math.round(value);
}

function parseExpectedAmountCents(metadata) {
  const raw = metadata?.expectedAmount;
  if (typeof raw !== "string") return null;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return Math.round(parsed);
}

function resolvePurchaseContext(session) {
  const metadata = session?.metadata || {};
  const purchaseType =
    sanitizeString(metadata.purchaseType, 32).toLowerCase() === "bundle"
      ? "bundle"
      : "course";
  const courseId = sanitizeString(metadata.courseId, 128);
  const bundleId = sanitizeString(metadata.bundleId, 128);
  const courseIds =
    purchaseType === "bundle"
      ? normalizeBundleCourseIds(sanitizeString(metadata.courseIds, 1500).split(","))
      : courseId
      ? [courseId]
      : [];
  return {
    purchaseType,
    courseId,
    bundleId,
    itemId: purchaseType === "bundle" ? bundleId : courseId,
    courseIds,
  };
}

function getPurchaseStatus({ isPaid, entitlementGranted, isFailureEvent }) {
  if (entitlementGranted) return "paid";
  if (isFailureEvent) return "payment_failed";
  if (isPaid) return "payment_mismatch";
  return "pending_payment";
}

function sanitizeString(value, maxLength = 255) {
  if (typeof value !== "string") return "";
  const normalized = value.trim();
  if (!normalized) return "";
  return normalized.slice(0, maxLength);
}

function parseInvoiceDueDays(value) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  const rounded = Math.trunc(parsed);
  if (rounded < 0 || rounded > 365) return null;
  return rounded;
}

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

function normalizeCountry(country) {
  const normalized = sanitizeString(country, 64);
  if (!normalized) return "Romania";
  const upper = normalized.toUpperCase();
  if (upper === "RO") return "Romania";
  return normalized;
}

function splitName(fullName) {
  const normalized = sanitizeString(fullName, 240);
  if (!normalized) return { firstName: "", lastName: "" };
  const parts = normalized.split(/\s+/).filter(Boolean);
  if (!parts.length) return { firstName: "", lastName: "" };
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
}

function normalizeAddress(rawAddress) {
  if (!rawAddress || typeof rawAddress !== "object" || Array.isArray(rawAddress)) {
    return {
      line1: "",
      line2: "",
      city: "",
      state: "",
      postalCode: "",
      country: "",
    };
  }

  return {
    line1: sanitizeString(rawAddress.line1, 255),
    line2: sanitizeString(rawAddress.line2, 255),
    city: sanitizeString(rawAddress.city, 120),
    state: sanitizeString(rawAddress.state || rawAddress.county, 120),
    postalCode: sanitizeString(rawAddress.postalCode || rawAddress.postal_code, 32),
    country: sanitizeString(rawAddress.country, 64),
  };
}

function normalizeCourseBilling(checkoutSessionData, session) {
  const metadata = session?.metadata || {};
  const storedBilling =
    checkoutSessionData?.billing &&
    typeof checkoutSessionData.billing === "object" &&
    !Array.isArray(checkoutSessionData.billing)
      ? checkoutSessionData.billing
      : {};
  const customerDetails =
    session?.customer_details &&
    typeof session.customer_details === "object" &&
    !Array.isArray(session.customer_details)
      ? session.customer_details
      : {};

  const parsedName = splitName(customerDetails?.name || "");
  const storedAddress = normalizeAddress(storedBilling.address);
  const customerAddress = normalizeAddress(customerDetails.address);

  const firstName = sanitizeString(storedBilling.firstName, 120) || parsedName.firstName;
  const lastName = sanitizeString(storedBilling.lastName, 120) || parsedName.lastName;
  const email =
    sanitizeString(storedBilling.email, 320) ||
    sanitizeString(customerDetails.email, 320) ||
    sanitizeString(session?.customer_email, 320);
  const phone = sanitizeString(storedBilling.phone, 64) || sanitizeString(customerDetails.phone, 64);

  const address = {
    line1: storedAddress.line1 || customerAddress.line1,
    line2: storedAddress.line2 || customerAddress.line2,
    city: storedAddress.city || customerAddress.city,
    state: storedAddress.state || customerAddress.state,
    postalCode: storedAddress.postalCode || customerAddress.postalCode,
    country: normalizeCountry(storedAddress.country || customerAddress.country),
  };

  const rawCompany =
    storedBilling.company &&
    typeof storedBilling.company === "object" &&
    !Array.isArray(storedBilling.company)
      ? storedBilling.company
      : {};
  const company = {
    name: sanitizeString(rawCompany.name, 255),
    vat: sanitizeString(rawCompany.vat || rawCompany.cif, 64),
    reg: sanitizeString(rawCompany.reg || rawCompany.rc, 64),
    address: sanitizeString(rawCompany.address, 255),
  };
  const cnp = sanitizeString(storedBilling.cnp, 32);

  const storedPreferences =
    storedBilling.invoicePreferences &&
    typeof storedBilling.invoicePreferences === "object" &&
    !Array.isArray(storedBilling.invoicePreferences)
      ? storedBilling.invoicePreferences
      : {};
  const sendEmailFromMetadata = sanitizeString(metadata.invoiceSendEmail, 8).toLowerCase();
  const eInvoiceFromMetadata = sanitizeString(metadata.invoiceEInvoice, 8).toLowerCase();

  const invoicePreferences = {
    sendEmail:
      storedPreferences.sendEmail === false
        ? false
        : sendEmailFromMetadata
        ? sendEmailFromMetadata !== "false"
        : true,
    eInvoice:
      storedPreferences.eInvoice === true
        ? true
        : eInvoiceFromMetadata
        ? eInvoiceFromMetadata === "true"
        : false,
    dueDays: parseInvoiceDueDays(storedPreferences.dueDays ?? metadata.invoiceDueDays),
  };

  const billingTypeRaw = sanitizeString(storedBilling.billingType || metadata.billingType, 32).toLowerCase();
  const hasCorporateData = Boolean(company.name && company.vat);
  const billingType =
    billingTypeRaw === "corporate" && hasCorporateData
      ? "corporate"
      : hasCorporateData
      ? "corporate"
      : "individual";

  return {
    billingType,
    firstName,
    lastName,
    email,
    phone,
    cnp,
    address,
    company,
    invoicePreferences,
  };
}

function hasMinimumInvoiceFields(billing) {
  if (!billing || !billing.email) return false;

  if (billing.billingType === "corporate") {
    return Boolean(billing.company?.name && billing.company?.vat && (billing.company?.address || billing.address?.line1));
  }

  return Boolean(billing.address?.line1 && billing.address?.city && billing.address?.country);
}

function buildOblioClient(billing) {
  const fullName = [billing.firstName, billing.lastName].filter(Boolean).join(" ").trim() || "Client";
  const isCorporate =
    billing.billingType === "corporate" && Boolean(billing.company?.name && billing.company?.vat);

  if (isCorporate) {
    return {
      cif: billing.company.vat,
      name: billing.company.name,
      rc: billing.company.reg || "",
      address: billing.company.address || billing.address.line1 || "",
      email: billing.email,
      phone: billing.phone || "",
      contact: fullName,
      vatPayer: true,
      save: 1,
    };
  }

  return {
    name: fullName,
    address: billing.address.line1 || "",
    city: billing.address.city || "",
    state: billing.address.state || "",
    country: normalizeCountry(billing.address.country),
    email: billing.email,
    phone: billing.phone || "",
    vatPayer: false,
    save: 1,
  };
}

async function createCourseOblioInvoice(db, event, session) {
  const uid = sanitizeString(session?.metadata?.uid, 128);
  const context = resolvePurchaseContext(session);
  const purchaseType = context.purchaseType;
  const bundleId = context.bundleId;
  const courseId = context.itemId;
  const checkoutSessionId = sanitizeString(session?.id, 128);
  const paymentStatus = sanitizeString(session?.payment_status, 64) || "unknown";

  if (!uid || !courseId || !checkoutSessionId) {
    return {
      skipped: true,
      reason: "missing_metadata",
      uid: maskUid(uid),
      courseId: courseId || "unknown",
      checkoutSessionId: checkoutSessionId || "unknown",
      eventType: event.type,
    };
  }

  const checkoutSessionRef = db.collection(CHECKOUT_SESSION_COLLECTION).doc(checkoutSessionId);
  const paymentRef = db.collection("payments").doc(checkoutSessionId);

  try {
    await checkoutSessionRef.set(
      {
        uid,
        purchaseType,
        ...(purchaseType === "bundle" ? { bundleId, courseIds: context.courseIds } : { courseId }),
        stripeCheckoutSessionId: checkoutSessionId,
        paymentStatus,
        lastWebhookEventId: event.id,
        lastWebhookEventType: event.type,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  } catch (syncError) {
    console.warn("[courses.webhook] checkout_session_sync_failed", {
      uid: maskUid(uid),
      courseId,
      checkoutSessionId,
      message: syncError?.message || "unknown_error",
    });
  }

  if (paymentStatus !== "paid") {
    return {
      skipped: true,
      reason: "payment_not_paid",
      uid: maskUid(uid),
      courseId,
      checkoutSessionId,
      paymentStatus,
      eventType: event.type,
    };
  }

  const amountPaidCents = toAmountCents(session?.amount_total);
  if (amountPaidCents === null || amountPaidCents <= 0) {
    return {
      skipped: true,
      reason: "invalid_amount",
      uid: maskUid(uid),
      courseId,
      checkoutSessionId,
      eventType: event.type,
    };
  }

  const itemCollection =
    purchaseType === "bundle" ? COURSE_BUNDLE_COLLECTION : "courses";
  const [paymentSnap, checkoutSessionSnap, courseSnap] = await Promise.all([
    paymentRef.get(),
    checkoutSessionRef.get(),
    db.collection(itemCollection).doc(courseId).get(),
  ]);

  const existingOblio = paymentSnap.exists ? paymentSnap.data()?.oblio : null;
  if (existingOblio?.status === "created" && (existingOblio?.number || existingOblio?.documentId)) {
    return {
      skipped: true,
      reason: "invoice_already_created",
      uid: maskUid(uid),
      courseId,
      checkoutSessionId,
      eventType: event.type,
    };
  }

  if (!courseSnap.exists) {
    const skippedPayload = {
      status: "skipped_course_not_found",
      reason: purchaseType === "bundle" ? "Course bundle not found" : "Course not found",
      checkoutSessionId,
      courseId,
      uid,
      eventType: event.type,
      updatedAt: FieldValue.serverTimestamp(),
    };
    await paymentRef.set({ oblio: skippedPayload, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    return {
      skipped: true,
      reason: "course_not_found",
      uid: maskUid(uid),
      courseId,
      checkoutSessionId,
      eventType: event.type,
    };
  }

  const oblioCif = sanitizeString(process.env.OBLIO_CIF || process.env.OBLIO_COMPANY_CIF || "", 64);
  const oblioSeries = sanitizeString(process.env.OBLIO_SERIES || "", 64);
  if (!oblioCif || !oblioSeries) {
    const skippedPayload = {
      status: "skipped_oblio_not_configured",
      reason: "Missing OBLIO_CIF/OBLIO_SERIES",
      checkoutSessionId,
      courseId,
      uid,
      eventType: event.type,
      updatedAt: FieldValue.serverTimestamp(),
    };
    await paymentRef.set({ oblio: skippedPayload, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    await checkoutSessionRef.set(
      { invoiceStatus: "skipped_oblio_not_configured", updatedAt: FieldValue.serverTimestamp() },
      { merge: true }
    );
    return {
      skipped: true,
      reason: "oblio_not_configured",
      uid: maskUid(uid),
      courseId,
      checkoutSessionId,
      eventType: event.type,
    };
  }

  const checkoutSessionData = checkoutSessionSnap.exists ? checkoutSessionSnap.data() || {} : {};
  const billing = normalizeCourseBilling(checkoutSessionData, session);
  const billingAudit = normalizeBillingContext(
    {
      ...(checkoutSessionData?.rawFormValues || {}),
      ...(billing || {}),
      companyName: billing?.company?.name,
      cif: billing?.company?.vat,
      cnp: billing?.cnp || checkoutSessionData?.rawFormValues?.cnp,
      reg: billing?.company?.reg,
      address: billing?.billingType === "corporate" ? billing?.company?.address : billing?.address?.line1,
      state: billing?.address?.state,
      city: billing?.address?.city,
      country: billing?.address?.country,
      postalCode: billing?.address?.postalCode,
      contact: `${billing?.firstName || ""} ${billing?.lastName || ""}`.trim(),
      name:
        billing?.billingType === "corporate"
          ? billing?.company?.name
          : `${billing?.firstName || ""} ${billing?.lastName || ""}`.trim(),
      email: billing?.email,
      phone: billing?.phone,
    },
    {
      defaultCountry: "Romania",
      individualCnpOptional: true,
    }
  );
  const invoiceDecision = buildInvoiceDecision(billingAudit);
  logBillingAudit({
    flow: "courses",
    stage: "webhook_pre_oblio",
    requestId: `course_inv_${checkoutSessionId}`,
    sessionId: checkoutSessionId,
    raw: checkoutSessionData?.rawFormValues || billing,
    normalized: billingAudit.normalizedClient,
    decision: invoiceDecision,
  });
  if (!invoiceDecision.emitInvoice) {
    const skippedPayload = {
      status: "skipped_missing_billing",
      reason: invoiceDecision.blockedReason || "Missing required billing fields",
      checkoutSessionId,
      courseId,
      uid,
      eventType: event.type,
      updatedAt: FieldValue.serverTimestamp(),
    };
    await paymentRef.set({ oblio: skippedPayload, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    await checkoutSessionRef.set(
      { invoiceStatus: "skipped_missing_billing", updatedAt: FieldValue.serverTimestamp() },
      { merge: true }
    );
    return {
      skipped: true,
      reason: "missing_billing",
      uid: maskUid(uid),
      courseId,
      checkoutSessionId,
      eventType: event.type,
    };
  }

  const course = courseSnap.data() || {};
  const courseTitle =
    sanitizeString(course?.title, 180) ||
    (purchaseType === "bundle" ? `Trilogie ${courseId}` : `Curs ${courseId}`);
  const currency = normalizeCurrency(session?.currency, "RON");
  const taxLine = resolveCheckoutSessionOblioTax(session, getOblioVatSettings());
  if (!taxLine.ok) {
    const blockedPayload = { status: "blocked_total_mismatch", reason: taxLine.reason, checkoutSessionId, courseId, uid, eventType: event.type, updatedAt: FieldValue.serverTimestamp() };
    console.error("[courses.webhook] oblio_blocked_total_mismatch", { checkoutSessionId, reason: taxLine.reason, amountPaidCents });
    await paymentRef.set({ oblio: blockedPayload, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    return { skipped: true, reason: "blocked_total_mismatch", checkoutSessionId, courseId, uid: maskUid(uid) };
  }
  const issueDate = todayISO();
  const invoicePreferences = billing.invoicePreferences || {
    sendEmail: true,
    eInvoice: false,
    dueDays: null,
  };

  const invoicePayload = {
    cif: oblioCif,
    client: buildOblioClient(billing),
    issueDate,
    seriesName: oblioSeries,
    language: "RO",
    precision: 2,
    currency,
    sendEmail: invoicePreferences.sendEmail === false ? 0 : 1,
    sendEInvoice: invoiceDecision.sendEInvoice && shouldSendOblioEInvoice() ? 1 : 0,
    products: [
      {
        name: courseTitle,
        description:
          purchaseType === "bundle"
            ? `Acces trilogie de ${context.courseIds?.length || ""} cursuri online (${courseId})`
            : `Acces curs online (${courseId})`,
        price: taxLine.price,
        measuringUnit: "bucata",
        vatName: taxLine.vatName,
        vatPercentage: taxLine.vatPercentage,
        vatIncluded: taxLine.vatIncluded,
        quantity: 1,
        productType: "Serviciu",
      },
    ],
    mentions: `Factura generata automat pentru ${
      purchaseType === "bundle" ? "trilogie" : "curs"
    }. Stripe session: ${checkoutSessionId}`,
    internalNote: `${purchaseType === "bundle" ? "bundleId" : "courseId"}=${courseId}; uid=${uid}; eInvoice=${invoiceDecision.sendEInvoice ? "1" : "0"}; dueDays=${invoicePreferences.dueDays ?? ""}`,
    collect: {
      type: "Card",
      documentNumber: `STRIPE-${checkoutSessionId}`,
      value: taxLine.total,
      issueDate,
      mentions: "Plata procesata prin Stripe",
    },
  };
  invoicePayload.client = buildOblioClientFromNormalized(billingAudit.normalizedClient);

  const requestId = `course_inv_${checkoutSessionId}_${Date.now()}`;
  const oblioResp = await createOlbioInvoiceFromPayload({
    invoicePayload,
    requestId,
  });

  if (!oblioResp || oblioResp.status !== 200 || !oblioResp.data) {
    const errorPayload = {
      status: "error",
      requestId,
      checkoutSessionId,
      courseId,
      purchaseType,
      ...(purchaseType === "bundle" ? { bundleId } : {}),
      uid,
      eventType: event.type,
      errorText: sanitizeString(oblioResp?.errorText || "Oblio invoice failed", 500),
      finalOblioPayload: invoicePayload,
      normalizedClient: billingAudit.normalizedClient,
      invoiceDecision,
      updatedAt: FieldValue.serverTimestamp(),
    };
    await paymentRef.set({ oblio: errorPayload, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    await checkoutSessionRef.set(
      { invoiceStatus: "error", invoiceError: errorPayload.errorText, updatedAt: FieldValue.serverTimestamp() },
      { merge: true }
    );
    return {
      skipped: false,
      status: "error",
      uid: maskUid(uid),
      courseId,
      checkoutSessionId,
      eventType: event.type,
      message: errorPayload.errorText,
    };
  }

  const oblioData = oblioResp.data || {};
  const invoiceResult = {
    status: "created",
    requestId,
    checkoutSessionId,
    courseId,
    purchaseType,
    ...(purchaseType === "bundle" ? { bundleId } : {}),
    uid,
    amountPaid: taxLine.total,
    currency,
    seriesName: sanitizeString(oblioData.seriesName, 64) || null,
    number:
      sanitizeString(
        typeof oblioData.number === "string" ? oblioData.number : String(oblioData.number || ""),
        64
      ) || null,
    link: sanitizeString(oblioData.link, 2048) || null,
    documentId:
      sanitizeString(
        typeof oblioData.documentId === "string"
          ? oblioData.documentId
          : typeof oblioData.id === "string"
          ? oblioData.id
          : "",
        128
      ) || null,
    finalOblioPayload: invoicePayload,
    normalizedClient: billingAudit.normalizedClient,
    invoiceDecision,
    updatedAt: FieldValue.serverTimestamp(),
  };

  await Promise.all([
    paymentRef.set({ oblio: invoiceResult, updatedAt: FieldValue.serverTimestamp() }, { merge: true }),
    checkoutSessionRef.set(
      {
        invoiceStatus: "created",
        invoice: {
          seriesName: invoiceResult.seriesName,
          number: invoiceResult.number,
          link: invoiceResult.link,
          documentId: invoiceResult.documentId,
        },
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    ),
  ]);

  return {
    skipped: false,
    status: "created",
    uid: maskUid(uid),
    courseId,
    purchaseType,
    ...(purchaseType === "bundle" ? { bundleId } : {}),
    checkoutSessionId,
    eventType: event.type,
    number: invoiceResult.number,
    seriesName: invoiceResult.seriesName,
  };
}

async function processBundleCheckoutSessionEvent(db, event, session, context) {
  const uid = sanitizeString(session?.metadata?.uid, 128);
  const bundleId = context.bundleId;
  const courseIds = context.courseIds;
  const checkoutSessionId = sanitizeString(session?.id, 128);

  if (!uid || !bundleId || courseIds.length < 2 || !checkoutSessionId) {
    return {
      skipped: true,
      reason: "missing_bundle_metadata",
      uid: maskUid(uid),
      bundleId: bundleId || "unknown",
      checkoutSessionId: checkoutSessionId || "unknown",
      eventType: event.type,
    };
  }

  const eventRef = db.collection("stripeWebhookEvents").doc(event.id);
  const bundleRef = db.collection(COURSE_BUNDLE_COLLECTION).doc(bundleId);
  const bundlePurchaseRef = db
    .collection("users")
    .doc(uid)
    .collection("bundlePurchases")
    .doc(bundleId);
  const purchaseRefs = courseIds.map((courseId) =>
    db.collection("users").doc(uid).collection("purchases").doc(courseId)
  );
  const paymentRef = db.collection("payments").doc(checkoutSessionId);

  const paymentStatus =
    typeof session?.payment_status === "string" ? session.payment_status : "unknown";
  const isPaid = paymentStatus === "paid";
  const isFailureEvent = event.type === "checkout.session.async_payment_failed";
  const stripePaymentIntentId =
    typeof session?.payment_intent === "string" ? session.payment_intent : null;
  const amountPaidCents = toAmountCents(session?.amount_total);
  const expectedAmountCents = parseExpectedAmountCents(session?.metadata);
  const currency = normalizeCurrency(session?.currency, "RON");
  const expectedCurrency = normalizeCurrency(session?.metadata?.expectedCurrency, "");
  const amountMatches =
    expectedAmountCents === null ||
    (amountPaidCents !== null && amountPaidCents === expectedAmountCents);
  const currencyMatches = !expectedCurrency || currency === expectedCurrency;
  const entitlementGranted = isPaid && amountMatches && currencyMatches;
  const purchaseStatus = getPurchaseStatus({
    isPaid,
    entitlementGranted,
    isFailureEvent,
  });

  return db.runTransaction(async (transaction) => {
    const [eventSnap, bundleSnap, bundlePurchaseSnap, ...purchaseSnaps] =
      await Promise.all([
        transaction.get(eventRef),
        transaction.get(bundleRef),
        transaction.get(bundlePurchaseRef),
        ...purchaseRefs.map((ref) => transaction.get(ref)),
      ]);

    if (eventSnap.exists) {
      return {
        skipped: true,
        reason: "already_processed",
        uid: maskUid(uid),
        bundleId,
        checkoutSessionId,
        eventType: event.type,
      };
    }

    const bundleAlreadyPaid =
      bundlePurchaseSnap.exists && bundlePurchaseSnap.data()?.status === "paid";
    const bundlePurchasePayload = {
      bundleId,
      courseIds,
      stripeCheckoutSessionId: checkoutSessionId,
      stripePaymentIntentId,
      amountPaid: amountPaidCents !== null ? amountPaidCents / 100 : 0,
      amountPaidCents,
      currency,
      paymentStatus,
      status: purchaseStatus,
      lastWebhookEventId: event.id,
      lastWebhookEventType: event.type,
      updatedAt: FieldValue.serverTimestamp(),
    };
    if (entitlementGranted) {
      bundlePurchasePayload.purchasedAt = FieldValue.serverTimestamp();
    }

    if (bundleAlreadyPaid) {
      transaction.set(
        bundlePurchaseRef,
        {
          lastWebhookEventId: event.id,
          lastWebhookEventType: event.type,
          paymentStatus,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    } else {
      transaction.set(bundlePurchaseRef, bundlePurchasePayload, { merge: true });
    }

    if (entitlementGranted) {
      purchaseRefs.forEach((purchaseRef, index) => {
        const purchaseSnap = purchaseSnaps[index];
        const existingStatus = purchaseSnap.exists ? purchaseSnap.data()?.status : null;
        if (existingStatus === "paid") return;
        transaction.set(
          purchaseRef,
          {
            courseId: courseIds[index],
            stripeCheckoutSessionId: checkoutSessionId,
            stripePaymentIntentId,
            amountPaid: 0,
            amountPaidCents: 0,
            currency,
            paymentStatus,
            status: "paid",
            accessSource: "bundle",
            bundleId,
            purchasedAt: FieldValue.serverTimestamp(),
            lastWebhookEventId: event.id,
            lastWebhookEventType: event.type,
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
        transaction.set(
          db.collection("courses").doc(courseIds[index]),
          {
            purchaseCount: FieldValue.increment(1),
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
      });

      if (bundleSnap.exists && !bundleAlreadyPaid) {
        transaction.set(
          bundleRef,
          {
            purchaseCount: FieldValue.increment(1),
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
      }
    }

    transaction.set(
      paymentRef,
      {
        uid,
        purchaseType: "bundle",
        bundleId,
        courseIds,
        stripeCheckoutSessionId: checkoutSessionId,
        stripePaymentIntentId,
        amountPaid: amountPaidCents !== null ? amountPaidCents / 100 : 0,
        amountPaidCents,
        currency,
        expectedAmountCents,
        expectedCurrency: expectedCurrency || null,
        amountMatches,
        currencyMatches,
        paymentStatus,
        entitlementGranted,
        rawEventType: event.type,
        lastWebhookEventId: event.id,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    transaction.set(eventRef, {
      eventId: event.id,
      eventType: event.type,
      uid,
      purchaseType: "bundle",
      bundleId,
      courseIds,
      stripeCheckoutSessionId: checkoutSessionId,
      entitlementGranted,
      processedAt: FieldValue.serverTimestamp(),
    });

    return {
      skipped: false,
      uid: maskUid(uid),
      purchaseType: "bundle",
      bundleId,
      courseIds,
      checkoutSessionId,
      eventType: event.type,
      paymentStatus,
      status: purchaseStatus,
      entitlementGranted,
      amountMatches,
      currencyMatches,
      bundleAlreadyPaid,
    };
  });
}

async function processCheckoutSessionEvent(db, event, session) {
  const context = resolvePurchaseContext(session);
  if (context.purchaseType === "bundle") {
    return processBundleCheckoutSessionEvent(db, event, session, context);
  }

  const uid = typeof session?.metadata?.uid === "string" ? session.metadata.uid.trim() : "";
  const courseId =
    typeof session?.metadata?.courseId === "string" ? session.metadata.courseId.trim() : "";
  const checkoutSessionId = typeof session?.id === "string" ? session.id.trim() : "";

  if (!uid || !courseId || !checkoutSessionId) {
    return {
      skipped: true,
      reason: "missing_metadata",
      uid: maskUid(uid),
      courseId: courseId || "unknown",
      checkoutSessionId: checkoutSessionId || "unknown",
      eventType: event.type,
    };
  }

  const eventRef = db.collection("stripeWebhookEvents").doc(event.id);
  const purchaseRef = db.collection("users").doc(uid).collection("purchases").doc(courseId);
  const paymentRef = db.collection("payments").doc(checkoutSessionId);

  const paymentStatus =
    typeof session?.payment_status === "string" ? session.payment_status : "unknown";
  const isPaid = paymentStatus === "paid";
  const isFailureEvent = event.type === "checkout.session.async_payment_failed";
  const stripePaymentIntentId =
    typeof session?.payment_intent === "string" ? session.payment_intent : null;

  const amountPaidCents = toAmountCents(session?.amount_total);
  const expectedAmountCents = parseExpectedAmountCents(session?.metadata);

  const currency = normalizeCurrency(session?.currency, "RON");
  const expectedCurrency = normalizeCurrency(session?.metadata?.expectedCurrency, "");

  const amountMatches =
    expectedAmountCents === null || (amountPaidCents !== null && amountPaidCents === expectedAmountCents);
  const currencyMatches = !expectedCurrency || currency === expectedCurrency;
  const entitlementGranted = isPaid && amountMatches && currencyMatches;
  const purchaseStatus = getPurchaseStatus({ isPaid, entitlementGranted, isFailureEvent });

  console.info("[courses.webhook] entitlement_decision", {
    eventId: event.id,
    eventType: event.type,
    uid: maskUid(uid),
    courseId,
    checkoutSessionId,
    paymentStatus,
    isPaid,
    amountPaidCents,
    expectedAmountCents,
    amountMatches,
    currency,
    expectedCurrency: expectedCurrency || null,
    currencyMatches,
    entitlementGranted,
    purchaseStatus,
  });

  const result = await db.runTransaction(async (transaction) => {
    const [eventSnap, purchaseSnap] = await Promise.all([
      transaction.get(eventRef),
      transaction.get(purchaseRef),
    ]);

    if (eventSnap.exists) {
      return {
        skipped: true,
        reason: "already_processed",
        uid: maskUid(uid),
        courseId,
        checkoutSessionId,
        eventType: event.type,
      };
    }

    const existingPurchaseStatus = purchaseSnap.exists ? purchaseSnap.data()?.status : null;
    const purchaseAlreadyPaid = existingPurchaseStatus === "paid";

    const purchasePayload = {
      courseId,
      stripeCheckoutSessionId: checkoutSessionId,
      stripePaymentIntentId,
      amountPaid: amountPaidCents !== null ? amountPaidCents / 100 : 0,
      amountPaidCents,
      currency,
      paymentStatus,
      status: purchaseStatus,
      lastWebhookEventId: event.id,
      lastWebhookEventType: event.type,
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (entitlementGranted) {
      purchasePayload.purchasedAt = FieldValue.serverTimestamp();
      purchasePayload.accessSource = "purchase";
    }

    if (purchaseAlreadyPaid) {
      transaction.set(
        purchaseRef,
        {
          lastWebhookEventId: event.id,
          lastWebhookEventType: event.type,
          paymentStatus,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    } else {
      transaction.set(purchaseRef, purchasePayload, { merge: true });
    }

    if (entitlementGranted && !purchaseAlreadyPaid) {
      transaction.set(
        db.collection("courses").doc(courseId),
        {
          purchaseCount: FieldValue.increment(1),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    }

    transaction.set(
      paymentRef,
      {
        uid,
        courseId,
        stripeCheckoutSessionId: checkoutSessionId,
        stripePaymentIntentId,
        amountPaid: amountPaidCents !== null ? amountPaidCents / 100 : 0,
        amountPaidCents,
        currency,
        expectedAmountCents,
        expectedCurrency: expectedCurrency || null,
        amountMatches,
        currencyMatches,
        paymentStatus,
        entitlementGranted,
        rawEventType: event.type,
        lastWebhookEventId: event.id,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    transaction.set(eventRef, {
      eventId: event.id,
      eventType: event.type,
      uid,
      courseId,
      stripeCheckoutSessionId: checkoutSessionId,
      entitlementGranted,
      processedAt: FieldValue.serverTimestamp(),
    });

    return {
      skipped: false,
      uid: maskUid(uid),
      courseId,
      checkoutSessionId,
      eventType: event.type,
      paymentStatus,
      status: purchaseStatus,
      entitlementGranted,
      amountMatches,
      currencyMatches,
      purchaseAlreadyPaid,
    };
  });

  return (
    result || {
      skipped: true,
      reason: "unknown",
      uid: maskUid(uid),
      courseId,
      checkoutSessionId,
      eventType: event.type,
    }
  );
}

export {
  processBundleCheckoutSessionEvent,
  processCheckoutSessionEvent,
  resolvePurchaseContext,
};

export default async function handler(req, res) {
  const requestId = setBillingRequestId(res, getBillingRequestId(req, "scwh"));
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    logBillingObs({
      level: "warn",
      scope: "stripe_courses_webhook",
      stage: "rejected",
      requestId,
      result: { httpStatus: 405 },
      error: { code: BILLING_ERROR_CODES.METHOD_NOT_ALLOWED },
    });
    return res.status(405).end("Method Not Allowed");
  }

  const webhookSecret = resolveWebhookSecret();
  if (!webhookSecret.value) {
    console.error("[courses.webhook] missing_env_secret", {
      hasStripeSecretKey: Boolean(process.env.STRIPE_SECRET_KEY),
      hasWebhookSecretCourses: Boolean(process.env.STRIPE_WEBHOOK_SECRET_COURSES),
      hasWebhookSecretCoursesTest: Boolean(process.env.STRIPE_WEBHOOK_SECRET_COURSES_TEST),
      hasWebhookSecretTest: Boolean(process.env.STRIPE_WEBHOOK_SECRET_TEST),
    });
    logBillingObs({
      level: "error",
      scope: "stripe_courses_webhook",
      stage: "config_missing",
      requestId,
      result: { httpStatus: 500 },
      config: {
        hasStripeSecretKey: Boolean(process.env.STRIPE_SECRET_KEY),
        hasWebhookSecretCourses: Boolean(process.env.STRIPE_WEBHOOK_SECRET_COURSES),
        hasWebhookSecretCoursesTest: Boolean(process.env.STRIPE_WEBHOOK_SECRET_COURSES_TEST),
        hasWebhookSecretTest: Boolean(process.env.STRIPE_WEBHOOK_SECRET_TEST),
      },
      error: { code: BILLING_ERROR_CODES.FLOW_DISABLED, reason: "missing_stripe_courses_webhook_secret" },
    });
    return res.status(500).json({ error: "Missing STRIPE_WEBHOOK_SECRET_COURSES" });
  }

  let event;
  try {
    const buf = await buffer(req);
    const sig = req.headers["stripe-signature"];
    if (!sig || typeof sig !== "string") {
      console.warn("[courses.webhook] missing_signature");
      logBillingObs({
        level: "warn",
        scope: "stripe_courses_webhook",
        stage: "signature_missing",
        requestId,
        result: { httpStatus: 400 },
        error: { code: BILLING_ERROR_CODES.AUTH_MISSING },
      });
      return res.status(400).send("Webhook Error: Missing stripe-signature header");
    }
    console.info("[courses.webhook] secret_source", {
      source: webhookSecret.source,
    });
    event = stripe.webhooks.constructEvent(
      buf,
      sig,
      webhookSecret.value
    );
  } catch (err) {
    console.warn("[courses.webhook] signature_verification_failed", {
      message: err?.message || "unknown_error",
    });
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.info("[courses.webhook] event_received", {
    eventId: event.id,
    eventType: event.type,
    livemode: Boolean(event.livemode),
  });

  if (!HANDLED_EVENTS.has(event.type)) {
    return res.status(200).json({ received: true });
  }

  const session = event?.data?.object;
  if (!session || typeof session !== "object") {
    return res.status(200).json({ received: true });
  }

  console.info("[courses.webhook] session_snapshot", {
    eventId: event.id,
    eventType: event.type,
    sessionId: session?.id || "unknown",
    paymentStatus: session?.payment_status || "unknown",
    amountTotal: session?.amount_total ?? null,
    currency: session?.currency || null,
    metadataUid: maskUid(session?.metadata?.uid || ""),
    metadataCourseId: session?.metadata?.courseId || null,
    metadataExpectedAmount: session?.metadata?.expectedAmount || null,
    metadataExpectedCurrency: session?.metadata?.expectedCurrency || null,
  });

  try {
    const db = getAdminDb();
    const outcome = await processCheckoutSessionEvent(db, event, session);
    if (outcome?.skipped) {
      console.info("[courses.webhook] event_skipped", outcome);
    } else {
      console.info("[courses.webhook] event_processed", outcome);
    }

    try {
      const invoiceOutcome = await createCourseOblioInvoice(db, event, session);
      if (invoiceOutcome?.skipped) {
        console.info("[courses.webhook] invoice_skipped", invoiceOutcome);
      } else if (invoiceOutcome?.status === "created") {
        console.info("[courses.webhook] invoice_created", invoiceOutcome);
      } else {
        console.warn("[courses.webhook] invoice_result", invoiceOutcome);
      }
    } catch (invoiceError) {
      console.error("[courses.webhook] invoice_failed", {
        eventId: event.id,
        eventType: event.type,
        message: invoiceError?.message || "unknown_error",
      });
    }
  } catch (err) {
    console.error("[courses.webhook] processing_failed", {
      eventId: event.id,
      eventType: event.type,
      message: err?.message || "unknown_error",
    });
    return res.status(500).json({ error: "Failed to process webhook" });
  }

  res.status(200).json({ received: true });
}
