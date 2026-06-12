import {
  applyUserTokenFilters,
  buildUserTokenBulkDeletePlan,
  classifyUserTokenModel,
  computeUserTokenStats,
  mapUserTokenDoc,
  normalizeUserTokenFilters,
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

  const allRows = [completeRow, missingNameRow, legacyRow];

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

  it("normalizes advanced filters", () => {
    expect(
      normalizeUserTokenFilters({
        cityIn: "București, Cluj-Napoca",
        cityNotIn: ["Iași", " Cluj-Napoca "],
        disabledOnly: "1",
        missingName: "true",
      })
    ).toEqual({
      search: "",
      city: "",
      cityIn: ["București", "Cluj-Napoca"],
      cityNotIn: ["Iași", "Cluj-Napoca"],
      modelFilter: "all",
      disabledOnly: true,
      missingName: true,
      missingCity: false,
    });
  });

  it("filters by search, city, model, and advanced flags", () => {
    expect(applyUserTokenFilters(allRows, { search: "andreea" }).map((r) => r.id)).toEqual([
      "tok_abc",
    ]);
    expect(applyUserTokenFilters(allRows, { city: "Cluj" }).map((r) => r.id)).toEqual([
      "tok_def",
    ]);
    expect(applyUserTokenFilters(allRows, { modelFilter: "legacy" }).map((r) => r.id)).toEqual([
      "tok_def",
      "tok_ghi",
    ]);
    expect(applyUserTokenFilters(allRows, { disabledOnly: true }).map((r) => r.id)).toEqual([
      "tok_ghi",
    ]);
    expect(applyUserTokenFilters(allRows, { missingName: true }).map((r) => r.id)).toEqual([
      "tok_def",
      "tok_ghi",
    ]);
    expect(applyUserTokenFilters(allRows, { missingCity: true }).map((r) => r.id)).toEqual([
      "tok_ghi",
    ]);
    expect(
      applyUserTokenFilters(allRows, { cityIn: ["București", "Cluj-Napoca"] }).map((r) => r.id)
    ).toEqual(["tok_abc", "tok_def"]);
    expect(applyUserTokenFilters(allRows, { cityNotIn: ["București"] }).map((r) => r.id)).toEqual([
      "tok_def",
      "tok_ghi",
    ]);
  });

  it("builds inverse delete plan from explicit keep selection", () => {
    const plan = buildUserTokenBulkDeletePlan(allRows, {
      mode: "delete_all_except_selected",
      selectedIds: ["tok_abc", "tok_missing"],
    });

    expect(plan.collectionCount).toBe(3);
    expect(plan.matchedCount).toBe(3);
    expect(plan.excludedCount).toBe(1);
    expect(plan.deleteCount).toBe(2);
    expect(plan.invalidSelectedCount).toBe(1);
    expect(plan.deletableRows.map((row) => row.id)).toEqual(["tok_def", "tok_ghi"]);
  });

  it("builds delete selected plan only for filtered selected ids", () => {
    const plan = buildUserTokenBulkDeletePlan(allRows, {
      mode: "delete_selected",
      selectedIds: ["tok_abc", "tok_ghi"],
      excludedIds: ["tok_ghi"],
    });

    expect(plan.excludedCount).toBe(1);
    expect(plan.deleteCount).toBe(1);
    expect(plan.deletableRows.map((row) => row.id)).toEqual(["tok_abc"]);
  });

  it("computes stats from scanned rows", () => {
    const stats = computeUserTokenStats(allRows);
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
