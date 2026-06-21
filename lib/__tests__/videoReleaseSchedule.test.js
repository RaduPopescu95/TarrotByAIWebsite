import {
  buildVideoPublicReleaseDate,
  canViewerSeeVideo,
  getNextVideoTransitionAtMs,
  resolveVideoReleasePhase,
} from "../videoReleaseSchedule";

const ts = (ms) => ({ toMillis: () => ms });

describe("videoReleaseSchedule", () => {
  it("builds 18:00 Europe/Bucharest correctly in winter and summer", () => {
    expect(buildVideoPublicReleaseDate("2026-01-15").toISOString()).toBe(
      "2026-01-15T16:00:00.000Z"
    );
    expect(buildVideoPublicReleaseDate("2026-07-15").toISOString()).toBe(
      "2026-07-15T15:00:00.000Z"
    );
  });

  it("resolves scheduled, premium early access and public phases", () => {
    const now = Date.UTC(2026, 5, 10, 12);
    const video = {
      isPremium: true,
      publishAt: ts(now + 1_000),
      publicReleaseAt: ts(now + 10_000),
    };

    expect(resolveVideoReleasePhase(video, now).phase).toBe("scheduled");
    expect(
      resolveVideoReleasePhase(
        { ...video, publishAt: ts(now - 1_000) },
        now
      ).phase
    ).toBe("premium_early_access");
    expect(
      resolveVideoReleasePhase(
        {
          ...video,
          publishAt: ts(now - 10_000),
          publicReleaseAt: ts(now - 1_000),
        },
        now
      )
    ).toEqual(expect.objectContaining({ phase: "public", requiresPremium: false }));
  });

  it("hides dual-release early access from non-premium viewers", () => {
    const now = Date.UTC(2026, 5, 10, 12);
    const video = {
      isPremium: true,
      publishAt: ts(now - 1_000),
      publicReleaseAt: ts(now + 10_000),
    };

    expect(canViewerSeeVideo(video, false, now)).toBe(false);
    expect(canViewerSeeVideo(video, true, now)).toBe(true);
  });

  it("returns the next T1 or T2 transition", () => {
    const now = 1_000;
    expect(
      getNextVideoTransitionAtMs(
        [
          { publishAt: ts(5_000), publicReleaseAt: ts(9_000) },
          { publishAt: ts(500), publicReleaseAt: ts(3_000) },
        ],
        now
      )
    ).toBe(3_000);
  });
});
