import {
  buildSessionAcceptedStorageKey,
  resolveLibraryPlatform,
} from "../videoPlaybackConsent";
import { VIDEO_PLAYBACK_TERMS_VERSION } from "../videoPlaybackConsentConstants";

describe("buildSessionAcceptedStorageKey", () => {
  it("includes terms version and session id", () => {
    const key = buildSessionAcceptedStorageKey("sess-1", VIDEO_PLAYBACK_TERMS_VERSION);
    expect(key).toBe(`videoConsentAccepted:${VIDEO_PLAYBACK_TERMS_VERSION}:sess-1`);
  });
});

describe("resolveLibraryPlatform", () => {
  it("normalizes known platforms and defaults to youtube", () => {
    expect(resolveLibraryPlatform({ platform: "bunny" })).toBe("bunny");
    expect(resolveLibraryPlatform({ platform: "vimeo" })).toBe("vimeo");
    expect(resolveLibraryPlatform({ platform: "unknown" })).toBe("youtube");
  });
});
