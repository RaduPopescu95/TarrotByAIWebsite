const { assessStripeCustomerTaxAddress } = require("../../lib/premiumTaxAddressGate");

describe("premium tax address gate", () => {
  it("accepts a complete Romanian Stripe billing address", () => {
    expect(
      assessStripeCustomerTaxAddress({
        address: {
          line1: "Strada Exemplu 1",
          city: "București",
          state: "București",
          postal_code: "010101",
          country: "RO",
        },
      })
    ).toEqual({ complete: true, reasons: [] });
  });

  it("keeps the gate active when Romanian fiscal location fields are missing", () => {
    expect(
      assessStripeCustomerTaxAddress({
        address: { line1: "Strada Exemplu 1", city: "București", country: "RO" },
      })
    ).toEqual({
      complete: false,
      reasons: expect.arrayContaining(["missing_postal_code", "missing_romanian_county"]),
    });
  });

  it("rejects an invalid Romanian postal code", () => {
    expect(
      assessStripeCustomerTaxAddress({
        address: {
          line1: "Strada Exemplu 1",
          city: "București",
          state: "București",
          postal_code: "1234",
          country: "RO",
        },
      }).reasons
    ).toContain("invalid_romanian_postal_code");
  });
});

