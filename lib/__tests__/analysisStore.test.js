import {
  AnalysisStoreError,
  decodeAnalysisPayloadChunks,
  encodeAnalysisPayloadChunks,
  prepareAnalysisForWrite,
  resolveFamily,
  resolveRequestIdentity,
} from "../analysisStore";

describe("analysisStore identity and payload preparation", () => {
  it("prefers authenticated uid and normalizes guest contacts", () => {
    const identity = resolveRequestIdentity(
      {
        contact: {
          phone: "+40 721 234 567",
          email: " ANA@Example.COM ",
        },
      },
      { uid: "uid-1", email: "auth@example.com" }
    );

    expect(identity.ownerUid).toBe("uid-1");
    expect(identity.phoneNormalized).toBe("40721234567");
    expect(identity.emailLower).toBe("ana@example.com");
    expect(identity.emailLowerCandidates).toContain("auth@example.com");
  });

  it("resolves the four supported analysis families", () => {
    expect(resolveFamily("personal")).toBe("personal");
    expect(resolveFamily(null, { type: "othersAstrograma" })).toBe(
      "astrogramaOthers"
    );
    expect(resolveFamily(null, { type: "personalSinastry" })).toBe(
      "sinastrieOnePerson"
    );
    expect(resolveFamily(null, { person1: {}, person2: {} })).toBe(
      "sinastrieOthers"
    );
  });

  it("removes redundant base64 when an svg is present", () => {
    const identity = resolveRequestIdentity({
      phone: "+40721234567",
      email: "ana@example.com",
    });
    const result = prepareAnalysisForWrite(
      {
        id: "analysis-1",
        natalData: {
          data: {
            svg: "<svg />",
            base64_image: "very-large-value",
          },
        },
      },
      identity
    );

    expect(result.payload.originalId).toBe("analysis-1");
    expect(result.payload.phoneNormalized).toBe("40721234567");
    expect(result.payload.natalData.data.base64_image).toBeUndefined();
    expect(result.payload.natalData.data.svg).toBe("<svg />");
  });

  it("rejects payloads that cannot fit safely in one Firestore document", () => {
    const identity = resolveRequestIdentity({ email: "ana@example.com" });
    expect(() =>
      prepareAnalysisForWrite(
        {
          id: "large",
          report: "x".repeat(7.1 * 1024 * 1024),
        },
        identity
      )
    ).toThrow(AnalysisStoreError);
  });

  it("round-trips large unicode payloads through Firestore-safe chunks", () => {
    const payload = {
      id: "large-unicode",
      report: "compatibilitate și relație ✨ ".repeat(40000),
    };
    const chunks = encodeAnalysisPayloadChunks(payload);

    expect(chunks.length).toBeGreaterThan(1);
    expect(decodeAnalysisPayloadChunks(chunks)).toEqual(payload);
  });
});
