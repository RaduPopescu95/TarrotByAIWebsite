import { mapVideoRowToPublicDto } from "../videoLibraryPublicMapper";

describe("Next video library mock smoke", () => {
  it("maps a public row into an Expo/Web consumable DTO", () => {
    const dto = mapVideoRowToPublicDto(
      {
        id: "v1",
        title: "Smoke",
        description: "Smoke description",
        platform: "youtube",
        videoUrl: "https://youtu.be/abc123",
        isPremium: false,
        isPublished: true,
      },
      { locale: "ro", premiumActive: false }
    );

    expect(dto).toEqual(
      expect.objectContaining({
        id: "v1",
        title: "Smoke",
        canPlay: true,
        embedSrc: "https://www.youtube.com/embed/abc123",
      })
    );
  });
});
