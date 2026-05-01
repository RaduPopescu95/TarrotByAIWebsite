import { FieldValue } from "firebase-admin/firestore";
import { createOlbioInvoiceFromPayload } from "../utils/olbioClient";
import {
  buildInvoiceDecision,
  buildOblioClientFromNormalized,
  logBillingAudit,
  normalizeBillingContext,
} from "../utils/billingAudit.mjs";

const PREMIUM_OBLIO_COLLECTION = "premiumOblioInvoices";

function sanitizeString(value, maxLength = 255) {
  if (typeof value !== "string") return "";
  const normalized = value.trim();
  if (!normalized) return "";
  return normalized.slice(0, maxLength);
}

function maskUid(value) {
  if (typeof value !== "string" || !value) return "unknown";
  if (value.length <= 6) return value;
  return `${value.slice(0, 3)}...${value.slice(-3)}`;
}

function isTruthyEnv(val) {
  if (typeof val !== "string") return false;
  return ["1", "true", "yes", "y", "on"].includes(val.trim().toLowerCase());
}

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

function normalizeCurrency(value, fallback = "RON") {
  if (typeof value !== "string" || !value.trim()) return fallback;
  return value.trim().toUpperCase();
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

function parseInvoiceDueDays(value) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  const rounded = Math.trunc(parsed);
  if (rounded < 0 || rounded > 365) return null;
  return rounded;
}

/**
 * Mirrors pages/api/stripe/courses/webhook normalizeCourseBilling — stored snapshot + optional Stripe session excerpt.
 */
export function mergePremiumCheckoutBilling(checkoutSessionLike, sessionLike) {
  const metadata = sessionLike?.metadata || {};
  const storedBilling =
    checkoutSessionLike?.billing &&
    typeof checkoutSessionLike.billing === "object" &&
    !Array.isArray(checkoutSessionLike.billing)
      ? checkoutSessionLike.billing
      : {};
  const customerDetails =
    sessionLike?.customer_details &&
    typeof sessionLike.customer_details === "object" &&
    !Array.isArray(sessionLike.customer_details)
      ? sessionLike.customer_details
      : {};

  const parsedName = splitName(customerDetails?.name || "");
  const storedAddress = normalizeAddress(storedBilling.address);
  const customerAddress = normalizeAddress(customerDetails.address);

  const firstName = sanitizeString(storedBilling.firstName, 120) || parsedName.firstName;
  const lastName = sanitizeString(storedBilling.lastName, 120) || parsedName.lastName;
  const email =
    sanitizeString(storedBilling.email, 320) ||
    sanitizeString(customerDetails.email, 320) ||
    sanitizeString(sessionLike?.customer_email, 320);
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
    storedBilling.company && typeof storedBilling.company === "object" && !Array.isArray(storedBilling.company)
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
    billingTypeRaw === "corporate" && hasCorporateData ? "corporate" : hasCorporateData ? "corporate" : "individual";

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

function buildOblioClientFlat(billing) {
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

function getSellerVatConfig() {
  const sellerVatPayer = isTruthyEnv(process.env.OBLIO_SELLER_VAT_PAYER || process.env.OBLIO_VAT_PAYER);
  const envDefaultVat = process.env.OBLIO_DEFAULT_VAT_RATE ?? process.env.OLBIO_DEFAULT_VAT_RATE ?? "19";

  if (!sellerVatPayer) {
    return { vatName: "Neplatitor", vatPercentage: 0, vatIncluded: 0 };
  }

  const vatPercentage = Number(envDefaultVat);
  return {
    vatName: "Normala",
    vatPercentage: Number.isFinite(vatPercentage) ? vatPercentage : 19,
    vatIncluded: 1,
  };
}

/**
 * @param {object} params
 * @param {import("firebase-admin/firestore").Firestore} params.db
 * @param {import("stripe").default} params.stripe
 * @param {object} params.invoice Stripe Invoice
 * @param {string} params.premiumFlowMetadata e.g. site_premium
 */
export async function emitPremiumSubscriptionOblioInvoice({ db, stripe, invoice, premiumFlowMetadata }) {
  const invoiceId = sanitizeString(invoice?.id, 128);
  if (!invoiceId) {
    return { skipped: true, reason: "missing_invoice_id" };
  }

  const amountPaid = typeof invoice.amount_paid === "number" ? invoice.amount_paid : 0;
  if (amountPaid <= 0) {
    return { skipped: true, reason: "zero_amount", invoiceId };
  }

  const subId =
    typeof invoice.subscription === "string"
      ? invoice.subscription
      : invoice.subscription?.id || "";
  if (!subId) {
    return { skipped: true, reason: "missing_subscription", invoiceId };
  }

  const oblioRef = db.collection(PREMIUM_OBLIO_COLLECTION).doc(invoiceId);
  const existing = await oblioRef.get();
  if (existing.exists && existing.data()?.status === "created") {
    return { skipped: true, reason: "invoice_already_created", invoiceId };
  }

  let subscription;
  try {
    subscription = await stripe.subscriptions.retrieve(subId);
  } catch (e) {
    console.warn("[premium.oblio] subscription_retrieve_failed", { message: e?.message, invoiceId });
    return { skipped: true, reason: "subscription_retrieve_failed", invoiceId };
  }

  const meta = subscription?.metadata || {};
  if (meta.flow !== premiumFlowMetadata) {
    return { skipped: true, reason: "not_site_premium_flow", invoiceId };
  }

  const uid = sanitizeString(meta.uid, 128);
  if (!uid) {
    return { skipped: true, reason: "missing_uid", invoiceId };
  }

  let userSnap;
  try {
    userSnap = await db.collection("Users").doc(uid).get();
  } catch (e) {
    console.warn("[premium.oblio] user_read_failed", { uid: maskUid(uid), message: e?.message });
    return { skipped: true, reason: "user_read_failed", invoiceId };
  }

  const profile = userSnap.exists ? userSnap.data()?.premiumBillingProfile : null;
  if (!profile?.billing || typeof profile.billing !== "object") {
    console.warn("[premium.oblio] missing_premiumBillingProfile", { uid: maskUid(uid), invoiceId });
    await oblioRef.set(
      {
        status: "skipped_missing_billing",
        invoiceId,
        uid,
        subscriptionId: subId,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    return { skipped: true, reason: "missing_premiumBillingProfile", invoiceId };
  }

  const checkoutLike = {
    billing: profile.billing,
    rawFormValues: profile.rawFormValues || null,
  };
  const sessionLike = {
    metadata: profile.stripeMetadataSnapshot || subscription.metadata || {},
    customer_details:
      invoice.customer_email || invoice.customer_name
        ? {
            email: invoice.customer_email,
            name: invoice.customer_name,
          }
        : {},
    customer_email: invoice.customer_email,
  };

  const billingMerged = mergePremiumCheckoutBilling(checkoutLike, sessionLike);

  const rawFormValues = profile.rawFormValues || {};
  const billingAudit = normalizeBillingContext(
    {
      ...rawFormValues,
      ...billingMerged,
      companyName: billingMerged.company?.name,
      cif: billingMerged.company?.vat,
      cnp: billingMerged.cnp || rawFormValues.cnp,
      reg: billingMerged.company?.reg,
      address: billingMerged.billingType === "corporate" ? billingMerged.company?.address : billingMerged.address?.line1,
      state: billingMerged.address?.state,
      city: billingMerged.address?.city,
      country: billingMerged.address?.country,
      postalCode: billingMerged.address?.postalCode,
      contact: `${billingMerged.firstName || ""} ${billingMerged.lastName || ""}`.trim(),
      name:
        billingMerged.billingType === "corporate"
          ? billingMerged.company?.name
          : `${billingMerged.firstName || ""} ${billingMerged.lastName || ""}`.trim(),
      email: billingMerged.email,
      phone: billingMerged.phone,
    },
    { defaultCountry: "Romania", individualCnpOptional: true }
  );
  const invoiceDecision = buildInvoiceDecision(billingAudit);
  logBillingAudit({
    flow: "premium_subscription",
    stage: "webhook_pre_oblio",
    requestId: `premium_inv_${invoiceId}`,
    invoiceId,
    normalized: billingAudit.normalizedClient,
    decision: invoiceDecision,
  });

  if (!invoiceDecision.emitInvoice) {
    await oblioRef.set(
      {
        status: "skipped_missing_fields",
        reason: invoiceDecision.blockedReason || "emitInvoice false",
        invoiceId,
        uid,
        subscriptionId: subId,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    return { skipped: true, reason: "oblio_blocked", invoiceId, detail: invoiceDecision.blockedReason };
  }

  const oblioCif = sanitizeString(process.env.OBLIO_CIF || process.env.OBLIO_COMPANY_CIF || "", 64);
  const oblioSeries = sanitizeString(process.env.OBLIO_SERIES || "", 64);
  if (!oblioCif || !oblioSeries) {
    await oblioRef.set(
      {
        status: "skipped_oblio_not_configured",
        invoiceId,
        uid,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    return { skipped: true, reason: "oblio_not_configured", invoiceId };
  }

  const currency = normalizeCurrency(invoice.currency, "RON");
  const amountRON = amountPaid / 100;
  const issueDate = todayISO();
  const vatCfg = getSellerVatConfig();
  const prefs = billingMerged.invoicePreferences || { sendEmail: true, eInvoice: false, dueDays: null };

  const lineDesc =
    invoice.lines?.data?.[0]?.description &&
    typeof invoice.lines.data[0].description === "string" &&
    invoice.lines.data[0].description.trim()
      ? invoice.lines.data[0].description.trim()
      : "";
  const periodLabel =
    sanitizeString(lineDesc, 300) ||
    sanitizeString(`${invoice.billing_reason || "subscription"} · ${invoiceId}`, 300);

  const invoicePayload = {
    cif: oblioCif,
    client: buildOblioClientFlat(billingMerged),
    issueDate,
    seriesName: oblioSeries,
    language: "RO",
    precision: 2,
    currency,
    sendEmail: prefs.sendEmail === false ? 0 : 1,
    sendEInvoice: invoiceDecision.sendEInvoice ? 1 : 0,
    products: [
      {
        name: "Abonament premium site",
        description: `${periodLabel}`.slice(0, 500),
        price: amountRON,
        measuringUnit: "bucata",
        vatName: vatCfg.vatName,
        vatPercentage: vatCfg.vatPercentage,
        vatIncluded: vatCfg.vatIncluded,
        quantity: 1,
        productType: "Serviciu",
      },
    ],
    mentions: `Factura generata automat pentru abonament premium. Stripe invoice: ${invoiceId}`,
    internalNote: `uid=${uid}; sub=${subId}; eInvoice=${invoiceDecision.sendEInvoice ? "1" : "0"}`,
    collect: {
      type: "Card",
      documentNumber: `STRIPE-${invoiceId}`,
      value: amountRON,
      issueDate,
      mentions: "Plata procesata prin Stripe",
    },
  };
  invoicePayload.client = buildOblioClientFromNormalized(billingAudit.normalizedClient);

  const requestId = `premium_inv_${invoiceId}_${Date.now()}`;
  const oblioResp = await createOlbioInvoiceFromPayload({
    invoicePayload,
    requestId,
  });

  if (!oblioResp || oblioResp.status !== 200 || !oblioResp.data) {
    await oblioRef.set(
      {
        status: "error",
        invoiceId,
        uid,
        subscriptionId: subId,
        errorText: sanitizeString(oblioResp?.errorText || "Oblio failed", 600),
        requestId,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    await db.collection("Users").doc(uid).set(
      {
        premiumLastOblioError: sanitizeString(oblioResp?.errorText || "error", 500),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    return { skipped: false, status: "error", invoiceId, message: oblioResp?.errorText };
  }

  await oblioRef.set(
    {
      status: "created",
      invoiceId,
      uid,
      subscriptionId: subId,
      oblioResponse: oblioResp.data || {},
      requestId,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  await db.collection("Users").doc(uid).set(
    {
      premiumLastOblioInvoiceAt: FieldValue.serverTimestamp(),
      premiumLastOblioInvoiceId: invoiceId,
      premiumLastOblioNumber:
        oblioResp.data?.number || oblioResp.data?.seriesNumber || sanitizeString(oblioResp.data?.documentNumber, 64),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  return { skipped: false, status: "created", invoiceId, oblio: oblioResp.data };
}
