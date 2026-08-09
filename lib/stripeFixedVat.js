export const STRIPE_FIXED_VAT_PERCENTAGE = 21;

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

export async function getFixedVatTaxRateId(stripe, env = process.env) {
  const taxRateId = resolveFixedVatTaxRateId(env);
  if (!taxRateId) throw new Error("Missing STRIPE_FIXED_VAT_TAX_RATE_ID");
  if (!taxRateId.startsWith("txr_")) throw new Error("Invalid STRIPE_FIXED_VAT_TAX_RATE_ID");

  let pending = taxRateCache.get(taxRateId);
  if (!pending) {
    pending = stripe.taxRates
      .retrieve(taxRateId)
      .then((rate) => {
        const assessment = assessFixedVatTaxRate(rate, taxRateId);
        if (!assessment.ok) {
          throw new Error(`Invalid fixed VAT Tax Rate: ${assessment.reasons.join(",")}`);
        }
        return taxRateId;
      })
      .catch((error) => {
        taxRateCache.delete(taxRateId);
        throw error;
      });
    taxRateCache.set(taxRateId, pending);
  }
  return pending;
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
