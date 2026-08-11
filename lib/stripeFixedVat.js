export const STRIPE_FIXED_VAT_PERCENTAGE = 21;

const taxRateCache = new Map();

function clean(value) {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Accepts dashboard input such as "21", 21, "19,5" and rejects anything that
 * cannot be a VAT rate. Returns null when the value is unusable.
 * @returns {number|null}
 */
export function normalizeVatPercentage(value) {
  const numeric =
    typeof value === "string" ? Number(value.trim().replace(",", ".")) : Number(value);
  if (!Number.isFinite(numeric) || numeric < 0 || numeric > 100) return null;
  return Math.round(numeric * 100) / 100;
}

export function resolveFixedVatTaxRateId(env = process.env) {
  const dev = env.NODE_ENV === "development";
  const testId = clean(env.STRIPE_FIXED_VAT_TAX_RATE_ID_TEST);
  const liveId = clean(env.STRIPE_FIXED_VAT_TAX_RATE_ID);
  return dev ? testId || liveId : liveId;
}

export function assessFixedVatTaxRate(
  rate,
  expectedId = "",
  percentage = STRIPE_FIXED_VAT_PERCENTAGE
) {
  const reasons = [];
  if (!rate || typeof rate !== "object") reasons.push("missing_tax_rate");
  if (expectedId && clean(rate?.id) !== clean(expectedId)) reasons.push("tax_rate_id_mismatch");
  if (rate?.active !== true) reasons.push("tax_rate_inactive");
  if (rate?.inclusive !== false) reasons.push("tax_rate_must_be_exclusive");
  if (Number(rate?.percentage) !== percentage) reasons.push("tax_rate_percentage_mismatch");
  return { ok: reasons.length === 0, reasons };
}

/**
 * Falls back to the built-in rate whenever settings cannot be read, so checkout
 * never depends on Firestore availability.
 */
async function resolveConfiguredVatPercentage() {
  try {
    const { getVatPercentage } = await import("./globalSettings");
    return await getVatPercentage();
  } catch {
    return STRIPE_FIXED_VAT_PERCENTAGE;
  }
}

export async function getFixedVatTaxRateId(stripe, env = process.env, expectedPercentage) {
  const taxRateId = resolveFixedVatTaxRateId(env);
  if (!taxRateId) throw new Error("Missing STRIPE_FIXED_VAT_TAX_RATE_ID");
  if (!taxRateId.startsWith("txr_")) throw new Error("Invalid STRIPE_FIXED_VAT_TAX_RATE_ID");

  const percentage =
    normalizeVatPercentage(expectedPercentage) ?? (await resolveConfiguredVatPercentage());
  const cacheKey = `${taxRateId}:${percentage}`;

  let pending = taxRateCache.get(cacheKey);
  if (!pending) {
    pending = stripe.taxRates
      .retrieve(taxRateId)
      .then((rate) => {
        const assessment = assessFixedVatTaxRate(rate, taxRateId, percentage);
        if (!assessment.ok) {
          throw new Error(`Invalid fixed VAT Tax Rate: ${assessment.reasons.join(",")}`);
        }
        return taxRateId;
      })
      .catch((error) => {
        taxRateCache.delete(cacheKey);
        throw error;
      });
    taxRateCache.set(cacheKey, pending);
  }
  return pending;
}

/**
 * Guards the dashboard against a displayed rate that Stripe would not charge.
 * @throws {Error} when the live Tax Rate does not match `percentage`
 */
export async function assertVatPercentageMatchesStripe(
  stripe,
  percentage,
  env = process.env
) {
  const normalized = normalizeVatPercentage(percentage);
  if (normalized === null) throw new Error("invalid_vat_percentage");

  const taxRateId = resolveFixedVatTaxRateId(env);
  if (!taxRateId) throw new Error("vat_tax_rate_not_configured");

  const rate = await stripe.taxRates.retrieve(taxRateId);
  const assessment = assessFixedVatTaxRate(rate, taxRateId, normalized);
  if (!assessment.ok) {
    const error = new Error("vat_percentage_stripe_mismatch");
    error.reasons = assessment.reasons;
    error.stripePercentage = normalizeVatPercentage(rate?.percentage);
    throw error;
  }
  return { taxRateId, percentage: normalized };
}

export function calculateFixedVatMinor(
  netMinor,
  percentage = STRIPE_FIXED_VAT_PERCENTAGE
) {
  const net = Number(netMinor);
  if (!Number.isFinite(net) || net < 0) throw new Error("Invalid net amount");
  const normalizedNet = Math.round(net);
  const tax = Math.round((normalizedNet * percentage) / 100);
  return {
    net: normalizedNet,
    tax,
    total: normalizedNet + tax,
    percentage,
  };
}

export function calculateFixedVatMajor(
  netMajor,
  percentage = STRIPE_FIXED_VAT_PERCENTAGE
) {
  const net = Number(netMajor);
  if (!Number.isFinite(net) || net < 0) throw new Error("Invalid net amount");
  return calculateFixedVatMinor(Math.round(net * 100), percentage).total / 100;
}

export function __resetFixedVatTaxRateCacheForTests() {
  taxRateCache.clear();
}
