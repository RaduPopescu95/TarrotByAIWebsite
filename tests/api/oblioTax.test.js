import {
  resolveCheckoutSessionOblioTax,
  resolveExclusiveOblioTax,
  resolveStripeInvoiceOblioTax,
} from "../../utils/oblioTax";

const vatPayer = { sellerVatPayer: true, defaultRate: 21, normalVatName: "Normala", zeroVatName: "Scutit" };

describe("Oblio tax payloads", () => {
  test("consultation: 300 RON + 21% produces a 363 RON paid total", () => {
    expect(resolveCheckoutSessionOblioTax({ amount_subtotal: 30000, total_details: { amount_tax: 6300 }, amount_total: 36300 }, vatPayer)).toMatchObject({ ok: true, price: 300, tax: 63, total: 363, vatIncluded: 0, vatPercentage: 21, vatName: "Normala" });
  });

  test("subscription: 5 EUR + 21% produces a 6.05 EUR paid total", () => {
    expect(resolveStripeInvoiceOblioTax({ subtotal: 500, tax: 105, amount_paid: 605 }, vatPayer)).toMatchObject({ ok: true, price: 5, tax: 1.05, total: 6.05, vatIncluded: 0, vatPercentage: 21 });
  });

  test("a final-price VAT-inclusive product remains internally reconcilable when Stripe returns its net/tax breakdown", () => {
    expect(resolveExclusiveOblioTax({ totalCents: 30000, subtotalCents: 24793, taxCents: 5207, settings: vatPayer })).toMatchObject({ ok: true, price: 247.93, total: 300, vatIncluded: 0 });
  });

  test("Stripe zero tax maps to the configured valid zero-VAT Oblio name", () => {
    expect(resolveExclusiveOblioTax({ totalCents: 500, subtotalCents: 500, taxCents: 0, settings: vatPayer })).toMatchObject({ ok: true, price: 5, total: 5, vatPercentage: 0, vatName: "Scutit", vatIncluded: 0 });
  });

  test("blocks an invoice when the Stripe total does not equal net plus tax", () => {
    expect(resolveExclusiveOblioTax({ totalCents: 600, subtotalCents: 500, taxCents: 105, settings: vatPayer })).toEqual(expect.objectContaining({ ok: false, reason: "stripe_total_tax_mismatch" }));
  });
});
