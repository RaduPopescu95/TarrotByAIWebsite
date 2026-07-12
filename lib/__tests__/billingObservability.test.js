import {
  BILLING_ERROR_CODES,
  buildBillingRequestId,
  categorizeBillingError,
  getSafeBillingConfigSnapshot,
  logBillingObs,
  maskTransactionId,
  maskUid,
  redactBillingPayload,
} from "../billingObservability";

describe("billingObservability", () => {
  it("creates scoped request ids and masks correlation identifiers", () => {
    expect(buildBillingRequestId("rca")).toMatch(/^rca_[a-z0-9]+_[a-f0-9]{8}$/);
    expect(maskUid("firebase-user-123")).toBe("fir…123");
    expect(maskTransactionId("GPA.123456789")).toBe("…456789");
  });

  it("removes secrets and PII while retaining safe product diagnostics", () => {
    expect(
      redactBillingPayload({
        authorization: "Bearer secret",
        apiKey: "private-key",
        email: "person@example.com",
        uid: "firebase-user-123",
        transactionId: "GPA.123456789",
        productId: "analysis_astrogama_natala",
      })
    ).toEqual({
      uid: "fir…123",
      transactionId: "…456789",
      productId: "analysis_astrogama_natala",
    });
  });

  it("uses stable categories for common billing failures", () => {
    expect(categorizeBillingError({ statusCode: 401 })).toBe(BILLING_ERROR_CODES.AUTH_MISSING);
    expect(categorizeBillingError({ statusCode: 404 })).toBe(
      BILLING_ERROR_CODES.SUBSCRIBER_NOT_FOUND
    );
    expect(categorizeBillingError({ message: "Purchase is not yet verified by RevenueCat" })).toBe(
      BILLING_ERROR_CODES.PURCHASE_NOT_VERIFIED
    );
  });

  it("writes a single redacted structured log entry", () => {
    const spy = jest.spyOn(console, "info").mockImplementation(() => {});
    logBillingObs({
      scope: "test",
      stage: "processed",
      actor: { uid: "firebase-user-123", email: "person@example.com" },
      config: { hasRevenueCatApiKey: true, authorization: "secret" },
    });

    const [, raw] = spy.mock.calls[0];
    expect(raw).toContain('"hasRevenueCatApiKey":true');
    expect(raw).toContain("fir…123");
    expect(raw).not.toContain("person@example.com");
    expect(raw).not.toContain("secret");
    spy.mockRestore();
  });

  it("exposes only safe configuration state", () => {
    const originalApiKey = process.env.REVENUECAT_SECRET_API_KEY;
    const originalToken = process.env.REVENUECAT_WEBHOOK_AUTH_TOKEN;
    process.env.REVENUECAT_SECRET_API_KEY = "private-value";
    process.env.REVENUECAT_WEBHOOK_AUTH_TOKEN = "webhook-value";

    const snapshot = getSafeBillingConfigSnapshot({
      subscriptionSystemEnabled: true,
      androidBillingPremiumProvider: "revenuecat",
    });

    expect(snapshot).toEqual(
      expect.objectContaining({
        hasRevenueCatApiKey: true,
        hasRevenueCatWebhookToken: true,
      })
    );
    expect(JSON.stringify(snapshot)).not.toContain("private-value");
    expect(JSON.stringify(snapshot)).not.toContain("webhook-value");

    if (originalApiKey === undefined) delete process.env.REVENUECAT_SECRET_API_KEY;
    else process.env.REVENUECAT_SECRET_API_KEY = originalApiKey;
    if (originalToken === undefined) delete process.env.REVENUECAT_WEBHOOK_AUTH_TOKEN;
    else process.env.REVENUECAT_WEBHOOK_AUTH_TOKEN = originalToken;
  });
});
