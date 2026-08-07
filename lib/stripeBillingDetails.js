/** Shared Stripe checkout billing sanitization (courses, premium subscription). */

export const DEFAULT_BILLING_POSTAL_CODE = "000000";

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

/**
 * @param {object|null|undefined} rawBilling
 * @param {string} [fallbackEmail]
 * @returns {object|null}
 */
export function normalizeBillingDetails(rawBilling, fallbackEmail = "") {
  if (!rawBilling || typeof rawBilling !== "object" || Array.isArray(rawBilling)) return null;

  const billingType =
    sanitizeString(rawBilling.billingType, 32).toLowerCase() === "corporate"
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
    postalCode:
      sanitizeString(rawAddress.postalCode || rawAddress.postal_code, 32) ||
      DEFAULT_BILLING_POSTAL_CODE,
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
    cnp: sanitizeString(rawBilling.cnp, 32),
    email,
    phone,
    address,
    company,
    invoicePreferences,
  };
}

/**
 * Builds the flat object passed to normalizeBillingContext (courses + premium APIs).
 */
export function buildBillingContextInput(billingDetails, rawBillingDetails, authEmail = "") {
  return {
    ...(rawBillingDetails || {}),
    ...(billingDetails || {}),
    companyName: billingDetails?.company?.name,
    cif: billingDetails?.company?.vat,
    cnp: rawBillingDetails?.cnp ?? billingDetails?.cnp,
    reg: billingDetails?.company?.reg,
    address:
      billingDetails?.billingType === "corporate"
        ? billingDetails?.company?.address
        : billingDetails?.address?.line1,
    state: billingDetails?.address?.state,
    city: billingDetails?.address?.city,
    country: billingDetails?.address?.country,
    postalCode: billingDetails?.address?.postalCode,
    contact: `${billingDetails?.firstName || ""} ${billingDetails?.lastName || ""}`.trim(),
    name:
      billingDetails?.billingType === "corporate"
        ? billingDetails?.company?.name
        : `${billingDetails?.firstName || ""} ${billingDetails?.lastName || ""}`.trim(),
    email: billingDetails?.email || authEmail || "",
    phone: billingDetails?.phone || "",
  };
}
