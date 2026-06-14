import { isVideoPlayableForUser, isVideoAppOnlyLocked } from "../videoLibraryClientUtils";

describe("isVideoPlayableForUser", () => {
  it("blocks app-only videos on web", () => {
    expect(
      isVideoPlayableForUser(
        {
          isPremium: false,
          canPlay: false,
          lockedReason: "app_only",
          embedSrc: null,
        },
        { premium: false }
      )
    ).toBe(false);
  });

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

describe("isVideoAppOnlyLocked", () => {
  it("detects app_only locked reason", () => {
    expect(isVideoAppOnlyLocked({ lockedReason: "app_only" })).toBe(true);
    expect(isVideoAppOnlyLocked({ lockedReason: "premium_required" })).toBe(false);
  });
});
