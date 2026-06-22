import {
  applyCoursePreviewAccessGate,
  applyCourseDetailContentGate,
  toSafeCourse,
  toSafeCourseForPublicCatalog,
} from "../courses";

describe("applyCoursePreviewAccessGate", () => {
  test("strips preview video metadata when caller lacks access", () => {
    const locked = applyCoursePreviewAccessGate(
      toSafeCourse("course-1", {
        title: "Paid course",
        price: 100,
        vimeoPreviewVideoId: "987654321",
        thumbnailUrl: "https://cdn.example/thumb.jpg",
      }),
      false
    );

    expect(locked.previewVimeoId).toBeNull();
    expect(locked.hasVimeoPreview).toBe(false);
    expect(locked.thumbnailUrl).toBe("https://cdn.example/thumb.jpg");
  });

  test("keeps preview metadata when caller has access", () => {
    const unlocked = applyCoursePreviewAccessGate(
      toSafeCourse("course-1", {
        title: "Paid course",
        price: 100,
        vimeoPreviewVideoId: "987654321",
      }),
      true
    );

    expect(unlocked.previewVimeoId).toBe("987654321");
    expect(unlocked.hasVimeoPreview).toBe(true);
  });
});

describe("applyCourseDetailContentGate", () => {
  test("strips paid content but keeps preview teaser for paid courses without access", () => {
    const locked = applyCourseDetailContentGate(
      toSafeCourse(
        "course-1",
        {
          title: "Paid course",
          price: 100,
          vimeoPreviewVideoId: "987654321",
          curriculumLessons: [{ id: "l1", title: "Lesson 1" }],
          notesContent: { ro: "Secret notes" },
          contactContent: { ro: "Secret contact" },
        },
        "ro",
        { includeDetailContent: true }
      ),
      false
    );

    // Teaser preview stays visible so the thumbnail renders.
    expect(locked.previewVimeoId).toBe("987654321");
    expect(locked.hasVimeoPreview).toBe(true);
    // Paid textual content is withheld until purchase.
    expect(locked.curriculumLessons).toEqual([]);
    expect(locked.notesContent).toBe("");
    expect(locked.contactContent).toBe("");
  });

  test("keeps free course detail content without purchase", () => {
    const free = applyCourseDetailContentGate(
      toSafeCourse(
        "free-1",
        {
          title: "Free course",
          price: 0,
          notesContent: "Free notes",
        },
        "ro",
        { includeDetailContent: true }
      ),
      false
    );

    expect(free.notesContent).toBe("Free notes");
  });
});

describe("toSafeCourseForPublicCatalog", () => {
  test("keeps preview teaser for paid courses so listing thumbnails render", () => {
    const paid = toSafeCourseForPublicCatalog("paid-1", {
      title: "Paid",
      price: 120,
      vimeoPreviewVideoId: "111222333",
      thumbnailUrl: "https://cdn.example/paid.jpg",
    });

    expect(paid.previewVimeoId).toBe("111222333");
    expect(paid.hasVimeoPreview).toBe(true);
    expect(paid.thumbnailUrl).toBe("https://cdn.example/paid.jpg");
  });

  test("keeps preview metadata for free courses in public list responses", () => {
    const free = toSafeCourseForPublicCatalog("free-1", {
      title: "Free",
      price: 0,
      vimeoPreviewVideoId: "444555666",
    });

    expect(free.previewVimeoId).toBe("444555666");
    expect(free.hasVimeoPreview).toBe(true);
  });
});
