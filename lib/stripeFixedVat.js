import {
  STRIPE_FIXED_VAT_PERCENTAGE,
  normalizeVatPercentage,
  calculateFixedVatMinor,
  calculateFixedVatMajor,
} from "./stripeFixedVatCore";

export {
  STRIPE_FIXED_VAT_PERCENTAGE,
  normalizeVatPercentage,
  calculateFixedVatMinor,
  calculateFixedVatMajor,
};

const taxRateCache = new Map();

function clean(value) {
  return typeof value === "string" ? value.trim() : "";
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
 * Validates the configured Stripe Tax Rate against `expectedPercentage`.
 * Callers that need the dashboard VAT setting should pass it explicitly —
 * this module stays free of firebase-admin so client pages can import helpers.
 */
export async function getFixedVatTaxRateId(stripe, env = process.env, expectedPercentage) {
  const taxRateId = resolveFixedVatTaxRateId(env);
  if (!taxRateId) throw new Error("Missing STRIPE_FIXED_VAT_TAX_RATE_ID");
  if (!taxRateId.startsWith("txr_")) throw new Error("Invalid STRIPE_FIXED_VAT_TAX_RATE_ID");

  const percentage =
    normalizeVatPercentage(expectedPercentage) ?? STRIPE_FIXED_VAT_PERCENTAGE;
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

export function __resetFixedVatTaxRateCacheForTests() {
  taxRateCache.clear();
}
