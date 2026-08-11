const {
  STRIPE_FIXED_VAT_PERCENTAGE,
  __resetFixedVatTaxRateCacheForTests,
  assertVatPercentageMatchesStripe,
  assessFixedVatTaxRate,
  calculateFixedVatMajor,
  calculateFixedVatMinor,
  getFixedVatTaxRateId,
  normalizeVatPercentage,
  resolveFixedVatTaxRateId,
} = require("../../lib/stripeFixedVat");

describe("stripeFixedVat", () => {
  beforeEach(() => {
    __resetFixedVatTaxRateCacheForTests();
  });

  it("resolves mode-specific Tax Rate IDs", () => {
    expect(
      resolveFixedVatTaxRateId({
        NODE_ENV: "production",
        STRIPE_FIXED_VAT_TAX_RATE_ID: "txr_live",
        STRIPE_FIXED_VAT_TAX_RATE_ID_TEST: "txr_test",
      })
    ).toBe("txr_live");
    expect(
      resolveFixedVatTaxRateId({
        NODE_ENV: "development",
        STRIPE_FIXED_VAT_TAX_RATE_ID: "txr_live",
        STRIPE_FIXED_VAT_TAX_RATE_ID_TEST: "txr_test",
      })
    ).toBe("txr_test");
  });

  it("calculates Premium 5 EUR net as 6.05 EUR total", () => {
    expect(STRIPE_FIXED_VAT_PERCENTAGE).toBe(21);
    expect(calculateFixedVatMinor(500)).toEqual({
      net: 500,
      tax: 105,
      total: 605,
      percentage: 21,
    });
  });

  it("calculates VAT-inclusive public display prices from net major amounts", () => {
    expect(calculateFixedVatMajor(5)).toBe(6.05);
    expect(calculateFixedVatMajor(25)).toBe(30.25);
    expect(calculateFixedVatMajor(0)).toBe(0);
  });

  it("rejects inactive, inclusive, or non-21 Tax Rates", () => {
    expect(
      assessFixedVatTaxRate({
        id: "txr_1",
        active: false,
        inclusive: true,
        percentage: 19,
      }).ok
    ).toBe(false);
  });

  it("normalizes dashboard VAT input and rejects impossible rates", () => {
    expect(normalizeVatPercentage("21")).toBe(21);
    expect(normalizeVatPercentage(" 19,5 ")).toBe(19.5);
    expect(normalizeVatPercentage(0)).toBe(0);
    expect(normalizeVatPercentage(-1)).toBeNull();
    expect(normalizeVatPercentage(101)).toBeNull();
    expect(normalizeVatPercentage("abc")).toBeNull();
  });

  it("applies a configured rate to display prices", () => {
    expect(calculateFixedVatMajor(5, 19)).toBe(5.95);
    expect(calculateFixedVatMinor(1000, 19)).toEqual({
      net: 1000,
      tax: 190,
      total: 1190,
      percentage: 19,
    });
  });

  it("refuses a dashboard rate Stripe would not charge", async () => {
    const stripe = {
      taxRates: {
        retrieve: jest.fn().mockResolvedValue({
          id: "txr_fixed",
          active: true,
          inclusive: false,
          percentage: 21,
        }),
      },
    };
    const env = { NODE_ENV: "production", STRIPE_FIXED_VAT_TAX_RATE_ID: "txr_fixed" };

    await expect(assertVatPercentageMatchesStripe(stripe, 21, env)).resolves.toEqual({
      taxRateId: "txr_fixed",
      percentage: 21,
    });
    await expect(
      assertVatPercentageMatchesStripe(stripe, 19, env)
    ).rejects.toMatchObject({
      message: "vat_percentage_stripe_mismatch",
      stripePercentage: 21,
    });
    await expect(
      assertVatPercentageMatchesStripe(stripe, 21, { NODE_ENV: "production" })
    ).rejects.toThrow("vat_tax_rate_not_configured");
  });

  it("retrieves and caches a validated Tax Rate", async () => {
    const retrieve = jest.fn().mockResolvedValue({
      id: "txr_fixed",
      active: true,
      inclusive: false,
      percentage: 21,
    });
    const stripe = { taxRates: { retrieve } };
    const env = {
      NODE_ENV: "production",
      STRIPE_FIXED_VAT_TAX_RATE_ID: "txr_fixed",
    };
    await expect(getFixedVatTaxRateId(stripe, env)).resolves.toBe("txr_fixed");
    await expect(getFixedVatTaxRateId(stripe, env)).resolves.toBe("txr_fixed");
    expect(retrieve).toHaveBeenCalledTimes(1);
  });
});
