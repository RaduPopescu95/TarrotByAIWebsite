import {
  applyEntitlementsToAnalyses,
  applyLegacyEntitlementFallback,
  buildPhoneQueryCandidates,
  dedupAnalyses,
  getAnalysisCompletenessScore,
  mergeAnalysesByBestCompleteness,
  normalizeContactPhone,
  resolveAnalysisFamily,
} from "../recoverAnalyses";

describe("normalizeContactPhone", () => {
  it("strips non-digits and leading 00", () => {
    expect(normalizeContactPhone("+40 721 234 567")).toBe("40721234567");
    expect(normalizeContactPhone("0040721234567")).toBe("40721234567");
    expect(normalizeContactPhone("0721234567")).toBe("0721234567");
  });

  it("handles non-strings", () => {
    expect(normalizeContactPhone(undefined)).toBe("");
    expect(normalizeContactPhone(null)).toBe("");
  });
});

describe("buildPhoneQueryCandidates", () => {
  it("covers multiple plausible formats for a RO national number", () => {
    const candidates = buildPhoneQueryCandidates("0721234567");
    expect(candidates).toContain("0721234567");
    expect(candidates).toContain("40721234567");
    expect(candidates).toContain("+40721234567");
    expect(candidates).toContain("0040721234567");
    expect(candidates.length).toBeLessThanOrEqual(10);
  });

  it("returns empty for empty input", () => {
    expect(buildPhoneQueryCandidates("")).toEqual([]);
  });
});

describe("getAnalysisCompletenessScore", () => {
  it("scores richer analyses higher", () => {
    const poor = { natalData: { data: 1 } };
    const rich = {
      natalData: { data: 1 },
      aspectsData: { data: 1 },
      generalSignTextData: "x",
    };
    expect(getAnalysisCompletenessScore(rich)).toBeGreaterThan(
      getAnalysisCompletenessScore(poor)
    );
  });

  it("returns 0 for non-objects", () => {
    expect(getAnalysisCompletenessScore(null)).toBe(0);
    expect(getAnalysisCompletenessScore("nope")).toBe(0);
  });
});

describe("dedupAnalyses (cross-document)", () => {
  it("collapses two docs with same originalId into one, keeping richer content + OR isPaid", () => {
    const docs = [
      {
        id: "docA",
        originalId: "analysis-1",
        full_name: "Ana",
        natalData: { data: 1 },
        isPaid: false,
      },
      {
        id: "docB",
        originalId: "analysis-1",
        full_name: "Ana",
        natalData: { data: 1 },
        aspectsData: { data: 1 },
        generalSignTextData: "x",
        isPaid: true,
      },
    ];

    const result = dedupAnalyses(docs);
    expect(result).toHaveLength(1);
    expect(result[0].isPaid).toBe(true);
    expect(result[0].originalId).toBe("analysis-1");
    expect(result[0].aspectsData).toBeDefined();
  });

  it("keeps distinct analyses separate", () => {
    const docs = [
      { id: "d1", originalId: "a1", natalData: { data: 1 } },
      { id: "d2", originalId: "a2", natalData: { data: 1 } },
    ];
    expect(dedupAnalyses(docs)).toHaveLength(2);
  });

  it("falls back to content composite when no ids", () => {
    const docs = [
      { full_name: "Ion", day: 1, month: 2, year: 1990, natalData: { data: 1 } },
      {
        full_name: "Ion",
        day: 1,
        month: 2,
        year: 1990,
        natalData: { data: 1 },
        aspectsData: { data: 1 },
      },
    ];
    expect(dedupAnalyses(docs)).toHaveLength(1);
  });
});

describe("mergeAnalysesByBestCompleteness", () => {
  it("ORs isPaid across sources", () => {
    const a = [{ id: "x", originalId: "x", isPaid: true }];
    const b = [{ id: "x", originalId: "x", isPaid: false }];
    const merged = mergeAnalysesByBestCompleteness(a, b);
    expect(merged).toHaveLength(1);
    expect(merged[0].isPaid).toBe(true);
  });
});

describe("applyEntitlementsToAnalyses", () => {
  it("marks paid by analysisId match", () => {
    const analyses = [{ id: "analysis-1", isPaid: false }];
    const entitlements = [
      {
        status: "succeeded",
        transactionId: "tx_1",
        analysis: { analysisId: "analysis-1" },
      },
    ];
    const result = applyEntitlementsToAnalyses(analyses, entitlements);
    expect(result[0].isPaid).toBe(true);
    expect(result[0].entitlementTransactionId).toBe("tx_1");
  });

  it("marks paid by transactionId match when id changed", () => {
    const analyses = [
      { id: "new-id", entitlementTransactionId: "tx_9", isPaid: false },
    ];
    const entitlements = [{ status: "captured", transactionId: "tx_9" }];
    const result = applyEntitlementsToAnalyses(analyses, entitlements);
    expect(result[0].isPaid).toBe(true);
  });

  it("ignores non-entitled statuses", () => {
    const analyses = [{ id: "a1", isPaid: false }];
    const entitlements = [
      { status: "requires_payment_method", analysis: { analysisId: "a1" } },
    ];
    expect(applyEntitlementsToAnalyses(analyses, entitlements)[0].isPaid).toBe(
      false
    );
  });
});

describe("applyLegacyEntitlementFallback", () => {
  const productCode = "astrogama_natala";

  it("marks unpaid as paid when free payments cover all unpaid (regenerated id)", () => {
    const analyses = [{ id: "regenerated", isPaid: false }];
    const entitlements = [
      { status: "succeeded", productCode, transactionId: "tx_1" },
    ];
    const result = applyLegacyEntitlementFallback(analyses, entitlements, {
      productCode,
    });
    expect(result[0].isPaid).toBe(true);
    expect(result[0].entitlementMatchedBy).toBe("legacy_contact_product");
  });

  it("does nothing when ambiguous (fewer payments than unpaid)", () => {
    const analyses = [
      { id: "a", isPaid: false },
      { id: "b", isPaid: false },
    ];
    const entitlements = [
      { status: "succeeded", productCode, transactionId: "tx_1" },
    ];
    const result = applyLegacyEntitlementFallback(analyses, entitlements, {
      productCode,
    });
    expect(result.every((a) => a.isPaid === false)).toBe(true);
  });

  it("does not reuse a payment already consumed by a paid analysis", () => {
    const analyses = [
      { id: "paid", isPaid: true, entitlementTransactionId: "tx_1" },
      { id: "unpaid", isPaid: false },
    ];
    const entitlements = [
      { status: "succeeded", productCode, transactionId: "tx_1" },
    ];
    const result = applyLegacyEntitlementFallback(analyses, entitlements, {
      productCode,
    });
    const unpaid = result.find((a) => a.id === "unpaid");
    expect(unpaid.isPaid).toBe(false);
  });

  it("ignores entitlements of a different product", () => {
    const analyses = [{ id: "a", isPaid: false }];
    const entitlements = [
      { status: "succeeded", productCode: "other_product", transactionId: "tx" },
    ];
    expect(
      applyLegacyEntitlementFallback(analyses, entitlements, { productCode })[0]
        .isPaid
    ).toBe(false);
  });
});

describe("resolveAnalysisFamily (pipeline)", () => {
  it("dedups then marks paid via entitlement in one pass", () => {
    const docs = [
      { id: "docA", originalId: "a1", natalData: { data: 1 }, isPaid: false },
      {
        id: "docB",
        originalId: "a1",
        natalData: { data: 1 },
        aspectsData: { data: 1 },
        isPaid: false,
      },
    ];
    const entitlements = [
      {
        status: "succeeded",
        productCode: "astrogama_natala",
        transactionId: "tx_1",
        analysis: { analysisId: "a1" },
      },
    ];
    const result = resolveAnalysisFamily(docs, entitlements, {
      productCode: "astrogama_natala",
    });
    expect(result).toHaveLength(1);
    expect(result[0].isPaid).toBe(true);
  });
});
