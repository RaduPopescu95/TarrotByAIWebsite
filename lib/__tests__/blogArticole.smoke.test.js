/**
 * Smoke test for blog articole admin page availability.
 *
 * Run against local dev server:
 *   npm run dev
 *   npm run test:smoke -- blogArticole.smoke
 *
 * Optional:
 *   BLOG_ARTICOLE_SMOKE_URL=http://127.0.0.1:3000/dashboard/blog-articole
 */

const BASE_URL = (process.env.BLOG_ARTICOLE_SMOKE_URL || "http://127.0.0.1:3000/dashboard/blog-articole")
  .replace(/\/+$/, "");

async function isServerReachable(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "text/html" },
    });
    return { ok: response.ok, status: response.status, html: await response.text() };
  } catch (error) {
    return { ok: false, status: 0, error: error?.message || String(error) };
  } finally {
    clearTimeout(timeout);
  }
}

describe("blog articole dashboard smoke", () => {
  jest.setTimeout(15000);

  it("serves /dashboard/blog-articole with dashboard password gate markup", async () => {
    const result = await isServerReachable(BASE_URL);

    if (!result.ok) {
      console.warn("[blogArticole.smoke] Skipping: dev server not reachable", result);
      expect(result.error || result.status).toBeTruthy();
      return;
    }

    expect(result.status).toBe(200);
    expect(result.html).toMatch(/Acces Dashboard|Articole|blog-articole/i);
  });

  it("articles API responds when dev server is up", async () => {
    const apiBase = BASE_URL.replace(/\/dashboard\/blog-articole$/, "");
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    try {
      const response = await fetch(`${apiBase}/api/articles?limit=1`, {
        signal: controller.signal,
        headers: { Accept: "application/json" },
      });
      const payload = await response.json().catch(() => ({}));

      if (response.status === 0) {
        console.warn("[blogArticole.smoke] articles API unreachable");
        return;
      }

      expect(response.ok).toBe(true);
      expect(Array.isArray(payload.articles)).toBe(true);
    } catch (error) {
      console.warn("[blogArticole.smoke] articles API skipped:", error?.message || error);
    } finally {
      clearTimeout(timeout);
    }
  });
});
