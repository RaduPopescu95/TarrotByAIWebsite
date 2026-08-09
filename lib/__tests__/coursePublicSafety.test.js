import { toSafeCourse, toSafeCourseForPublicCatalog } from "../courses";

describe("public course media safety", () => {
  test("does not expose the full Vimeo source as a preview", () => {
    const course = toSafeCourse("course-1", {
      title: "Paid course",
      price: 100,
      vimeoId: "123456789",
      vimeoUrl: "https://vimeo.com/123456789",
    });

    expect(course.previewVimeoId).toBeNull();
    expect(course.hasVimeoPreview).toBe(false);
    expect(course).not.toHaveProperty("vimeoId");
    expect(course).not.toHaveProperty("vimeoUrl");
  });

  test("exposes only an explicitly configured preview video", () => {
    const course = toSafeCourse("course-1", {
      title: "Paid course",
      price: 100,
      vimeoId: "123456789",
      vimeoPreviewVideoId: "987654321",
    });

    expect(course.previewVimeoId).toBe("987654321");
    expect(course.hasVimeoPreview).toBe(true);
  });

  test("returns a VAT-inclusive price only for the public catalog", () => {
    const data = { title: "Paid course", price: 5, currency: "EUR" };

    expect(toSafeCourse("course-1", data).price).toBe(5);
    expect(toSafeCourseForPublicCatalog("course-1", data)).toMatchObject({
      price: 6.05,
      priceIncludesVat: true,
      vatPercentage: 21,
    });
  });
});
