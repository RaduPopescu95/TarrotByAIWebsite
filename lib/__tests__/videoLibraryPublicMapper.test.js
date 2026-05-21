import {
  collectAndSortPublishedVideos,
  mapVideoRowToPublicDto,
} from "../videoLibraryPublicMapper";

const ts = (ms) => ({ toMillis: () => ms });

describe("videoLibraryPublicMapper", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_BUNNY_STREAM_CDN_HOSTNAME = "cdn.example.com";
  });

  it("blocks premium playback for non-premium users but keeps public embed", () => {
    const row = {
      id: "v1",
      title: "Premium",
      description: "Premium video",
      platform: "youtube",
      videoUrl: "https://youtu.be/abc123",
      isPremium: true,
      createdAt: ts(Date.UTC(2026, 4, 3)),
    };

    const dto = mapVideoRowToPublicDto(row, {
      locale: "ro",
      premiumActive: false,
    });

    expect(dto).toEqual(
      expect.objectContaining({
        id: "v1",
        canPlay: false,
        isPremium: true,
        lockedReason: "premium_required",
        embedSrc: "https://www.youtube.com/embed/abc123",
        videoUrl: "https://youtu.be/abc123",
      })
    );
  });

  it("uses localized metadata and localized video URL when available", () => {
    const dto = mapVideoRowToPublicDto(
      {
        id: "v2",
        title: "Root title",
        description: "Root description",
        platform: "bunny",
        videoUrl: "123/11111111-1111-4111-8111-111111111111",
        locales: {
          ro: {
            title: "Titlu RO",
            description: "Descriere RO",
            videoUrl: "123/22222222-2222-4222-8222-222222222222",
          },
        },
      },
      { locale: "ro", premiumActive: true }
    );

    expect(dto).toEqual(
      expect.objectContaining({
        title: "Titlu RO",
        description: "Descriere RO",
        platform: "bunny",
        canPlay: true,
        videoUrl: "123/22222222-2222-4222-8222-222222222222",
        embedSrc:
          "https://player.mediadelivery.net/embed/123/22222222-2222-4222-8222-222222222222",
        thumbnailUrl:
          "https://cdn.example.com/22222222-2222-4222-8222-222222222222/thumbnail.jpg",
        locales: {
          ro: {
            title: "Titlu RO",
            description: "Descriere RO",
            videoUrl: "123/22222222-2222-4222-8222-222222222222",
          },
        },
      })
    );
  });

  it("collects only published and currently visible videos newest first", () => {
    const now = Date.UTC(2026, 4, 20);
    const docs = [
      { id: "draft", data: () => ({ isPublished: false, createdAt: ts(now + 1) }) },
      { id: "future", data: () => ({ isPublished: true, publishAt: ts(now + 10_000), createdAt: ts(now + 2) }) },
      { id: "old", data: () => ({ isPublished: true, createdAt: ts(now - 10) }) },
      { id: "new", data: () => ({ isPublished: true, createdAt: ts(now) }) },
      { id: "_meta", data: () => ({ isPublished: true, createdAt: ts(now + 10) }) },
    ];
    const snapshot = {
      forEach: (callback) => docs.forEach(callback),
    };

    expect(collectAndSortPublishedVideos(snapshot, now).map((row) => row.id)).toEqual([
      "new",
      "old",
    ]);
  });
});
