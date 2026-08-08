const {
  assessPreview,
  addressEmailExportCsv,
  renewalScheduleCsv,
  inferSubscriptionPlatform,
  daysUntilIso,
  renewalUrgencyBucket,
  buildPortalLoginUrl,
  buildStripeAddressFromPremiumProfile,
  discoverPremiumPrices,
  hasUsableInvoiceIdentity,
  hasUsableTaxAddress,
  subscriptionStructuralBlockers,
  validateStripeAddressCandidate,
  validateDestinationPrice,
} = require("../../scripts/migrate-premium-subscriptions-tax.cjs");

const destinationPrice = {
  active: true,
  currency: "eur",
  unit_amount: 500,
  tax_behavior: "exclusive",
  recurring: { interval: "month", interval_count: 1 },
};

describe("premium subscription VAT migration", () => {
  it("accepts the Romanian 5 EUR + 21% VAT preview", () => {
    expect(
      assessPreview(
        {
          subtotal: 500,
          total: 605,
          amount_due: 605,
          automatic_tax: { status: "complete" },
          total_tax_amounts: [{ amount: 105 }],
          total_discount_amounts: [],
          currency: "eur",
        },
        "RO",
        destinationPrice
      )
    ).toMatchObject({ ok: true, subtotal: 500, tax: 105, total: 605 });
  });

  it("blocks a Romanian preview that still has no VAT", () => {
    const result = assessPreview(
      {
        subtotal: 500,
        total: 500,
        amount_due: 500,
        automatic_tax: { status: "complete" },
        total_tax_amounts: [],
        total_discount_amounts: [],
        currency: "eur",
      },
      "RO",
      destinationPrice
    );
    expect(result.ok).toBe(false);
    expect(result.reasons).toContain("fixed_vat_total_must_be_605");
  });

  it("blocks a zero-tax foreign preview under the global fixed VAT policy", () => {
    expect(
      assessPreview(
        {
          subtotal: 500,
          total: 500,
          amount_due: 500,
          automatic_tax: { status: "complete" },
          total_tax_amounts: [],
          total_discount_amounts: [],
          currency: "eur",
        },
        "US",
        destinationPrice
      ).reasons
    ).toContain("fixed_vat_total_must_be_605");
  });

  it("requires a complete Romanian customer address", () => {
    expect(
      hasUsableTaxAddress({ address: { country: "RO", postal_code: "010101", line1: "Strada 1", city: "Bucuresti" } })
    ).toBe(true);
    expect(hasUsableTaxAddress({ address: { country: "RO", postal_code: "010101" } })).toBe(false);
  });

  it("requires name and email before using the Stripe invoice snapshot", () => {
    const customer = {
      name: "Ana Test",
      email: "ana@example.test",
      address: {
        country: "RO",
        postal_code: "010101",
        line1: "Strada 1",
        city: "Bucuresti",
        state: "Bucuresti",
      },
    };
    expect(hasUsableInvoiceIdentity(customer)).toBe(true);
    expect(hasUsableInvoiceIdentity({ ...customer, email: "" })).toBe(false);
  });

  it("builds a valid Romanian Stripe address from a complete Firestore billing profile", () => {
    expect(
      buildStripeAddressFromPremiumProfile({
        billing: {
          address: {
            line1: "Strada Exemplu 1",
            city: "Bucuresti",
            state: "Bucuresti",
            postalCode: "010101",
            country: "Romania",
          },
        },
      })
    ).toEqual({
      ok: true,
      address: {
        line1: "Strada Exemplu 1",
        city: "Bucuresti",
        state: "Bucuresti",
        postal_code: "010101",
        country: "RO",
      },
    });
  });

  it("refuses missing or placeholder postal codes during address repair", () => {
    const profile = {
      billing: {
        address: {
          line1: "Strada Exemplu 1",
          city: "Bucuresti",
          state: "Bucuresti",
          country: "RO",
        },
      },
    };
    expect(buildStripeAddressFromPremiumProfile(profile)).toMatchObject({
      ok: false,
      reasons: expect.arrayContaining(["firestore_address_missing_postal_code"]),
    });
    profile.billing.address.postalCode = "000000";
    expect(buildStripeAddressFromPremiumProfile(profile).ok).toBe(false);
  });

  it("accepts only complete payment-method billing addresses", () => {
    expect(
      validateStripeAddressCandidate({
        line1: "Strada Exemplu 1",
        city: "Bucuresti",
        state: "Bucuresti",
        postal_code: "010101",
        country: "RO",
      })
    ).toMatchObject({ ok: true, address: { postal_code: "010101", country: "RO" } });
    expect(
      validateStripeAddressCandidate({ city: "Bucuresti", state: "Bucuresti", country: "RO" })
    ).toMatchObject({
      ok: false,
      reasons: expect.arrayContaining(["payment_address_missing_line1", "payment_address_missing_postal_code"]),
    });
  });

  it("accepts only the exclusive monthly 5 EUR destination Price", () => {
    expect(validateDestinationPrice(destinationPrice).ok).toBe(true);
    expect(validateDestinationPrice({ ...destinationPrice, tax_behavior: "inclusive" }).ok).toBe(false);
  });

  it("blocks complex subscriptions from automatic migration", () => {
    const result = subscriptionStructuralBlockers(
      {
        status: "active",
        collection_method: "charge_automatically",
        items: {
          data: [
            { id: "si_old", quantity: 1, price: { id: "price_old" }, tax_rates: [] },
            { id: "si_extra", quantity: 1, price: { id: "price_extra" }, tax_rates: [] },
          ],
        },
        default_tax_rates: [],
      },
      ["price_old"]
    );
    expect(result.ok).toBe(false);
    expect(result.reasons).toContain("subscription_items_not_single_legacy_item");
  });

  it("discovers the old and exclusive monthly 5 EUR Prices without customer data", async () => {
    const asyncList = (values) => ({
      async *[Symbol.asyncIterator]() {
        yield* values;
      },
    });
    const stripe = {
      prices: {
        list: jest.fn().mockReturnValue(
          asyncList([
            { id: "price_old", active: true, currency: "eur", unit_amount: 500, tax_behavior: "inclusive", recurring: { interval: "month", interval_count: 1 }, product: { name: "Premium" } },
            { id: "price_new", active: true, currency: "eur", unit_amount: 500, tax_behavior: "exclusive", recurring: { interval: "month", interval_count: 1 }, product: { name: "Premium" } },
          ])
        ),
      },
      subscriptions: {
        list: jest
          .fn()
          .mockReturnValueOnce(asyncList([{ status: "active" }, { status: "active" }]))
          .mockReturnValueOnce(asyncList([])),
      },
    };

    await expect(discoverPremiumPrices(stripe)).resolves.toEqual([
      expect.objectContaining({ priceId: "price_old", subscriptions: 2, likelyRole: "legacy_candidate" }),
      expect.objectContaining({ priceId: "price_new", subscriptions: 0, likelyRole: "destination_new" }),
    ]);
  });

  it("builds an encoded Stripe portal link and a spreadsheet-safe CSV", () => {
    const portalUrl = buildPortalLoginUrl("ana+premium@example.test");
    expect(portalUrl).toContain("prefilled_email=ana%2Bpremium%40example.test");

    const csv = addressEmailExportCsv([
      {
        email: "ana@example.test",
        name: '=HYPERLINK("unsafe")',
        renewalAt: "2026-08-10T00:00:00.000Z",
        portalUrl,
      },
    ]);
    expect(csv).toContain("ana@example.test");
    expect(csv).toContain("'=HYPERLINK");
  });

  it("builds a renewal schedule CSV with urgency helpers", () => {
    expect(daysUntilIso("2026-08-10T00:00:00.000Z", Date.parse("2026-08-06T12:00:00.000Z"))).toBe(4);
    expect(renewalUrgencyBucket(0)).toBe("overdue_or_today");
    expect(renewalUrgencyBucket(7)).toBe("within_7_days");
    expect(renewalUrgencyBucket(10)).toBe("within_8_14_days");
    expect(renewalUrgencyBucket(20)).toBe("within_15_30_days");
    expect(renewalUrgencyBucket(40)).toBe("after_30_days");

    expect(inferSubscriptionPlatform({ metadata: { platform: "ios" } })).toEqual(
      expect.objectContaining({ platform: "ios", confidence: "high" })
    );
    expect(inferSubscriptionPlatform({ metadata: { flow: "premium" } }).platform).toBe(
      "unknown_likely_web_or_legacy"
    );

    const csv = renewalScheduleCsv([
      {
        email: "ana@example.test",
        name: "Ana",
        subscriptionId: "sub_123",
        status: "active",
        platform: "ios",
        platformConfidence: "high",
        renewalAt: "2026-08-10T00:00:00.000Z",
        daysUntilRenewal: 4,
        portalUrl: "https://example.test/portal",
      },
    ]);
    expect(csv).toContain("zile_ramase");
    expect(csv).toContain("sub_123");
    expect(csv).toContain("\"ios\"");
    expect(csv).toContain("\"4\"");
  });
});
