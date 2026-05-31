/**
 * Live smoke for /news UI data flow + /api/articles cost profile.
 *
 * Run:
 *   RUN_LIVE_SMOKE=1 NEXT_PUBLIC_SITE_URL=https://www.cristinazurba.com npm run test:smoke:live
 */

const live = process.env.RUN_LIVE_SMOKE === "1";

const BASE_URL = (process.env.NEXT_PUBLIC_SITE_URL || process.env.EXPO_PUBLIC_API_BASE_URL || "")
  .replace(/\/+$/, "");

const NEWS_CATEGORIES = [
  "Previziuni zilnice",
  "Previziuni săptămânale",
  "Previziuni lunare",
  "Previziuni anuale",
];

const FEATURED_LIMIT = 3;
const GRID_PAGE_SIZE = 6;
const CATEGORY_FIRST_FETCH = FEATURED_LIMIT + GRID_PAGE_SIZE;

const expectedReads = {
  ssrFeatured: { min: 2, max: 6, note: "manifest + chunks (materialized cache)" },
  ssrGridWithCursor: { min: 0, max: 1, note: "memory cache when warm after featured fetch" },
  categoryFirst: { min: 2, max: 6, note: "manifest + chunks (cached in memory 15m after first hit)" },
  categoryPage: { min: 0, max: 1, note: "memory cache only when warm" },
  paginationClick: { min: 0, max: 1, note: "memory cache only when warm" },
};

function assertArticleShape(article) {
  expect(article).toBeTruthy();
  expect(typeof article.documentId === "string" || typeof article.id === "string").toBe(true);
  expect(article.info?.ro?.nume || article.info?.[Object.keys(article.info || {})[0]]?.nume).toBeTruthy();
}

async function fetchArticles(params = {}) {
  const url = new URL(`${BASE_URL}/api/articles`);
  for (const [key, value] of Object.entries(params)) {
    if (value != null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }

  const response = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
  });
  const payload = await response.json().catch(() => ({}));

  return {
    ok: response.ok,
    status: response.status,
    headers: response.headers,
    payload,
    url: url.toString(),
  };
}

function uniqueIds(articles) {
  return new Set(
    (articles || []).map((row) => row.documentId || row.id).filter(Boolean)
  );
}

function logScenarioSummary(name, details) {
  console.info(`[news.live-smoke] ${name}`, details);
}

(live ? describe : describe.skip)("News page live smoke (/news + categories + pagination)", () => {
  jest.setTimeout(30000);

  beforeAll(() => {
    if (!BASE_URL) {
      throw new Error("Set NEXT_PUBLIC_SITE_URL or EXPO_PUBLIC_API_BASE_URL for live smoke.");
    }
  });

  it("loads /news HTML with featured, recent and all-articles sections", async () => {
    const response = await fetch(`${BASE_URL}/news`, {
      headers: { Accept: "text/html" },
    });
    expect(response.ok).toBe(true);
    const html = await response.text();

    expect(html).toMatch(/Blog|Articole|Blog &amp; Articole|Blog & Articole/i);
    expect(html).toMatch(/Cel mai recent articol|latestArticle/i);
    expect(html).toMatch(/Articole recente|recentArticles/i);
    expect(html).toMatch(/Toate articolele|allArticles/i);
    expect(html).toMatch(/Previziuni zilnice/i);

    logScenarioSummary("html", {
      hasPagination: /Pagina|page/i.test(html),
      hasEmptyGridFallback: /Explorează întreaga noastră colecție/i.test(html),
    });
  });

  it("simulates SSR featured + grid page 1 without overlapping articles", async () => {
    const featured = await fetchArticles({ locale: "ro", limit: FEATURED_LIMIT });
    expect(featured.ok).toBe(true);
    expect(Array.isArray(featured.payload.articles)).toBe(true);
    expect(featured.payload.articles.length).toBeGreaterThan(0);
    expect(featured.payload.articles.length).toBeLessThanOrEqual(FEATURED_LIMIT);
    featured.payload.articles.forEach((row) => assertArticleShape(row));

    const featuredIds = uniqueIds(featured.payload.articles);
    const grid = await fetchArticles({
      locale: "ro",
      limit: GRID_PAGE_SIZE,
      cursor: featured.payload.nextCursor || undefined,
    });
    expect(grid.ok).toBe(true);
    expect(grid.payload.articles.length).toBeGreaterThan(0);

    const gridIds = uniqueIds(grid.payload.articles);
    for (const id of gridIds) {
      expect(featuredIds.has(id)).toBe(false);
    }

    logScenarioSummary("ssr-all", {
      featuredCount: featured.payload.articles.length,
      gridCount: grid.payload.articles.length,
      gridNextCursor: grid.payload.nextCursor || null,
      expectedReadsFeatured: expectedReads.ssrFeatured,
      expectedReadsGrid: expectedReads.ssrGridWithCursor,
      cacheControl: grid.headers.get("cache-control"),
    });

    if (grid.payload.nextCursor) {
      const page2 = await fetchArticles({
        locale: "ro",
        limit: GRID_PAGE_SIZE,
        cursor: grid.payload.nextCursor,
      });
      expect(page2.ok).toBe(true);
      expect(Array.isArray(page2.payload.articles)).toBe(true);

      const page2Ids = uniqueIds(page2.payload.articles);
      for (const id of page2Ids) {
        expect(gridIds.has(id)).toBe(false);
      }

      logScenarioSummary("pagination-page-2", {
        count: page2.payload.articles.length,
        nextCursor: page2.payload.nextCursor || null,
      });
    }
  });

  it.each(NEWS_CATEGORIES)("category filter %s returns only matching articles", async (category) => {
    const first = await fetchArticles({
      locale: "ro",
      category,
      limit: CATEGORY_FIRST_FETCH,
    });
    expect(first.ok).toBe(true);
    expect(Array.isArray(first.payload.articles)).toBe(true);

    for (const row of first.payload.articles) {
      expect(row.categorie).toBe(category);
    }

    logScenarioSummary(`category:${category}`, {
      count: first.payload.articles.length,
      nextCursor: first.payload.nextCursor || null,
      expectedReads: expectedReads.categoryFirst,
    });

    if (first.payload.nextCursor) {
      const next = await fetchArticles({
        locale: "ro",
        category,
        limit: GRID_PAGE_SIZE,
        cursor: first.payload.nextCursor,
      });
      expect(next.ok).toBe(true);
      for (const row of next.payload.articles) {
        expect(row.categorie).toBe(category);
      }

      const firstIds = uniqueIds(first.payload.articles);
      const nextIds = uniqueIds(next.payload.articles);
      for (const id of nextIds) {
        expect(firstIds.has(id)).toBe(false);
      }

      logScenarioSummary(`category:${category}:page2`, {
        count: next.payload.articles.length,
        nextCursor: next.payload.nextCursor || null,
        expectedReads: expectedReads.categoryPage,
      });
    }
  });

  it("exposes HTTP cache headers on public articles API", async () => {
    const response = await fetchArticles({ locale: "ro", limit: 6 });
    expect(response.ok).toBe(true);

    const cacheControl = response.headers.get("cache-control") || "";
    expect(cacheControl).toMatch(/public/i);
    if (/s-maxage=/i.test(cacheControl)) {
      expect(cacheControl).toMatch(/s-maxage=\d+/i);
    }
    if (response.payload.cacheTtlSec != null) {
      expect(typeof response.payload.cacheTtlSec).toBe("number");
      expect(response.payload.cacheTtlSec).toBeGreaterThan(0);
    }
  });

  it("documents per-user read budget for a typical /news session", () => {
    const ssrReads = expectedReads.ssrFeatured.max + expectedReads.ssrGridWithCursor.max;
    const firstCategoryClick = expectedReads.categoryFirst.max;
    const warmCategoryClick = expectedReads.categoryPage.max;
    const nextPageClick = expectedReads.paginationClick.max;

    const typicalSession =
      ssrReads +
      firstCategoryClick +
      warmCategoryClick +
      nextPageClick;

    logScenarioSummary("read-budget-estimate", {
      ssrFirstPaintReads: `${expectedReads.ssrFeatured.min}-${ssrReads}`,
      firstCategoryFilterReads: `${expectedReads.categoryFirst.min}-${firstCategoryClick}`,
      warmCategoryFilterReads: `${expectedReads.categoryPage.min}-${warmCategoryClick}`,
      paginationClickReads: `${expectedReads.paginationClick.min}-${nextPageClick}`,
      typicalBrowseSessionReads: `${expectedReads.ssrFeatured.min + expectedReads.categoryFirst.min}-${typicalSession}`,
      note: "CDN/browser cache + 15m server memory cache reduce repeated hits; enable FIRESTORE_COST_LOGS=true on server for exact counts.",
    });

    expect(typicalSession).toBeLessThanOrEqual(15);
  });
});
