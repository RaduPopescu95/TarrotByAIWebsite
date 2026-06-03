import {
  __resetConsentRateLimitsForTests,
  validateVideoPlaybackConsentBody,
} from "../videoPlaybackConsentServer";
import { VIDEO_PLAYBACK_TERMS_VERSION } from "../videoPlaybackConsentConstants";

describe("validateVideoPlaybackConsentBody", () => {
  beforeEach(() => {
    __resetConsentRateLimitsForTests();
  });

  const validBase = {
    action: "view",
    sessionId: "sess-abc-123",
    termsVersion: VIDEO_PLAYBACK_TERMS_VERSION,
    contentType: "library",
    contentId: "video-1",
    platform: "bunny",
    title: "Sample title",
    source: "web",
    locale: "ro",
  };

  it("rejects missing or invalid action", () => {
    expect(validateVideoPlaybackConsentBody({ ...validBase, action: "" }).ok).toBe(false);
    expect(validateVideoPlaybackConsentBody({ ...validBase, action: "play" }).ok).toBe(false);
  });

  it("requires sessionId and matching termsVersion", () => {
    expect(validateVideoPlaybackConsentBody({ ...validBase, sessionId: "" }).ok).toBe(false);
    expect(
      validateVideoPlaybackConsentBody({ ...validBase, termsVersion: "old" }).ok
    ).toBe(false);
    expect(validateVideoPlaybackConsentBody({ ...validBase, termsVersion: "" }).ok).toBe(
      false
    );
  });

  it("accepts valid accept and view payloads", () => {
    const view = validateVideoPlaybackConsentBody(validBase);
    expect(view.ok).toBe(true);
    if (view.ok) {
      expect(view.data.action).toBe("view");
      expect(view.data.termsVersion).toBe(VIDEO_PLAYBACK_TERMS_VERSION);
    }

    const accept = validateVideoPlaybackConsentBody({ ...validBase, action: "accept" });
    expect(accept.ok).toBe(true);
    if (accept.ok) {
      expect(accept.data.contentType).toBe("library");
      expect(accept.data.platform).toBe("bunny");
      expect(accept.data.source).toBe("web");
    }
  });

  it("rejects invalid contentType, platform, and source", () => {
    expect(
      validateVideoPlaybackConsentBody({ ...validBase, contentType: "episode" }).ok
    ).toBe(false);
    expect(
      validateVideoPlaybackConsentBody({ ...validBase, platform: "tiktok" }).ok
    ).toBe(false);
    expect(validateVideoPlaybackConsentBody({ ...validBase, source: "mobile" }).ok).toBe(
      false
    );
  });
});
