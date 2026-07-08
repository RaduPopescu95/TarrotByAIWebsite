import {
  buildCourseLocaleCandidates,
  resolveCourseLocaleFields,
  resolveLocalizedCurriculumLessons,
  resolveCoursePlaybackSource,
  resolveCourseAvailableLocales,
  buildCourseMediaLocales,
  extractLocaleVimeoUrlsFromMedia,
  resolveCourseCategoryName,
  formatCoursePrice,
  sanitizeCurriculumLessons,
} from "../courses";

describe("buildCourseLocaleCandidates", () => {
  test("returns requested, ro, en without duplicates", () => {
    expect(buildCourseLocaleCandidates("fr")).toEqual(["fr", "ro", "en"]);
    expect(buildCourseLocaleCandidates("ro")).toEqual(["ro", "en"]);
    expect(buildCourseLocaleCandidates("en")).toEqual(["en", "ro"]);
  });
});

describe("resolveCourseLocaleFields", () => {
  test("prefers requested locale over ro", () => {
    const data = {
      title: "RO root",
      locales: {
        ro: { title: "Titlu RO", description: "Desc RO" },
        en: { title: "English title", description: "English desc" },
        fr: { title: "Titre FR", description: "Desc FR" },
      },
    };
    expect(resolveCourseLocaleFields(data, "fr").title).toBe("Titre FR");
    expect(resolveCourseLocaleFields(data, "fr").description).toBe("Desc FR");
  });

  test("falls back to en when requested and ro fields are missing", () => {
    const data = {
      title: "RO root",
      description: "RO root desc",
      locales: {
        en: { title: "English title", description: "English desc" },
      },
    };
    expect(resolveCourseLocaleFields(data, "de").title).toBe("English title");
    expect(resolveCourseLocaleFields(data, "de").description).toBe("English desc");
  });
});

describe("sanitizeCurriculumLessons", () => {
  test("does not expose isCompleted in sanitized lessons", () => {
    const lessons = sanitizeCurriculumLessons([
      { id: "l1", title: "Lesson 1", isCompleted: true, order: 0, summary: "A" },
    ]);
    expect(lessons).toEqual([
      expect.objectContaining({
        id: "l1",
        title: "Lesson 1",
        summary: "A",
        order: 0,
      }),
    ]);
    expect(lessons[0]).not.toHaveProperty("isCompleted");
  });
});

describe("resolveLocalizedCurriculumLessons", () => {
  test("localizes curriculum lesson by id", () => {
    const data = {
      curriculumLessons: [
        { id: "l1", title: "RO lesson", order: 0, summary: "" },
      ],
      locales: {
        en: {
          title: "English",
          curriculumLessons: [{ id: "l1", title: "EN lesson", summary: "EN summary" }],
        },
      },
    };
    const lessons = resolveLocalizedCurriculumLessons(data, "en");
    expect(lessons[0].title).toBe("EN lesson");
    expect(lessons[0].summary).toBe("EN summary");
  });
});

describe("resolveCoursePlaybackSource", () => {
  const courseData = { vimeoUrl: "https://vimeo.com/111111111" };
  const bunnyRoUrl =
    "https://player.mediadelivery.net/embed/lib123/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
  const bunnyEnUrl =
    "https://player.mediadelivery.net/embed/lib123/bbbbbbbb-bbbb-cccc-dddd-eeeeeeeeeeee";
  const youtubeUrl = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";

  test("uses locale-specific media when available", () => {
    const mediaData = {
      platform: "vimeo",
      vimeoUrl: "https://vimeo.com/222222222",
      locales: {
        en: { vimeoUrl: "https://vimeo.com/333333333", vimeoId: "333333333" },
      },
    };
    const result = resolveCoursePlaybackSource(mediaData, courseData, "en");
    expect(result.platform).toBe("vimeo");
    expect(result.vimeoId).toBe("333333333");
    expect(result.embedSrc).toBe("https://player.vimeo.com/video/333333333");
    expect(result.localeUsed).toBe("en");
  });

  test("falls back to ro root media", () => {
    const mediaData = {
      platform: "vimeo",
      vimeoUrl: "https://vimeo.com/222222222",
      vimeoId: "222222222",
    };
    const result = resolveCoursePlaybackSource(mediaData, courseData, "fr");
    expect(result.vimeoId).toBe("222222222");
    expect(result.embedSrc).toBe("https://player.vimeo.com/video/222222222");
    expect(result.source).toBe("courseMedia.root");
    expect(result.localeUsed).toBe("ro");
  });

  test("falls back to legacy course vimeoUrl via normalized root", () => {
    const result = resolveCoursePlaybackSource(null, courseData, "de");
    expect(result.vimeoId).toBe("111111111");
    expect(result.embedSrc).toBe("https://player.vimeo.com/video/111111111");
    expect(result.source).toBe("courseMedia.root");
  });

  test("resolves bunny platform with locale-specific urls", () => {
    const mediaData = {
      platform: "bunny",
      videoUrl: bunnyRoUrl,
      locales: {
        en: { videoUrl: bunnyEnUrl },
      },
    };
    const result = resolveCoursePlaybackSource(mediaData, {}, "en");
    expect(result.platform).toBe("bunny");
    expect(result.embedSrc).toBe(bunnyEnUrl);
    expect(result.vimeoId).toBeNull();
    expect(result.localeUsed).toBe("en");
  });

  test("resolves youtube platform from root videoUrl", () => {
    const mediaData = {
      platform: "youtube",
      videoUrl: youtubeUrl,
    };
    const result = resolveCoursePlaybackSource(mediaData, {}, "ro");
    expect(result.platform).toBe("youtube");
    expect(result.embedSrc).toContain("youtube.com/embed/dQw4w9WgXcQ");
    expect(result.vimeoId).toBeNull();
  });

  test("maps legacy vimeoUrl to videoUrl when platform missing", () => {
    const mediaData = {
      vimeoUrl: "https://vimeo.com/444444444",
    };
    const result = resolveCoursePlaybackSource(mediaData, {}, "ro");
    expect(result.platform).toBe("vimeo");
    expect(result.vimeoId).toBe("444444444");
  });
});

describe("buildCourseMediaLocales", () => {
  test("builds locale map with video urls", () => {
    const locales = buildCourseMediaLocales(
      {
        ro: "https://vimeo.com/100",
        en: "https://vimeo.com/200",
      },
      "https://vimeo.com/100",
      "vimeo"
    );
    expect(locales.ro.videoUrl).toBe("https://vimeo.com/100");
    expect(locales.en.videoUrl).toBe("https://vimeo.com/200");
  });
});

describe("extractLocaleVimeoUrlsFromMedia", () => {
  test("extracts root and per-locale urls", () => {
    const urls = extractLocaleVimeoUrlsFromMedia(
      {
        vimeoUrl: "https://vimeo.com/100",
        locales: { en: { vimeoUrl: "https://vimeo.com/200" } },
      },
      ""
    );
    expect(urls.ro).toBe("https://vimeo.com/100");
    expect(urls.en).toBe("https://vimeo.com/200");
  });

  test("prefers videoUrl over legacy vimeoUrl", () => {
    const urls = extractLocaleVimeoUrlsFromMedia(
      {
        videoUrl: "https://player.mediadelivery.net/embed/lib/vid",
        vimeoUrl: "https://vimeo.com/100",
      },
      ""
    );
    expect(urls.ro).toBe("https://player.mediadelivery.net/embed/lib/vid");
  });
});

describe("resolveCourseAvailableLocales", () => {
  test("returns ro only for single-locale course", () => {
    const locales = resolveCourseAvailableLocales(
      { title: "Curs RO", description: "Desc" },
      { platform: "vimeo", vimeoUrl: "https://vimeo.com/100" }
    );
    expect(locales).toEqual(["ro"]);
  });

  test("includes locales with localized title or playback", () => {
    const locales = resolveCourseAvailableLocales(
      {
        title: "Curs RO",
        locales: {
          en: { title: "English course" },
          fr: { title: "Cours FR" },
        },
      },
      {
        platform: "vimeo",
        videoUrl: "https://vimeo.com/100",
        locales: {
          en: { videoUrl: "https://vimeo.com/200" },
        },
      }
    );
    expect(locales).toContain("ro");
    expect(locales).toContain("en");
    expect(locales).toContain("fr");
  });

  test("supports legacy vimeo without platform field", () => {
    const locales = resolveCourseAvailableLocales(
      { title: "Legacy", vimeoUrl: "https://vimeo.com/111111111" },
      null
    );
    expect(locales).toEqual(["ro"]);
  });

  test("returns empty when course has no content", () => {
    expect(resolveCourseAvailableLocales({}, null)).toEqual([]);
  });
});

describe("resolveCourseCategoryName", () => {
  test("prefers localized ro name", () => {
    expect(
      resolveCourseCategoryName(
        { name: "Tarot", locales: { ro: "Tarot RO", en: "Tarot EN" } },
        "ro"
      )
    ).toBe("Tarot RO");
  });

  test("falls back to category.name", () => {
    expect(resolveCourseCategoryName({ name: "Astrologie" }, "en")).toBe("Astrologie");
  });
});

describe("formatCoursePrice", () => {
  test("formats RON with currency code", () => {
    expect(formatCoursePrice(15, "RON")).toMatch(/15.*RON/i);
  });

  test("formats EUR with euro symbol", () => {
    expect(formatCoursePrice(15, "EUR")).toMatch(/15.*€|EUR/i);
  });

  test("returns dash for invalid price", () => {
    expect(formatCoursePrice("15", "EUR")).toBe("—");
  });
});
