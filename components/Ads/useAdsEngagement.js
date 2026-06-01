import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { isAdsterraRouteEligible } from "../../lib/ads/config";

/** Minimum time on page before Adsterra loads (ms). */
export const MIN_ADSTERRA_PAGE_MS = 4000;

/**
 * Minimal gate for Adsterra: production + allowlisted route + 4s on page.
 * No interaction, consent, viewport, or session page cap.
 */
export function useAdsEngagement({ routeCheck = isAdsterraRouteEligible } = {}) {
  const router = useRouter();
  const pathname = router?.pathname || "/";
  const routeEligible = routeCheck(pathname);
  const isProduction = process.env.NODE_ENV === "production";

  const [pageDelayPassed, setPageDelayPassed] = useState(false);

  useEffect(() => {
    setPageDelayPassed(false);
    const timer = window.setTimeout(() => {
      setPageDelayPassed(true);
    }, MIN_ADSTERRA_PAGE_MS);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  const shouldShowAds = isProduction && routeEligible && pageDelayPassed;

  return {
    pathname,
    routeEligible,
    shouldShowAds,
    isProduction,
    pageDelayPassed,
  };
}
