import { useEffect, useRef, useState } from "react";
import GoogleAdSenseScript from "./GoogleAdSenseScript";
import { useRouter } from "next/router";
import { isAdsenseRouteEligible } from "../../lib/ads/config";

const MIN_ENGAGEMENT_MS = 5000;
const MAX_ADS_PAGES_PER_SESSION = 5;
const SESSION_ADS_PAGE_COUNT_KEY = "adsense:eligible-pages-count";

function isLikelyAutomationBrowser() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  if (navigator.webdriver) return true;
  return /(headlesschrome|phantomjs|selenium|playwright|puppeteer)/i.test(ua);
}

function readSessionAdsPageCount() {
  if (typeof window === "undefined") return 0;
  const raw = window.sessionStorage.getItem(SESSION_ADS_PAGE_COUNT_KEY);
  const parsed = Number.parseInt(String(raw || "0"), 10);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return parsed;
}

function writeSessionAdsPageCount(nextValue) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(
    SESSION_ADS_PAGE_COUNT_KEY,
    String(Math.max(0, nextValue))
  );
}

export default function AdsProviderScripts() {
  const router = useRouter();
  const pathname = router?.pathname || "/";
  const routeEligible = isAdsenseRouteEligible(pathname);
  const isProduction = process.env.NODE_ENV === "production";
  const adSenseClientId = process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_CLIENT_ID || "";
  const [engagementDelayPassed, setEngagementDelayPassed] = useState(false);
  const [hasInteraction, setHasInteraction] = useState(false);
  const [tabVisible, setTabVisible] = useState(false);
  const [sessionAdsPageCount, setSessionAdsPageCount] = useState(0);
  const countedPathRef = useRef("");

  useEffect(() => {
    if (typeof document === "undefined") return undefined;
    setTabVisible(document.visibilityState === "visible");

    const onVisibility = () => {
      setTabVisible(document.visibilityState === "visible");
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  useEffect(() => {
    setEngagementDelayPassed(false);
    const timer = window.setTimeout(() => {
      setEngagementDelayPassed(true);
    }, MIN_ENGAGEMENT_MS);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  useEffect(() => {
    setHasInteraction(false);
    if (typeof window === "undefined") return undefined;

    const markInteraction = () => {
      setHasInteraction(true);
    };

    const options = { passive: true };
    window.addEventListener("pointerdown", markInteraction, options);
    window.addEventListener("keydown", markInteraction);
    window.addEventListener("touchstart", markInteraction, options);
    window.addEventListener("scroll", markInteraction, options);

    return () => {
      window.removeEventListener("pointerdown", markInteraction);
      window.removeEventListener("keydown", markInteraction);
      window.removeEventListener("touchstart", markInteraction);
      window.removeEventListener("scroll", markInteraction);
    };
  }, [pathname]);

  useEffect(() => {
    countedPathRef.current = "";
    setSessionAdsPageCount(readSessionAdsPageCount());
  }, [pathname]);

  const sessionWithinCap = sessionAdsPageCount < MAX_ADS_PAGES_PER_SESSION;
  const shouldLoadAdSenseScript =
    isProduction &&
    Boolean(adSenseClientId) &&
    routeEligible &&
    tabVisible &&
    engagementDelayPassed &&
    hasInteraction &&
    sessionWithinCap &&
    !isLikelyAutomationBrowser();

  useEffect(() => {
    if (!shouldLoadAdSenseScript) return;
    if (countedPathRef.current === pathname) return;

    const currentCount = readSessionAdsPageCount();
    const nextCount = currentCount + 1;
    writeSessionAdsPageCount(nextCount);
    setSessionAdsPageCount(nextCount);
    countedPathRef.current = pathname;
  }, [shouldLoadAdSenseScript, pathname]);

  const shouldLogAdsDebug = process.env.NODE_ENV === "development";

  useEffect(() => {
    if (!shouldLogAdsDebug) return;
    console.info("[ADS_MINIMAL] runtime", {
      pathname,
      routeEligible,
      isProduction,
      hasClientId: Boolean(adSenseClientId),
      tabVisible,
      engagementDelayPassed,
      hasInteraction,
      sessionAdsPageCount,
      maxAdsPagesPerSession: MAX_ADS_PAGES_PER_SESSION,
      sessionWithinCap,
      shouldLoadAdSenseScript,
      automationBrowser: isLikelyAutomationBrowser(),
    });
  }, [
    shouldLogAdsDebug,
    pathname,
    routeEligible,
    isProduction,
    adSenseClientId,
    tabVisible,
    engagementDelayPassed,
    hasInteraction,
    sessionAdsPageCount,
    sessionWithinCap,
    shouldLoadAdSenseScript,
  ]);

  return (
    <GoogleAdSenseScript
      clientId={adSenseClientId}
      shouldLoad={shouldLoadAdSenseScript}
    />
  );
}
