jest.mock("firebase-admin/firestore", () => ({
  FieldValue: {
    serverTimestamp: jest.fn(() => "server-timestamp"),
  },
}));

import {
  mapPublicVideoComment,
  validateVideoCommentText,
  VIDEO_COMMENT_MAX_LENGTH,
} from "../videoComments";

describe("videoComments", () => {
  it("normalizes whitespace and accepts plain text including HTML-looking content", () => {
    expect(validateVideoCommentText("  Bună   ziua \n tuturor  ")).toEqual({
      ok: true,
      text: "Bună ziua tuturor",
    });
    expect(validateVideoCommentText("<b>text</b>")).toEqual({
      ok: true,
      text: "<b>text</b>",
    });
  });

  it("rejects empty, one-character and oversized comments", () => {
    expect(validateVideoCommentText(" ")).toEqual(
      expect.objectContaining({ ok: false, status: 400 })
    );
    expect(validateVideoCommentText("a")).toEqual(
      expect.objectContaining({ ok: false, status: 400 })
    );
    expect(validateVideoCommentText("x".repeat(VIDEO_COMMENT_MAX_LENGTH + 1))).toEqual(
      expect.objectContaining({ ok: false, status: 400 })
    );
  });

  it("does not expose uid or email in the public DTO", () => {
    const result = mapPublicVideoComment(
      {
        id: "comment-1",
        data: () => ({
          videoId: "video-1",
          uid: "private-user",
          authorEmail: "private@example.com",
          authorFirstName: "Cristina",
          text: "Comentariu",
          createdAt: new Date("2026-06-19T10:00:00.000Z"),
        }),
      },
      "private-user"
    );
    expect(result).toEqual(
      expect.objectContaining({
        id: "comment-1",
        authorFirstName: "Cristina",
        text: "Comentariu",
        canDelete: true,
      })
    );
    expect(result).not.toHaveProperty("uid");
    expect(result).not.toHaveProperty("authorEmail");
  });
});

