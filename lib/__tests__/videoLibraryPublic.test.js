import {
  appendLibraryAutoplayParams,
  resolveLibraryEmbedSrc,
  resolveRowVideoSourceWithMeta,
  rowHasDirectValidEmbedForLocale,
  rowHasValidEmbedForLocale,
} from "../videoLibraryPublic";

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

describe("legacy mobile video source compatibility", () => {
  const row = {
    platform: "bunny",
    locales: {
      ro: { videoUrl: "123/11111111-1111-4111-8111-111111111111" },
    },
  };

  beforeEach(() => {
    process.env.NEXT_PUBLIC_BUNNY_STREAM_CDN_HOSTNAME = "cdn.example.com";
    process.env.NEXT_PUBLIC_BUNNY_STREAM_LIBRARY_ID = "123";
  });

  it("falls back to Romanian playback for a missing requested locale", () => {
    expect(resolveRowVideoSourceWithMeta(row, "en")).toEqual({
      source: "123/11111111-1111-4111-8111-111111111111",
      strategy: "ro_fallback",
      sourceLocale: "ro",
    });
    expect(rowHasValidEmbedForLocale(row, "en")).toBe(true);
  });

  it("does not advertise the fallback as a directly available locale", () => {
    expect(rowHasDirectValidEmbedForLocale(row, "ro")).toBe(true);
    expect(rowHasDirectValidEmbedForLocale(row, "en")).toBe(false);
  });

  it("prefers a denormalized root before another locale fallback", () => {
    expect(
      resolveRowVideoSourceWithMeta(
        {
          ...row,
          videoUrl: "123/22222222-2222-4222-8222-222222222222",
        },
        "en"
      )
    ).toEqual({
      source: "123/22222222-2222-4222-8222-222222222222",
      strategy: "root",
      sourceLocale: null,
    });
  });

  it("builds a legacy embed from a configured Bunny HLS URL", () => {
    expect(
      resolveLibraryEmbedSrc(
        "bunny",
        "https://cdn.example.com/44444444-4444-4444-8444-444444444444/playlist.m3u8"
      )
    ).toBe(
      "https://player.mediadelivery.net/embed/123/44444444-4444-4444-8444-444444444444"
    );
  });
});
