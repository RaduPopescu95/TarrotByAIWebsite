/**
 * Produces an Oblio line from Stripe's final tax calculation.  Amounts passed
 * to this module are always minor units, so floating point rounding cannot
 * turn a paid Stripe total into a different Oblio total.
 */
function truthy(value) {
  return typeof value === "string" && ["1", "true", "yes", "y", "on"].includes(value.trim().toLowerCase());
}

function asCents(value) {
  return typeof value === "number" && Number.isFinite(value) ? Math.round(value) : null;
}

function money(cents) {
  return Math.round(cents) / 100;
}

export function getOblioVatSettings(env = process.env) {
  const sellerVatPayer = truthy(env.OBLIO_SELLER_VAT_PAYER || env.OBLIO_VAT_PAYER);
  const configuredRate = Number(env.OBLIO_DEFAULT_VAT_RATE ?? env.OLBIO_DEFAULT_VAT_RATE ?? "19");
  return {
    sellerVatPayer,
    defaultRate: Number.isFinite(configuredRate) ? configuredRate : 19,
    normalVatName: env.OBLIO_VAT_NAME || "Normala",
    zeroVatName: env.OBLIO_ZERO_VAT_NAME || "Scutit",
  };
}

export function shouldSendOblioEInvoice(env = process.env) {
  return !truthy(env.OBLIO_DISABLE_EINVOICE);
}

/**
 * @param {{totalCents: number, subtotalCents?: number, taxCents?: number, settings?: object}} input
 * @returns {{ok: boolean, reason?: string, price?: number, total?: number, tax?: number, vatPercentage?: number, vatName?: string, vatIncluded?: number}}
 */
export function resolveExclusiveOblioTax(input) {
  const settings = input.settings || getOblioVatSettings();
  const totalCents = asCents(input.totalCents);
  if (totalCents === null || totalCents < 0) return { ok: false, reason: "missing_stripe_total" };

  let subtotalCents = asCents(input.subtotalCents);
  let taxCents = asCents(input.taxCents);
  if (!settings.sellerVatPayer) {
    // A non-VAT payer has no tax to add and the Stripe total is the net price.
    return { ok: true, price: money(totalCents), total: money(totalCents), tax: 0, vatPercentage: 0, vatName: "Neplatitor", vatIncluded: 0 };
  }

  if (subtotalCents !== null && taxCents === null) taxCents = totalCents - subtotalCents;
  if (subtotalCents === null && taxCents !== null) subtotalCents = totalCents - taxCents;
  if (subtotalCents === null) return { ok: false, reason: "missing_stripe_subtotal" };
  if (taxCents === null || taxCents < 0 || subtotalCents < 0) return { ok: false, reason: "invalid_stripe_tax_breakdown" };
  if (subtotalCents + taxCents !== totalCents) return { ok: false, reason: "stripe_total_tax_mismatch" };

  // A zero tax returned by Stripe is intentional (zero-rated/reverse charge).
  if (taxCents === 0) {
    return { ok: true, price: money(subtotalCents), total: money(totalCents), tax: 0, vatPercentage: 0, vatName: settings.zeroVatName, vatIncluded: 0 };
  }

  const calculatedRate = (taxCents * 100) / subtotalCents;
  const roundedRate = Math.round(calculatedRate * 100) / 100;
  const expectedTax = Math.round((subtotalCents * roundedRate) / 100);
  if (expectedTax !== taxCents) return { ok: false, reason: "stripe_tax_rate_rounding_mismatch" };

  return {
    ok: true,
    price: money(subtotalCents),
    total: money(totalCents),
    tax: money(taxCents),
    vatPercentage: roundedRate,
    vatName: settings.normalVatName,
    vatIncluded: 0,
  };
}

export function resolveCheckoutSessionOblioTax(session, settings) {
  return resolveExclusiveOblioTax({
    totalCents: session?.amount_total,
    subtotalCents: session?.amount_subtotal,
    taxCents: session?.total_details?.amount_tax,
    settings,
  });
}

export function resolveStripeInvoiceOblioTax(invoice, settings) {
  const totalTaxAmounts = Array.isArray(invoice?.total_tax_amounts) ? invoice.total_tax_amounts : [];
  const totalTaxes = Array.isArray(invoice?.total_taxes) ? invoice.total_taxes : [];
  const arrayTax = [...totalTaxAmounts, ...totalTaxes].reduce((sum, row) => sum + (asCents(row?.amount) || 0), 0);
  return resolveExclusiveOblioTax({
    totalCents: invoice?.amount_paid ?? invoice?.total,
    subtotalCents: invoice?.subtotal,
    taxCents: asCents(invoice?.tax) ?? (arrayTax || undefined),
    settings,
  });
}

export function invoiceTotalsMatchStripe(taxLine, totalCents) {
  return Boolean(taxLine?.ok && Math.round(taxLine.total * 100) === asCents(totalCents));
}

/** Existing Stripe Prices cannot change tax_behavior after use. */
export async function getStripePriceTaxBehavior(stripe, priceId) {
  const price = await stripe.prices.retrieve(priceId);
  return { id: price.id, taxBehavior: price.tax_behavior || "unspecified", currency: price.currency, unitAmount: price.unit_amount };
}
