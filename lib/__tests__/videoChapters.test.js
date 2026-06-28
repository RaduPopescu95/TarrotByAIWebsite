import {
  formatChapterTime,
  normalizeVideoChapters,
  parseChapterTime,
  validateVideoChapters,
} from "../videoChapters";

describe("videoChapters", () => {
  it("parses and formats mm:ss and hh:mm:ss timestamps", () => {
    expect(parseChapterTime("02:05")).toBe(125);
    expect(parseChapterTime("1:02:03")).toBe(3723);
    expect(parseChapterTime("1:99")).toBeNull();
    expect(formatChapterTime(125)).toBe("2:05");
    expect(formatChapterTime(3723)).toBe("1:02:03");
  });

  it("normalizes valid chapters, sorts them and keeps locale titles", () => {
    expect(
      normalizeVideoChapters(
        [
          {
            startSeconds: 90,
            title: "Second",
            locales: { ro: { title: "Al doilea" }, en: { title: "Second" } },
          },
          { startSeconds: 10, endSeconds: 80, locales: { ro: { title: "Primul" } } },
          { startSeconds: -1, title: "Invalid" },
          { startSeconds: 100, endSeconds: 95, title: "Invalid end" },
          { startSeconds: 120, title: "" },
        ],
        { locale: "ro", includeLocales: true }
      )
    ).toEqual([
      {
        startSeconds: 10,
        endSeconds: 80,
        title: "Primul",
        locales: { ro: { title: "Primul" } },
      },
      {
        startSeconds: 90,
        endSeconds: null,
        title: "Al doilea",
        locales: { ro: { title: "Al doilea" }, en: { title: "Second" } },
      },
    ]);
  });

  it("rejects invalid chapter inputs during validation", () => {
    expect(validateVideoChapters([{ startSeconds: "x", title: "A" }])).toMatch(
      /timp de început valid/
    );
    expect(validateVideoChapters([{ startSeconds: 30, endSeconds: 20, title: "A" }])).toMatch(
      /după timpul de început/
    );
    expect(validateVideoChapters([{ startSeconds: 30, title: "" }])).toMatch(
      /titlu/
    );
    expect(validateVideoChapters([{ startSeconds: 30, locales: { ro: { title: "RO" } } }])).toBeNull();
  });
});
