/**
 * Client-safe VAT helpers. Keep this module free of firebase-admin / Stripe
 * SDK imports so Pages Router dashboard bundles can use it.
 */

export const STRIPE_FIXED_VAT_PERCENTAGE = 21;

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
