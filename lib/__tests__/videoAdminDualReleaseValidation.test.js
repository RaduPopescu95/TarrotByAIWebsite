import { Timestamp } from "firebase/firestore";
import { validateVideoInput } from "../../src/features/video-library-admin/utils/videoValidation";

const makeInput = (publishAt, publicReleaseAt) => ({
  title: "Video dual release",
  platform: "youtube",
  videoUrl: "https://youtu.be/abc123",
  locales: {
    ro: {
      title: "Video dual release",
      videoUrl: "https://youtu.be/abc123",
    },
  },
  isPublished: true,
  isPremium: true,
  publishAt: Timestamp.fromDate(publishAt),
  publicReleaseAt: Timestamp.fromDate(publicReleaseAt),
});

describe("video dual-release validation", () => {
  it("accepts public release after premium release", () => {
    const errors = validateVideoInput(
      makeInput(
        new Date("2026-06-10T10:00:00.000Z"),
        new Date("2026-06-10T15:00:00.000Z")
      )
    );
    expect(errors.publicReleaseAt).toBeUndefined();
  });

  it("rejects public release equal to or before premium release", () => {
    const errors = validateVideoInput(
      makeInput(
        new Date("2026-06-10T15:00:00.000Z"),
        new Date("2026-06-10T15:00:00.000Z")
      )
    );
    expect(errors.publicReleaseAt).toMatch(/trebuie să fie după/i);
  });

  it("requires the video to be published", () => {
    const input = makeInput(
      new Date("2026-06-10T10:00:00.000Z"),
      new Date("2026-06-10T15:00:00.000Z")
    );
    input.isPublished = false;
    const errors = validateVideoInput(input);
    expect(errors.publicReleaseAt).toMatch(/activează/i);
  });
});
