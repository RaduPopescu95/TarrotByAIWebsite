import {
  buildPremiumDuplicateReport,
  listCurrentPremiumSubscriptions,
} from "../stripePremiumDuplicates";

function subscription({
  id,
  uid = "uid-1",
  customer = "cus-1",
  status = "active",
  flow = "site_premium",
  cancelAtPeriodEnd = false,
  created = 1_700_000_000,
} = {}) {
  return {
    id,
    status,
    customer,
    created,
    current_period_start: created,
    current_period_end: created + 2_592_000,
    cancel_at_period_end: cancelAtPeriodEnd,
    metadata: {
      flow,
      ...(uid ? { uid } : {}),
    },
    items: {
      data: [
        {
          quantity: 1,
          price: {
            id: "price-premium",
            product: "prod-premium",
            unit_amount: 500,
            currency: "eur",
            recurring: { interval: "month", interval_count: 1 },
          },
        },
      ],
    },
  };
}

describe("buildPremiumDuplicateReport", () => {
  const generatedAt = "2026-07-31T10:00:00.000Z";

  it("detects the same metadata uid across different Stripe customers", () => {
    const report = buildPremiumDuplicateReport(
      [
        subscription({ id: "sub-1", customer: "cus-1" }),
        subscription({ id: "sub-2", customer: "cus-2", created: 1_700_000_100 }),
      ],
      [{ uid: "uid-1", email: "same@test.com", stripeCustomerId: "cus-1" }],
      { generatedAt },
    );

    expect(report).toEqual(
      expect.objectContaining({
        totalUsers: 1,
        totalSubscriptions: 2,
        extraSubscriptions: 1,
        unresolvedCount: 0,
        generatedAt,
      }),
    );
    expect(report.groups[0].subscriptions.map((item) => item.customerId)).toEqual([
      "cus-1",
      "cus-2",
    ]);
  });

  it("falls back to a unique Firebase customer mapping when metadata uid is missing", () => {
    const report = buildPremiumDuplicateReport(
      [
        subscription({ id: "sub-1", uid: "", customer: "cus-shared" }),
        subscription({ id: "sub-2", uid: "", customer: "cus-shared" }),
      ],
      [{ uid: "uid-fallback", stripeCustomerId: "cus-shared" }],
      { generatedAt },
    );

    expect(report.totalUsers).toBe(1);
    expect(report.groups[0].uid).toBe("uid-fallback");
    expect(report.groups[0].subscriptions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ resolvedBy: "stripe_customer" }),
      ]),
    );
  });

  it("recognizes owner_uid as the canonical Firebase identity for legacy user documents", () => {
    const report = buildPremiumDuplicateReport(
      [
        subscription({ id: "sub-1", uid: "auth-uid", customer: "cus-old" }),
        subscription({ id: "sub-2", uid: "auth-uid", customer: "cus-new" }),
      ],
      [
        {
          id: "legacy-firestore-doc",
          owner_uid: "auth-uid",
          stripeCustomerId: "cus-new",
        },
      ],
      { generatedAt },
    );

    expect(report.totalUsers).toBe(1);
    expect(report.groups[0].uid).toBe("auth-uid");
  });

  it("does not group equal names or emails when the Firebase uids differ", () => {
    const report = buildPremiumDuplicateReport(
      [
        subscription({ id: "sub-1", uid: "uid-1", customer: "cus-1" }),
        subscription({ id: "sub-2", uid: "uid-2", customer: "cus-2" }),
      ],
      [
        { uid: "uid-1", email: "same@test.com", firstName: "Ana", stripeCustomerId: "cus-1" },
        { uid: "uid-2", email: "same@test.com", firstName: "Ana", stripeCustomerId: "cus-2" },
      ],
      { generatedAt },
    );

    expect(report.totalUsers).toBe(0);
    expect(report.totalSubscriptions).toBe(0);
  });

  it("excludes metadata/customer conflicts and counts them as unresolved", () => {
    const report = buildPremiumDuplicateReport(
      [
        subscription({ id: "sub-valid", uid: "uid-1", customer: "cus-1" }),
        subscription({ id: "sub-conflict", uid: "uid-1", customer: "cus-2" }),
      ],
      [
        { uid: "uid-1", stripeCustomerId: "cus-1" },
        { uid: "uid-2", stripeCustomerId: "cus-2" },
      ],
      { generatedAt },
    );

    expect(report.unresolvedCount).toBe(1);
    expect(report.totalUsers).toBe(0);
  });

  it("includes current statuses and scheduled cancellation, but excludes canceled and other flows", () => {
    const report = buildPremiumDuplicateReport(
      [
        subscription({ id: "sub-active", status: "active" }),
        subscription({ id: "sub-trial", status: "trialing", cancelAtPeriodEnd: true }),
        subscription({ id: "sub-due", status: "past_due" }),
        subscription({ id: "sub-canceled", status: "canceled" }),
        subscription({ id: "sub-course", flow: "course_purchase" }),
      ],
      [{ uid: "uid-1", stripeCustomerId: "cus-1" }],
      { generatedAt },
    );

    expect(report.groups[0].subscriptions.map((item) => item.id)).toEqual([
      "sub-active",
      "sub-trial",
      "sub-due",
    ]);
    expect(report.groups[0].subscriptions[1].cancelAtPeriodEnd).toBe(true);
  });

  it("deduplicates repeated Stripe subscription ids", () => {
    const repeated = subscription({ id: "sub-repeated" });
    const report = buildPremiumDuplicateReport(
      [repeated, repeated],
      [{ uid: "uid-1", stripeCustomerId: "cus-1" }],
      { generatedAt },
    );

    expect(report.totalUsers).toBe(0);
  });
});

describe("listCurrentPremiumSubscriptions", () => {
  it("paginates every current status and removes non-premium rows", async () => {
    const list = jest.fn(async (params) => {
      if (params.status === "active" && !params.starting_after) {
        return {
          data: [subscription({ id: "sub-page-1" })],
          has_more: true,
        };
      }
      if (params.status === "active" && params.starting_after === "sub-page-1") {
        return {
          data: [
            subscription({ id: "sub-page-2" }),
            subscription({ id: "sub-other", flow: "course_purchase" }),
          ],
          has_more: false,
        };
      }
      return { data: [], has_more: false };
    });

    const result = await listCurrentPremiumSubscriptions({ subscriptions: { list } });

    expect(result.map((item) => item.id)).toEqual(["sub-page-1", "sub-page-2"]);
    expect(list).toHaveBeenCalledWith({ status: "active", limit: 100 });
    expect(list).toHaveBeenCalledWith({
      status: "active",
      limit: 100,
      starting_after: "sub-page-1",
    });
    expect(list).toHaveBeenCalledWith({ status: "trialing", limit: 100 });
    expect(list).toHaveBeenCalledWith({ status: "past_due", limit: 100 });
  });
});
