import { isVideoPlayableForUser } from "../videoLibraryClientUtils";

describe("isVideoPlayableForUser", () => {
  it("allows premium videos for premium users even when canPlay is false", () => {
    const playable = isVideoPlayableForUser(
      {
        isPremium: true,
        canPlay: false,
        embedSrc: "https://player.example/embed/1",
      },
      {
        premium: true,
        subscriptionStatus: "active",
        currentPeriodEnd: new Date(Date.now() + 86400000).toISOString(),
      }
    );

    expect(playable).toBe(true);
  });

  it("blocks premium videos without premium access", () => {
    const playable = isVideoPlayableForUser(
      {
        isPremium: true,
        canPlay: false,
        embedSrc: "https://player.example/embed/1",
      },
      { premium: false }
    );

    expect(playable).toBe(false);
  });
});
