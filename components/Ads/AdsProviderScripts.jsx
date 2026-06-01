import { useEffect } from "react";
import GoogleAdSenseScript from "./GoogleAdSenseScript";
import { useRouter } from "next/router";
import {
  isAdsenseRouteEligible,
  isAdsterraEnabled,
} from "../../lib/ads/config";
import { useAdsEngagement } from "./useAdsEngagement";

export default function AdsProviderScripts() {
  const router = useRouter();
  const pathname = router?.pathname || "/";
  const routeEligible = isAdsenseRouteEligible(pathname);
  const adsterraEnabled = isAdsterraEnabled();
  const adSenseClientId = process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_CLIENT_ID || "";
  const { shouldShowAds: engagementReady } = useAdsEngagement({
    routeCheck: isAdsenseRouteEligible,
  });

  const shouldLoadAdSenseScript =
    !adsterraEnabled &&
    engagementReady &&
    Boolean(adSenseClientId) &&
    routeEligible;

  const shouldLogAdsDebug = process.env.NODE_ENV === "development";

  useEffect(() => {
    if (!shouldLogAdsDebug) return;
    console.info("[ADS] provider", {
      pathname,
      adsterraEnabled,
      routeEligible,
      shouldLoadAdSenseScript,
      hasAdSenseClientId: Boolean(adSenseClientId),
    });
  }, [
    shouldLogAdsDebug,
    pathname,
    adsterraEnabled,
    routeEligible,
    shouldLoadAdSenseScript,
    adSenseClientId,
  ]);

  if (adsterraEnabled) {
    return null;
  }

  return (
    <GoogleAdSenseScript
      clientId={adSenseClientId}
      shouldLoad={shouldLoadAdSenseScript}
    />
  );
}
