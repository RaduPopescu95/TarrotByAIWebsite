import { appendLibraryAutoplayParams } from "../videoLibraryPublic";

describe("appendLibraryAutoplayParams", () => {
  it("adds autoplay params for youtube embeds", () => {
    const result = appendLibraryAutoplayParams(
      "https://www.youtube.com/embed/abc123",
      "youtube",
      "ro-RO"
    );

    expect(result).toContain("autoplay=1");
    expect(result).toContain("playsinline=1");
    expect(result).toContain("controls=1");
    expect(result).toContain("modestbranding=1");
    expect(result).toContain("rel=0");
    expect(result).toContain("hl=ro");
  });

  it("preserves existing vimeo origin while enabling autoplay", () => {
    const result = appendLibraryAutoplayParams(
      "https://player.vimeo.com/video/123456?origin=https%3A%2F%2Fwww.cristinazurba.com",
      "vimeo",
      "ro"
    );

    expect(result).toContain("origin=https%3A%2F%2Fwww.cristinazurba.com");
    expect(result).toContain("autoplay=1");
    expect(result).toContain("autopause=0");
  });

  it("adds autoplay flag for bunny embeds", () => {
    const result = appendLibraryAutoplayParams(
      "https://player.mediadelivery.net/embed/lib/video",
      "bunny",
      "ro"
    );

    expect(result).toContain("autoplay=1");
  });
});
