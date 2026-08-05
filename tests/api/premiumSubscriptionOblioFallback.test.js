import { buildStripeInvoiceFallbackBilling } from "../../lib/premiumSubscriptionOblio";

describe("premium Oblio legacy Stripe invoice fallback", () => {
  it("builds an individual billing snapshot from complete Stripe invoice data", () => {
    expect(
      buildStripeInvoiceFallbackBilling({
        customer_name: "Ana Popescu",
        customer_email: "ana@example.test",
        customer_phone: "+40000000000",
        customer_address: {
          line1: "Strada Exemplu 1",
          city: "Bucuresti",
          state: "Bucuresti",
          postal_code: "010101",
          country: "RO",
        },
      })
    ).toMatchObject({
      billingType: "individual",
      firstName: "Ana",
      lastName: "Popescu",
      email: "ana@example.test",
      address: { country: "Romania", state: "Bucuresti" },
      invoicePreferences: { sendEmail: true, eInvoice: false },
    });
  });

  it("refuses incomplete Stripe invoice data", () => {
    expect(
      buildStripeInvoiceFallbackBilling({
        customer_name: "Ana Popescu",
        customer_email: "ana@example.test",
        customer_address: { country: "RO", postal_code: "010101" },
      })
    ).toBeNull();
    expect(
      buildStripeInvoiceFallbackBilling({
        customer_name: "Ana Popescu",
        customer_email: "ana@example.test",
        customer_address: {
          line1: "Strada Exemplu 1",
          city: "Bucuresti",
          state: "Bucuresti",
          postal_code: "010101",
        },
      })
    ).toBeNull();
  });
});
