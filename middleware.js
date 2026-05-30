import { NextResponse } from "next/server";

const BLOCKED_UA_PATTERNS = [
  /curl/i,
  /wget/i,
  /python-requests/i,
  /httpclient/i,
  /scrapy/i,
  /headlesschrome/i,
  /phantomjs/i,
  /selenium/i,
  /playwright/i,
  /puppeteer/i,
];

const TRUSTED_CRAWLERS = [/googlebot/i, /bingbot/i, /duckduckbot/i, /yandexbot/i];
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 45;

function isTrustedCrawler(ua) {
  return TRUSTED_CRAWLERS.some((pattern) => pattern.test(ua));
}

function isBlockedAutomation(ua) {
  if (isTrustedCrawler(ua)) return false;
  return BLOCKED_UA_PATTERNS.some((pattern) => pattern.test(ua));
}

function getClientIp(req) {
  return (
    req.ip ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("cf-connecting-ip") ||
    "unknown"
  );
}

function applyBurstRateLimit(req) {
  const ip = getClientIp(req);
  const now = Date.now();
  const bucketKey = `${ip}:${Math.floor(now / RATE_LIMIT_WINDOW_MS)}`;

  if (!globalThis.__IVT_RATE_LIMIT__) {
    globalThis.__IVT_RATE_LIMIT__ = new Map();
  }

  const map = globalThis.__IVT_RATE_LIMIT__;
  const current = map.get(bucketKey) || 0;
  const next = current + 1;
  map.set(bucketKey, next);

  if (next > RATE_LIMIT_MAX) {
    return NextResponse.json(
      { error: "rate_limited" },
      {
        status: 429,
        headers: {
          "Cache-Control": "no-store",
          "Retry-After": "60",
          "X-IVT-Guard": "rate-limit",
        },
      }
    );
  }

  return null;
}

export function middleware(req) {
  const ua = req.headers.get("user-agent") || "";

  if (isBlockedAutomation(ua)) {
    return NextResponse.json(
      { error: "forbidden" },
      {
        status: 403,
        headers: {
          "Cache-Control": "no-store",
          "X-IVT-Guard": "ua-block",
        },
      }
    );
  }

  const limited = applyBurstRateLimit(req);
  if (limited) return limited;

  const res = NextResponse.next();
  res.headers.set("X-IVT-Guard", "pass");
  return res;
}

export const config = {
  matcher: ["/news/:path*", "/videouri/:path*"],
};

