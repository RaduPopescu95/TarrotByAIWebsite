import { Timestamp } from "firebase/firestore";
import {
  validateVideoInput,
  validateVideoPublicReleaseDraft,
} from "../../src/features/video-library-admin/utils/videoValidation";
import {
  VIDEO_ACCESS_MODE_DUAL,
  VIDEO_ACCESS_MODE_FREE,
  VIDEO_ACCESS_MODE_PREMIUM,
} from "../videoReleaseSchedule";

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

  it("requires both date and time for dual release", () => {
    expect(
      validateVideoPublicReleaseDraft({
        accessMode: VIDEO_ACCESS_MODE_DUAL,
        dateInput: "",
        timeInput: "18:00",
        publicReleaseAt: null,
      })
    ).toMatch(/data/i);
    expect(
      validateVideoPublicReleaseDraft({
        accessMode: VIDEO_ACCESS_MODE_DUAL,
        dateInput: "2026-07-15",
        timeInput: "",
        publicReleaseAt: null,
      })
    ).toMatch(/ora/i);
  });

  it("rejects an invalid Bucharest wall-clock time", () => {
    expect(
      validateVideoPublicReleaseDraft({
        accessMode: VIDEO_ACCESS_MODE_DUAL,
        dateInput: "2026-03-29",
        timeInput: "03:30",
        publicReleaseAt: null,
      })
    ).toMatch(/nu este validă/i);
  });

  it.each([VIDEO_ACCESS_MODE_FREE, VIDEO_ACCESS_MODE_PREMIUM])(
    "does not require publicReleaseAt for %s mode",
    (accessMode) => {
      expect(
        validateVideoPublicReleaseDraft({
          accessMode,
          dateInput: "",
          timeInput: "",
          publicReleaseAt: null,
        })
      ).toBeUndefined();
    }
  );
});
