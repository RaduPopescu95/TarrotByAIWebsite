import {
  applyUserTokenFilters,
  classifyUserTokenModel,
  computeUserTokenStats,
  mapUserTokenDoc,
} from "../userTokensDashboard";

describe("userTokensDashboard", () => {
  const completeRow = {
    id: "tok_abc",
    displayName: "Andreea",
    city: "București",
    email: "a@test.com",
    uid: "uid1",
    disabled: false,
    modelClass: "complete",
  };

  const missingNameRow = {
    id: "tok_def",
    displayName: "",
    city: "Cluj-Napoca",
    email: "b@test.com",
    uid: "uid2",
    disabled: false,
    modelClass: "missing_name",
  };

  const legacyRow = {
    id: "tok_ghi",
    displayName: "",
    city: "",
    email: "c@test.com",
    uid: "uid3",
    disabled: true,
    modelClass: "legacy",
  };

  it("classifies complete vs legacy models", () => {
    expect(classifyUserTokenModel({ displayName: "Ana", city: "Iași" })).toBe("complete");
    expect(classifyUserTokenModel({ displayName: "", city: "Iași" })).toBe("missing_name");
    expect(classifyUserTokenModel({ displayName: "Ana", city: "" })).toBe("missing_city");
    expect(classifyUserTokenModel({ displayName: "", city: "" })).toBe("legacy");
  });

  it("maps firestore doc snapshot shape", () => {
    const row = mapUserTokenDoc({
      id: "tok_xyz",
      data: () => ({
        displayName: " Maria ",
        city: "Timișoara",
        token: "ExponentPushToken[abcdefghijklmnop]",
        disabled: false,
        isIos: true,
        language: "ro",
      }),
    });
    expect(row.displayName).toBe("Maria");
    expect(row.city).toBe("Timișoara");
    expect(row.modelClass).toBe("complete");
    expect(row.tokenPreview).toContain("…");
  });

  it("filters by search, city, and model", () => {
    const rows = [completeRow, missingNameRow, legacyRow];
    expect(
      applyUserTokenFilters(rows, { search: "andreea" }).map((r) => r.id)
    ).toEqual(["tok_abc"]);
    expect(
      applyUserTokenFilters(rows, { city: "Cluj" }).map((r) => r.id)
    ).toEqual(["tok_def"]);
    expect(
      applyUserTokenFilters(rows, { modelFilter: "legacy" }).map((r) => r.id)
    ).toEqual(["tok_def", "tok_ghi"]);
    expect(
      applyUserTokenFilters(rows, { disabledOnly: true }).map((r) => r.id)
    ).toEqual(["tok_ghi"]);
  });

  it("computes stats from scanned rows", () => {
    const stats = computeUserTokenStats([completeRow, missingNameRow, legacyRow]);
    expect(stats).toEqual({
      scanned: 3,
      complete: 1,
      missingName: 2,
      missingCity: 1,
      legacy: 2,
      disabled: 1,
    });
  });
});
