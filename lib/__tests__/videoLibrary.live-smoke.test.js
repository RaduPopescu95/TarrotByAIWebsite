const live = process.env.RUN_LIVE_SMOKE === "1";

(live ? describe : describe.skip)("Next premium video API live smoke", () => {
  it("loads the public video library endpoint", async () => {
    const baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL;
    if (!baseUrl) {
      console.warn("Skipping live smoke: EXPO_PUBLIC_API_BASE_URL or NEXT_PUBLIC_SITE_URL is missing.");
      return;
    }

    const response = await fetch(
      `${baseUrl.replace(/\/+$/, "")}/api/premium/video-library?locale=ro`
    );
    expect(response.ok).toBe(true);
    const payload = await response.json();
    expect(Array.isArray(payload.videos)).toBe(true);
    expect(typeof payload.locale).toBe("string");
  });
});
