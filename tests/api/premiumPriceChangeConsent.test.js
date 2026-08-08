const {
  PREMIUM_PRICE_CHANGE_CONSENT_VERSION,
  PREMIUM_PRICE_CHANGE_SITE_NOTICE_VERSION,
  PREMIUM_TAX_MIGRATION_METADATA,
  PRICE_CHANGE_SEGMENTS,
  buildConsentRecord,
  buildPriceChangeSiteNoticeRecord,
  classifyPriceChangeSegment,
  hasAcknowledgedPriceChangeSiteNotice,
  hasValidPriceChangeConsent,
  isEligibleForScheduleCancelUnaccepted,
  isEligibleForRefundDeclined605,
  shouldShowPremiumPriceChangeSiteNotice,
} = require("../../lib/premiumPriceChangeConsent");

const {
  classifyPriceChangeSegment: classifyFromScript,
  hasValidPriceChangeConsentFromUserData,
  isEligibleForScheduleCancelUnaccepted: scheduleCancelFromScript,
  isEligibleForRefundDeclined605: refundFromScript,
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
    expect(String(record.consentText || "")).toMatch(/oprește|opreste/i);
  });

  it("classifies A/B/C segments from price + invoice amount", () => {
    const legacy = ["price_legacy"];
    const exclusive = "price_exclusive";

    expect(
      classifyPriceChangeSegment({
        priceId: "price_legacy",
        taxMigration: PREMIUM_TAX_MIGRATION_METADATA,
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

  it("allows schedule-cancel only for unaccepted A/C renewing subs", () => {
    expect(
      isEligibleForScheduleCancelUnaccepted({
        status: "active",
        cancelAtPeriodEnd: false,
        hasConsent: false,
        segment: PRICE_CHANGE_SEGMENTS.A_NEMIGRAT,
      }).ok
    ).toBe(true);

    expect(
      isEligibleForScheduleCancelUnaccepted({
        status: "active",
        cancelAtPeriodEnd: false,
        hasConsent: false,
        segment: PRICE_CHANGE_SEGMENTS.C_DEJA_605,
      }).ok
    ).toBe(true);

    expect(
      isEligibleForScheduleCancelUnaccepted({
        status: "active",
        cancelAtPeriodEnd: false,
        hasConsent: true,
        segment: PRICE_CHANGE_SEGMENTS.A_NEMIGRAT,
      })
    ).toEqual({ ok: false, reason: "has_consent" });

    expect(
      isEligibleForScheduleCancelUnaccepted({
        status: "active",
        cancelAtPeriodEnd: true,
        hasConsent: false,
        segment: PRICE_CHANGE_SEGMENTS.A_NEMIGRAT,
      })
    ).toEqual({ ok: false, reason: "already_cancel_at_period_end" });

    expect(
      isEligibleForScheduleCancelUnaccepted({
        status: "active",
        cancelAtPeriodEnd: false,
        hasConsent: false,
        segment: PRICE_CHANGE_SEGMENTS.B_MIGRAT_NEFACTURAT,
      })
    ).toEqual({ ok: false, reason: "segment_not_ac" });
  });

  it("allows refund-declined only for unaccepted 605 with cancel scheduled or canceled", () => {
    expect(
      isEligibleForRefundDeclined605({
        status: "active",
        cancelAtPeriodEnd: true,
        hasConsent: false,
        latestAmountPaid: 605,
        amountRefunded: 0,
      }).ok
    ).toBe(true);

    expect(
      isEligibleForRefundDeclined605({
        status: "canceled",
        cancelAtPeriodEnd: false,
        hasConsent: false,
        latestAmountPaid: 605,
        amountRefunded: 0,
      }).ok
    ).toBe(true);

    expect(
      isEligibleForRefundDeclined605({
        status: "active",
        cancelAtPeriodEnd: false,
        hasConsent: false,
        latestAmountPaid: 605,
        amountRefunded: 0,
      })
    ).toEqual({ ok: false, reason: "not_canceled_or_scheduled" });

    expect(
      isEligibleForRefundDeclined605({
        status: "active",
        cancelAtPeriodEnd: true,
        hasConsent: true,
        latestAmountPaid: 605,
        amountRefunded: 0,
      })
    ).toEqual({ ok: false, reason: "has_consent" });

    expect(
      isEligibleForRefundDeclined605({
        status: "active",
        cancelAtPeriodEnd: true,
        hasConsent: false,
        latestAmountPaid: 605,
        amountRefunded: 605,
      })
    ).toEqual({ ok: false, reason: "already_refunded" });
  });

  it("shows site notice for forced consent / migration / scheduled cancel", () => {
    expect(shouldShowPremiumPriceChangeSiteNotice({})).toBe(false);
    expect(
      shouldShowPremiumPriceChangeSiteNotice({
        stripeSubscriptionId: "sub_1",
        subscriptionStatus: "active",
        premium: true,
      })
    ).toBe(false);

    expect(
      shouldShowPremiumPriceChangeSiteNotice({
        stripeSubscriptionId: "sub_1",
        subscriptionStatus: "active",
        premiumPriceChangeConsent: {
          version: PREMIUM_PRICE_CHANGE_CONSENT_VERSION,
          status: "accepted",
          source: "forced_ops_v1",
          acceptedAt: "2026-08-07T12:00:00.000Z",
        },
      })
    ).toBe(true);

    expect(
      shouldShowPremiumPriceChangeSiteNotice({
        stripeSubscriptionId: "sub_1",
        subscriptionStatus: "active",
        premiumTaxAddressGate: { migrationCompleted: true },
      })
    ).toBe(true);

    expect(
      shouldShowPremiumPriceChangeSiteNotice({
        stripeSubscriptionId: "sub_1",
        subscriptionStatus: "cancel_at_period_end",
      })
    ).toBe(true);

    expect(
      shouldShowPremiumPriceChangeSiteNotice({
        stripeSubscriptionId: "sub_1",
        subscriptionStatus: "active",
        premiumPriceChangeConsent: {
          version: PREMIUM_PRICE_CHANGE_CONSENT_VERSION,
          status: "accepted",
          acceptedAt: "2026-08-07T12:00:00.000Z",
        },
        premiumPriceChangeNotice: {
          version: PREMIUM_PRICE_CHANGE_SITE_NOTICE_VERSION,
          acknowledgedAt: "2026-08-08T10:00:00.000Z",
          source: "site_banner",
        },
      })
    ).toBe(false);

    expect(
      shouldShowPremiumPriceChangeSiteNotice({
        stripeSubscriptionId: "sub_1",
        subscriptionStatus: "active",
        premiumTaxAddressGate: { required: true, migrationCompleted: true },
      })
    ).toBe(false);

    expect(
      shouldShowPremiumPriceChangeSiteNotice({
        stripeSubscriptionId: "sub_1",
        subscriptionStatus: "canceled",
        premiumPriceChangeConsent: {
          version: PREMIUM_PRICE_CHANGE_CONSENT_VERSION,
          status: "accepted",
          acceptedAt: "2026-08-07T12:00:00.000Z",
        },
      })
    ).toBe(false);

    expect(
      hasAcknowledgedPriceChangeSiteNotice({
        premiumPriceChangeNotice: {
          version: PREMIUM_PRICE_CHANGE_SITE_NOTICE_VERSION,
          acknowledgedAt: "2026-08-08T10:00:00.000Z",
        },
      })
    ).toBe(true);

    expect(
      buildPriceChangeSiteNoticeRecord({
        source: "accept_page",
        serverTimestamp: "2026-08-08T10:00:00.000Z",
      })
    ).toEqual({
      version: PREMIUM_PRICE_CHANGE_SITE_NOTICE_VERSION,
      acknowledgedAt: "2026-08-08T10:00:00.000Z",
      source: "accept_page",
    });
  });

  it("keeps script helpers in sync", () => {
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
      scheduleCancelFromScript({
        status: "active",
        cancelAtPeriodEnd: false,
        hasConsent: false,
        segment: "A_nemigrat",
      }).ok
    ).toBe(true);

    expect(
      refundFromScript({
        status: "canceled",
        cancelAtPeriodEnd: false,
        hasConsent: false,
        latestAmountPaid: 605,
        amountRefunded: 0,
      }).ok
    ).toBe(true);
  });
});
