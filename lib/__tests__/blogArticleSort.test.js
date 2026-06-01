import {
  getBlogArticleSortMs,
  mergeBlogArticlesDesc,
  sortBlogArticlesDesc,
} from "../blogArticleSort";

describe("blogArticleSort", () => {
  it("sorts newest JavaScript Date timestamps first", () => {
    const older = {
      documentId: "old",
      firstUploadTimestamp: new Date("2026-01-01T08:00:00.000Z"),
      scheduledAtTs: new Date("2026-01-01T08:00:00.000Z"),
    };
    const newer = {
      documentId: "new",
      firstUploadTimestamp: new Date("2026-06-01T08:00:00.000Z"),
      scheduledAtTs: new Date("2026-06-01T08:00:00.000Z"),
    };

    expect(getBlogArticleSortMs(newer)).toBeGreaterThan(getBlogArticleSortMs(older));
    expect(sortBlogArticlesDesc([older, newer]).map((item) => item.documentId)).toEqual([
      "new",
      "old",
    ]);
  });

  it("keeps a freshly created article at the top after merge", () => {
    const existing = [
      {
        documentId: "existing",
        scheduledAtTs: new Date("2026-05-01T08:00:00.000Z"),
      },
    ];
    const created = {
      documentId: "created-now",
      scheduledAtTs: new Date("2026-06-01T12:00:00.000Z"),
      firstUploadDate: "01-06-2026",
      firstUploadtime: "12:00",
    };

    expect(
      mergeBlogArticlesDesc(existing, [created]).map((item) => item.documentId)
    ).toEqual(["created-now", "existing"]);
  });

  it("parent list without deleted item should not reintroduce removed rows", () => {
    const parentAfterDelete = [
      { documentId: "keep-1", scheduledAtTs: new Date("2026-06-01T08:00:00.000Z") },
    ];

    expect(sortBlogArticlesDesc(parentAfterDelete).map((item) => item.documentId)).toEqual([
      "keep-1",
    ]);
  });
});
