import { useEffect, useState } from "react";
import GoogleAdSenseScript from "./GoogleAdSenseScript";
import { useRouter } from "next/router";
import { isAdsenseRouteEligible } from "../../lib/ads/config";

function isLikelyAutomationBrowser() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  if (navigator.webdriver) return true;
  return /(headlesschrome|phantomjs|selenium|playwright|puppeteer)/i.test(ua);
}

export default function AdsProviderScripts() {
  const router = useRouter();
  const pathname = router?.pathname || "/";
  const routeEligible = isAdsenseRouteEligible(pathname);
  const isProduction = process.env.NODE_ENV === "production";
  const adSenseClientId = process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_CLIENT_ID || "";
  const [delayPassed, setDelayPassed] = useState(false);
  const [tabVisible, setTabVisible] = useState(false);

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
    setDelayPassed(false);
    const timer = window.setTimeout(() => {
      setDelayPassed(true);
    }, 2500);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  const shouldLoadAdSenseScript =
    isProduction &&
    Boolean(adSenseClientId) &&
    routeEligible &&
    tabVisible &&
    delayPassed &&
    !isLikelyAutomationBrowser();
  const shouldLogAdsDebug = process.env.NODE_ENV === "development";

  useEffect(() => {
    if (!shouldLogAdsDebug) return;
    console.info("[ADS_MINIMAL] runtime", {
      pathname,
      routeEligible,
      isProduction,
      hasClientId: Boolean(adSenseClientId),
      tabVisible,
      delayPassed,
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
    delayPassed,
    shouldLoadAdSenseScript,
  ]);

  return (
    <GoogleAdSenseScript
      clientId={adSenseClientId}
      shouldLoad={shouldLoadAdSenseScript}
    />
  );
}
