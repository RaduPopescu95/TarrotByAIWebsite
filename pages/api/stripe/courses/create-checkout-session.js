import Stripe from "stripe";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "../../../../lib/firebaseAdmin";
import { requireAuth } from "../../../../lib/requireAuth";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const CHECKOUT_SESSION_COLLECTION = "courseCheckoutSessions";

function maskUid(value) {
  if (typeof value !== "string" || !value) return "unknown";
  if (value.length <= 6) return value;
  return `${value.slice(0, 3)}...${value.slice(-3)}`;
}

function resolveDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === "string") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  if (value?.toDate) return value.toDate();
  if (value?.seconds) return new Date(value.seconds * 1000);
  return null;
}

function isCoursePurchasable(course) {
  if (course?.status === "published") return true;
  if (course?.status === "scheduled") {
    const scheduledAt = resolveDate(course.scheduledAt);
    return scheduledAt ? scheduledAt.getTime() <= Date.now() : false;
  }
  return false;
}

function resolveBaseUrl(req) {
  const configuredBaseUrl =
    typeof process.env.NEXT_PUBLIC_SITE_URL === "string"
      ? process.env.NEXT_PUBLIC_SITE_URL.trim()
      : "";
  if (configuredBaseUrl) {
    return configuredBaseUrl.replace(/\/+$/, "");
  }

  const forwardedProto = req.headers?.["x-forwarded-proto"];
  const forwardedHost = req.headers?.["x-forwarded-host"];
  const host = forwardedHost || req.headers?.host;
  const proto = forwardedProto || "http";
  if (!host) return null;
  return `${proto}://${host}`.replace(/\/+$/, "");
}

function sanitizeString(value, maxLength = 255) {
  if (typeof value !== "string") return "";
  const normalized = value.trim();
  if (!normalized) return "";
  return normalized.slice(0, maxLength);
}

function normalizeAllowedPrefix(value) {
  if (typeof value !== "string") return "";
  let normalized = value.trim();
  if (!normalized) return "";
  if (
    (normalized.startsWith('"') && normalized.endsWith('"')) ||
    (normalized.startsWith("'") && normalized.endsWith("'"))
  ) {
    normalized = normalized.slice(1, -1).trim();
  }
  normalized = normalized.toLowerCase();
  normalized = normalized.replace(/\/+$/, "");
  return normalized;
}

function parseInvoiceDueDays(value) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  const rounded = Math.trunc(parsed);
  if (rounded < 0 || rounded > 365) return null;
  return rounded;
}

function normalizeBillingDetails(rawBilling, fallbackEmail = "") {
  if (!rawBilling || typeof rawBilling !== "object" || Array.isArray(rawBilling)) return null;

  const billingType = sanitizeString(rawBilling.billingType, 32).toLowerCase() === "corporate"
    ? "corporate"
    : "individual";
  const firstName = sanitizeString(rawBilling.firstName, 120);
  const lastName = sanitizeString(rawBilling.lastName, 120);
  const email = sanitizeString(rawBilling.email, 320) || sanitizeString(fallbackEmail, 320);
  const phone = sanitizeString(rawBilling.phone, 64);

  const rawAddress =
    rawBilling.address && typeof rawBilling.address === "object" && !Array.isArray(rawBilling.address)
      ? rawBilling.address
      : {};
  const address = {
    line1: sanitizeString(rawAddress.line1, 255),
    line2: sanitizeString(rawAddress.line2, 255),
    city: sanitizeString(rawAddress.city, 120),
    state: sanitizeString(rawAddress.state || rawAddress.county, 120),
    postalCode: sanitizeString(rawAddress.postalCode || rawAddress.postal_code, 32),
    country: sanitizeString(rawAddress.country, 64),
  };

  const rawCompany =
    rawBilling.company && typeof rawBilling.company === "object" && !Array.isArray(rawBilling.company)
      ? rawBilling.company
      : {};
  const company = {
    name: sanitizeString(rawCompany.name, 255),
    vat: sanitizeString(rawCompany.vat || rawCompany.cif, 64),
    reg: sanitizeString(rawCompany.reg || rawCompany.rc, 64),
    address: sanitizeString(rawCompany.address, 255),
  };

  const rawPreferences =
    rawBilling.invoicePreferences &&
    typeof rawBilling.invoicePreferences === "object" &&
    !Array.isArray(rawBilling.invoicePreferences)
      ? rawBilling.invoicePreferences
      : {};
  const dueDays = parseInvoiceDueDays(rawPreferences.dueDays ?? rawBilling.dueDays);

  const invoicePreferences = {
    sendEmail: rawPreferences.sendEmail === false ? false : true,
    eInvoice: rawPreferences.eInvoice === true,
    dueDays,
  };

  const hasAnyValue =
    Boolean(firstName) ||
    Boolean(lastName) ||
    Boolean(email) ||
    Boolean(phone) ||
    Object.values(address).some(Boolean) ||
    Object.values(company).some(Boolean);

  if (!hasAnyValue) return null;

  return {
    billingType,
    firstName,
    lastName,
    email,
    phone,
    address,
    company,
    invoicePreferences,
  };
}

function parseAllowedReturnUrlPrefixes() {
  const joined = [
    process.env.COURSES_CHECKOUT_ALLOWED_RETURN_URL_PREFIXES || "",
    process.env.MOBILE_DEEP_LINK_ALLOWED_PREFIXES || "",
  ]
    .map((value) => sanitizeString(value, 2048))
    .filter(Boolean)
    .join(",");

  const prefixes = joined
    .split(",")
    .map((entry) => normalizeAllowedPrefix(entry))
    .filter(Boolean);

  if (process.env.NODE_ENV !== "production") {
    prefixes.push("exp://", "exps://");
  }

  return Array.from(new Set(prefixes));
}

function isValidReturnUrl(urlValue, baseUrl, allowedPrefixes) {
  if (!urlValue) return false;
  const candidate = sanitizeString(urlValue, 2048);
  if (!candidate) return false;

  let parsed;
  try {
    parsed = new URL(candidate);
  } catch (_) {
    return false;
  }

  const protocol = parsed.protocol.toLowerCase();
  if (protocol === "http:" || protocol === "https:") {
    try {
      return parsed.origin === new URL(baseUrl).origin;
    } catch (_) {
      return false;
    }
  }

  const loweredCandidate = candidate.toLowerCase();
  const normalizedCandidate = loweredCandidate.replace(/\/+$/, "");
  return allowedPrefixes.some((prefix) => {
    if (!prefix) return false;
    return (
      normalizedCandidate === prefix ||
      normalizedCandidate.startsWith(`${prefix}/`) ||
      normalizedCandidate.startsWith(`${prefix}?`) ||
      normalizedCandidate.startsWith(`${prefix}#`)
    );
  });
}

function createValidationError(message) {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
}

function resolveReturnUrls({ baseUrl, courseId, successUrl, cancelUrl }) {
  const defaults = {
    successUrl: `${baseUrl}/courses/${courseId}?success=1`,
    cancelUrl: `${baseUrl}/courses/${courseId}?canceled=1`,
  };

  const requestedSuccessUrl = sanitizeString(successUrl, 2048);
  const requestedCancelUrl = sanitizeString(cancelUrl, 2048);
  if (!requestedSuccessUrl && !requestedCancelUrl) {
    console.info("[courses.checkout] return_urls_defaults", {
      courseId,
      baseUrl,
      successUrl: defaults.successUrl,
      cancelUrl: defaults.cancelUrl,
    });
    return defaults;
  }

  const allowedPrefixes = parseAllowedReturnUrlPrefixes();
  if ((requestedSuccessUrl || requestedCancelUrl) && allowedPrefixes.length === 0) {
    console.warn("[courses.checkout] return_url_allowlist_empty");
  }
  if (requestedSuccessUrl && !isValidReturnUrl(requestedSuccessUrl, baseUrl, allowedPrefixes)) {
    console.warn("[courses.checkout] invalid_success_url", {
      courseId,
      requestedSuccessUrl,
      baseUrl,
      allowedPrefixes,
    });
    throw createValidationError("Invalid successUrl");
  }
  if (requestedCancelUrl && !isValidReturnUrl(requestedCancelUrl, baseUrl, allowedPrefixes)) {
    console.warn("[courses.checkout] invalid_cancel_url", {
      courseId,
      requestedCancelUrl,
      baseUrl,
      allowedPrefixes,
    });
    throw createValidationError("Invalid cancelUrl");
  }

  console.info("[courses.checkout] return_urls_custom", {
    courseId,
    requestedSuccessUrl: requestedSuccessUrl || defaults.successUrl,
    requestedCancelUrl: requestedCancelUrl || defaults.cancelUrl,
  });

  return {
    successUrl: requestedSuccessUrl || defaults.successUrl,
    cancelUrl: requestedCancelUrl || defaults.cancelUrl,
  };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end("Method Not Allowed");
  }

  let authUser;
  try {
    authUser = await requireAuth(req);
  } catch (err) {
    return res.status(err.statusCode || 401).json({ error: err.message });
  }

  const {
    courseId: rawCourseId,
    successUrl: rawSuccessUrl,
    cancelUrl: rawCancelUrl,
    platform: rawPlatform,
    billingDetails: rawBillingDetails,
  } = req.body || {};
  const courseId = typeof rawCourseId === "string" ? rawCourseId.trim() : "";
  if (!courseId) {
    return res.status(400).json({ error: "Missing courseId" });
  }
  const sourcePlatform = sanitizeString(rawPlatform, 32).toLowerCase() || "web";

  console.info("[courses.checkout] start", {
    uid: maskUid(authUser.uid),
    courseId,
    sourcePlatform,
    hasSuccessUrl: Boolean(sanitizeString(rawSuccessUrl, 2048)),
    hasCancelUrl: Boolean(sanitizeString(rawCancelUrl, 2048)),
  });

  try {
    const db = getAdminDb();
    const billingDetails = normalizeBillingDetails(rawBillingDetails, authUser.email || "");
    const snap = await db.collection("courses").doc(courseId).get();
    if (!snap.exists) {
      console.warn("[courses.checkout] course_not_found", {
        uid: maskUid(authUser.uid),
        courseId,
      });
      return res.status(404).json({ error: "Course not found" });
    }
    const course = snap.data();
    if (!isCoursePurchasable(course)) {
      console.warn("[courses.checkout] course_not_purchasable", {
        uid: maskUid(authUser.uid),
        courseId,
        status: course?.status || "unknown",
      });
      return res.status(400).json({ error: "Course not available for purchase" });
    }

    const purchaseRef = db
      .collection("users")
      .doc(authUser.uid)
      .collection("purchases")
      .doc(courseId);
    const existingPurchaseSnap = await purchaseRef.get();
    if (existingPurchaseSnap.exists && existingPurchaseSnap.data()?.status === "paid") {
      console.info("[courses.checkout] already_purchased", {
        uid: maskUid(authUser.uid),
        courseId,
      });
      return res.status(409).json({ error: "Course already purchased" });
    }

    const currency = String(course.currency || "RON").toLowerCase();
    const unitAmount = Math.round(Number(course.price) * 100);
    if (!Number.isFinite(unitAmount) || unitAmount <= 0) {
      return res.status(400).json({ error: "Invalid course price" });
    }

    const baseUrl = resolveBaseUrl(req);
    if (!baseUrl) {
      console.error("[courses.checkout] missing_base_url", {
        uid: maskUid(authUser.uid),
        courseId,
      });
      return res.status(500).json({ error: "Missing site URL configuration" });
    }

    const returnUrls = resolveReturnUrls({
      baseUrl,
      courseId,
      successUrl: rawSuccessUrl,
      cancelUrl: rawCancelUrl,
    });
    console.info("[courses.checkout] return_urls_resolved", {
      uid: maskUid(authUser.uid),
      courseId,
      baseUrl,
      successUrl: returnUrls.successUrl,
      cancelUrl: returnUrls.cancelUrl,
    });

    const metadata = {
      uid: authUser.uid,
      courseId,
      expectedAmount: String(unitAmount),
      expectedCurrency: currency.toUpperCase(),
      sourcePlatform,
      invoiceSendEmail: String(billingDetails?.invoicePreferences?.sendEmail !== false),
      invoiceEInvoice: String(billingDetails?.invoicePreferences?.eInvoice === true),
    };
    if (billingDetails?.billingType) {
      metadata.billingType = billingDetails.billingType;
    }
    if (
      billingDetails?.invoicePreferences?.dueDays !== null &&
      billingDetails?.invoicePreferences?.dueDays !== undefined
    ) {
      metadata.invoiceDueDays = String(billingDetails.invoicePreferences.dueDays);
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      billing_address_collection: "required",
      phone_number_collection: { enabled: true },
      line_items: [
        {
          price_data: {
            currency,
            product_data: {
              name: course.title,
            },
            unit_amount: unitAmount,
          },
          quantity: 1,
        },
      ],
      metadata,
      client_reference_id: `${authUser.uid}:${courseId}`,
      ...(authUser.email ? { customer_email: authUser.email } : {}),
      success_url: returnUrls.successUrl,
      cancel_url: returnUrls.cancelUrl,
    });

    try {
      const checkoutSessionPayload = {
        uid: authUser.uid,
        courseId,
        sourcePlatform,
        stripeCheckoutSessionId: session.id,
        paymentStatus: "pending",
        status: "created",
        returnUrls,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };
      if (billingDetails) {
        checkoutSessionPayload.billing = billingDetails;
      }
      await db
        .collection(CHECKOUT_SESSION_COLLECTION)
        .doc(session.id)
        .set(checkoutSessionPayload, { merge: true });
    } catch (persistError) {
      console.warn("[courses.checkout] checkout_session_persist_failed", {
        uid: maskUid(authUser.uid),
        courseId,
        sessionId: session.id,
        message: persistError?.message || "unknown_error",
      });
    }

    console.info("[courses.checkout] session_created", {
      uid: maskUid(authUser.uid),
      courseId,
      sessionId: session.id,
    });

    return res.status(200).json({ url: session.url, sessionId: session.id });
  } catch (error) {
    const statusCode = error?.statusCode || 500;
    console.error("[courses.checkout] failed", {
      uid: maskUid(authUser.uid),
      courseId,
      statusCode,
      message: error?.message || "unknown_error",
    });
    if (statusCode === 400) {
      return res.status(400).json({ error: error.message });
    }
    return res.status(500).json({ error: "Failed to create checkout session" });
  }
}
