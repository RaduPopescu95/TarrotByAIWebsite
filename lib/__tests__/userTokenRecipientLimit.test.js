import {
  matchUserTokenRecipient,
  normalizeRecipientLimitCriteria,
  normalizeRecipientMatchText,
} from "../userTokenRecipientLimit";

describe("userTokenRecipientLimit", () => {
  const criteria = {
    cities: ["Iași", "Târgoviște"],
    names: ["Cristina", "Tarot Soare și Lună"],
  };

  it("normalizes diacritics, case, and whitespace", () => {
    expect(normalizeRecipientMatchText("  TÂRGOVIȘTE ")).toBe("targoviste");
    expect(normalizeRecipientMatchText("Tarot   Soare și Lună")).toBe("tarot soare si luna");
  });

  it("uses exact city matching", () => {
    expect(matchUserTokenRecipient({ city: "IASI" }, criteria).matches).toBe(true);
    expect(matchUserTokenRecipient({ city: "Iași-Nord" }, criteria).matches).toBe(false);
  });

  it("uses contains matching for names and OR between fields", () => {
    expect(matchUserTokenRecipient({ displayName: "Cristina Zurba" }, criteria).reasons).toEqual([
      "name",
    ]);
    expect(matchUserTokenRecipient({ city: "Targoviste" }, criteria).reasons).toEqual(["city"]);
  });

  it("keeps explicitly empty lists", () => {
    expect(normalizeRecipientLimitCriteria({ cities: [], names: ["Cristina"] })).toEqual({
      cities: [],
      names: ["Cristina"],
    });
  });
});
