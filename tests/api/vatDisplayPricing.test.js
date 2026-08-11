const {
  buildPremiumDisplayPricing,
} = require("../../lib/premiumDisplayPricing");
const {
  DEFAULT_VAT_PERCENTAGE,
  formatGross,
  grossFromNet,
} = require("../../utils/vatDisplay");

describe("premium display pricing", () => {
  it("turns the net Stripe price into a VAT-inclusive total", () => {
    expect(
      buildPremiumDisplayPricing(
        { netAmountCents: 500, currency: "EUR", interval: "month" },
        21
      )
    ).toEqual({
      currency: "EUR",
      interval: "month",
      vatPercentage: 21,
      priceIncludesVat: true,
      netAmountCents: 500,
      taxAmountCents: 105,
      totalAmountCents: 605,
      netAmount: 5,
      totalAmount: 6.05,
    });
  });

  it("follows the configured rate", () => {
    expect(
      buildPremiumDisplayPricing({ netAmountCents: 500, currency: "EUR" }, 19)
        .totalAmountCents
    ).toBe(595);
  });
});

describe("client VAT display helpers", () => {
  it("adds VAT on integer minor units, like Stripe", () => {
    expect(grossFromNet(300, 21)).toBe(363);
    expect(grossFromNet(150, 21)).toBe(181.5);
    expect(grossFromNet(0, 21)).toBe(0);
    expect(DEFAULT_VAT_PERCENTAGE).toBe(21);
  });

  it("returns null for unusable amounts instead of NaN", () => {
    expect(grossFromNet(undefined)).toBeNull();
    expect(grossFromNet("")).toBeNull();
    expect(grossFromNet(-5)).toBeNull();
    expect(formatGross(undefined)).toBe("");
  });

  it("formats a VAT-inclusive amount with its currency", () => {
    expect(formatGross(300, { vatPercentage: 21, currency: "RON" })).toContain("363");
  });
});
