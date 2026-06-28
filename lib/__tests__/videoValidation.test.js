import {
  RO_VIDEO_URL_REQUIRED_MESSAGE,
  validateVideoInput,
} from "../../src/features/video-library-admin/utils/videoValidation";

const BUNNY_RO =
  "https://player.mediadelivery.net/play/651812/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
const BUNNY_EN =
  "https://player.mediadelivery.net/play/651812/bbbbbbbb-cccc-dddd-eeee-ffffffffffff";

const baseInput = (overrides = {}) => ({
  title: "Test video",
  platform: "bunny",
  isPublished: true,
  isPremium: false,
  videoUrl: "",
  locales: {},
  ...overrides,
});

describe("videoValidation — RO link required", () => {
  it("rejects when no video URL is provided anywhere", () => {
    const errors = validateVideoInput(baseInput());
    expect(errors.localeVideos?.ro).toBe(RO_VIDEO_URL_REQUIRED_MESSAGE);
    expect(errors.localizedVideo).toBe(RO_VIDEO_URL_REQUIRED_MESSAGE);
  });

  it("rejects when only a non-RO locale has a video URL", () => {
    const errors = validateVideoInput(
      baseInput({
        locales: {
          en: { title: "Test", videoUrl: BUNNY_EN },
        },
      })
    );
    expect(errors.localeVideos?.ro).toBe(RO_VIDEO_URL_REQUIRED_MESSAGE);
    expect(errors.localizedVideo).toBe(RO_VIDEO_URL_REQUIRED_MESSAGE);
  });

  it("accepts when RO has a valid Bunny URL", () => {
    const errors = validateVideoInput(
      baseInput({
        locales: {
          ro: { title: "Test", videoUrl: BUNNY_RO },
        },
      })
    );
    expect(errors.localeVideos?.ro).toBeUndefined();
    expect(errors.localizedVideo).toBeUndefined();
  });

  it("accepts legacy root videoUrl when no localized URLs exist", () => {
    const errors = validateVideoInput(
      baseInput({
        videoUrl: BUNNY_RO,
        locales: {
          ro: { title: "Test" },
        },
      })
    );
    expect(errors.localeVideos?.ro).toBeUndefined();
    expect(errors.localizedVideo).toBeUndefined();
  });

  it("rejects when RO has an invalid Bunny URL", () => {
    const errors = validateVideoInput(
      baseInput({
        locales: {
          ro: { title: "Test", videoUrl: "not-a-valid-bunny-url" },
        },
      })
    );
    expect(errors.localeVideos?.ro).toMatch(/bunny/i);
    expect(errors.localizedVideo).toMatch(/RO/i);
  });
});
