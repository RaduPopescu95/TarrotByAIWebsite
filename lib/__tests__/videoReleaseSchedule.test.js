import {
  buildVideoPublicReleaseDate,
  canViewerSeeVideo,
  formatVideoPublicReleaseMoment,
  getVideoPublicReleaseInputs,
  getNextVideoTransitionAtMs,
  resolveVideoNotificationAt,
  resolveVideoReleasePhase,
  VIDEO_PUBLIC_RELEASE_DEFAULT_TIME,
} from "../videoReleaseSchedule";

const ts = (ms) => ({ toMillis: () => ms });

describe("videoReleaseSchedule", () => {
  it("builds arbitrary Europe/Bucharest times correctly in winter and summer", () => {
    expect(buildVideoPublicReleaseDate("2026-01-15", "09:37").toISOString()).toBe(
      "2026-01-15T07:37:00.000Z"
    );
    expect(buildVideoPublicReleaseDate("2026-07-15", "09:37").toISOString()).toBe(
      "2026-07-15T06:37:00.000Z"
    );
  });

  it("defaults new schedules to 18:00 with zero seconds", () => {
    expect(VIDEO_PUBLIC_RELEASE_DEFAULT_TIME).toBe("18:00");
    expect(buildVideoPublicReleaseDate("2026-07-15").toISOString()).toBe(
      "2026-07-15T15:00:00.000Z"
    );
  });

  it("extracts saved date and time without changing the timestamp", () => {
    const existing = ts(Date.parse("2026-07-15T06:37:00.000Z"));
    const inputs = getVideoPublicReleaseInputs(existing);

    expect(inputs).toEqual({ date: "2026-07-15", time: "09:37" });
    expect(buildVideoPublicReleaseDate(inputs.date, inputs.time).getTime()).toBe(
      existing.toMillis()
    );
    expect(formatVideoPublicReleaseMoment(existing)).toBe(
      "15.07.2026, 09:37 (Europe/Bucharest)"
    );
  });

  it("rejects nonexistent DST times and uses the first repeated occurrence", () => {
    expect(buildVideoPublicReleaseDate("2026-03-29", "03:30")).toBeNull();
    expect(buildVideoPublicReleaseDate("2026-10-25", "03:30").toISOString()).toBe(
      "2026-10-25T00:30:00.000Z"
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

  it("schedules notification at publishAt for normal videos", () => {
    const publishAt = ts(5_000);
    expect(resolveVideoNotificationAt({ publishAt })).toBe(publishAt);
  });

  it("schedules notification at publicReleaseAt for dual-release videos", () => {
    const publishAt = ts(5_000);
    const publicReleaseAt = ts(9_000);
    expect(
      resolveVideoNotificationAt({ publishAt, publicReleaseAt, isPremium: true })
    ).toBe(publicReleaseAt);
  });
});
