const {
  PREMIUM_PRICE_CHANGE_CONSENT_VERSION,
  PREMIUM_TAX_MIGRATION_METADATA,
  PRICE_CHANGE_SEGMENTS,
  buildConsentRecord,
  classifyPriceChangeSegment,
  hasValidPriceChangeConsent,
} = require("../../lib/premiumPriceChangeConsent");

const {
  classifyPriceChangeSegment: classifyFromScript,
  hasValidPriceChangeConsentFromUserData,
} = require("../../scripts/migrate-premium-subscriptions-tax.cjs");

describe("premiumPriceChangeConsent", () => {
  it("accepts only matching version + accepted status", () => {
    expect(hasValidPriceChangeConsent({})).toBe(false);
    expect(
      hasValidPriceChangeConsent({
        premiumPriceChangeConsent: {
          version: PREMIUM_PRICE_CHANGE_CONSENT_VERSION,
          status: "accepted",
          acceptedAt: "2026-08-06T12:00:00.000Z",
        },
      })
    ).toBe(true);
    expect(
      hasValidPriceChangeConsent({
        premiumPriceChangeConsent: {
          version: "other",
          status: "accepted",
          acceptedAt: "2026-08-06T12:00:00.000Z",
        },
      })
    ).toBe(false);
  });

  it("builds a consent record with totals and version", () => {
    const record = buildConsentRecord({
      subscriptionId: "sub_123",
      oldPriceId: "price_old",
      newPriceId: "price_new",
      renewalAtIso: "2026-09-01T00:00:00.000Z",
      billingCountry: "ro",
      uid: "uid_1",
      serverTimestamp: "2026-08-06T12:00:00.000Z",
    });
    expect(record).toEqual(
      expect.objectContaining({
        version: PREMIUM_PRICE_CHANGE_CONSENT_VERSION,
        status: "accepted",
        oldTotalCents: 500,
        newTotalCents: 605,
        billingCountry: "RO",
        subscriptionId: "sub_123",
      })
    );
  });

  it("classifies A/B/C segments from price + invoice amount", () => {
    const legacy = ["price_legacy"];
    const exclusive = "price_exclusive";

    expect(
      classifyPriceChangeSegment({
        priceId: "price_legacy",
        legacyPriceIds: legacy,
        exclusivePriceId: exclusive,
        latestAmountPaid: 500,
      })
    ).toBe(PRICE_CHANGE_SEGMENTS.A_NEMIGRAT);

    expect(
      classifyPriceChangeSegment({
        priceId: exclusive,
        taxMigration: PREMIUM_TAX_MIGRATION_METADATA,
        legacyPriceIds: legacy,
        exclusivePriceId: exclusive,
        latestAmountPaid: 500,
      })
    ).toBe(PRICE_CHANGE_SEGMENTS.B_MIGRAT_NEFACTURAT);

    expect(
      classifyPriceChangeSegment({
        priceId: exclusive,
        legacyPriceIds: legacy,
        exclusivePriceId: exclusive,
        latestAmountPaid: 605,
      })
    ).toBe(PRICE_CHANGE_SEGMENTS.C_DEJA_605);
  });

  it("keeps script classifier in sync for migrate guard reasons", () => {
    expect(
      classifyFromScript({
        priceId: "price_legacy",
        legacyPriceIds: ["price_legacy"],
        exclusivePriceId: "price_exclusive",
        latestAmountPaid: 500,
      })
    ).toBe("A_nemigrat");

    expect(
      hasValidPriceChangeConsentFromUserData({
        premiumPriceChangeConsent: {
          version: PREMIUM_PRICE_CHANGE_CONSENT_VERSION,
          status: "accepted",
          acceptedAt: { seconds: 1 },
        },
      })
    ).toBe(true);

    expect(
      hasValidPriceChangeConsentFromUserData({
        premiumPriceChangeConsent: { version: PREMIUM_PRICE_CHANGE_CONSENT_VERSION, status: "pending" },
      })
    ).toBe(false);
  });
});
