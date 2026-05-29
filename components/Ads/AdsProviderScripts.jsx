import { useEffect } from "react";
import GoogleAdSenseScript from "./GoogleAdSenseScript";
import { useRouter } from "next/router";
import { isAdsenseRouteEligible } from "../../lib/ads/config";

export default function AdsProviderScripts() {
  const router = useRouter();
  const pathname = router?.pathname || "/";
  const routeEligible = isAdsenseRouteEligible(pathname);
  const isProduction = process.env.NODE_ENV === "production";
  const adSenseClientId = process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_CLIENT_ID || "";
  const shouldLoadAdSenseScript =
    isProduction && Boolean(adSenseClientId) && routeEligible;
  const shouldLogAdsDebug = process.env.NODE_ENV === "development";

  useEffect(() => {
    if (!shouldLogAdsDebug) return;
    console.info("[ADS_MINIMAL] runtime", {
      pathname,
      routeEligible,
      isProduction,
      hasClientId: Boolean(adSenseClientId),
      shouldLoadAdSenseScript,
    });
  }, [
    shouldLogAdsDebug,
    pathname,
    routeEligible,
    isProduction,
    adSenseClientId,
    shouldLoadAdSenseScript,
  ]);

  return (
    <GoogleAdSenseScript
      clientId={adSenseClientId}
      shouldLoad={shouldLoadAdSenseScript}
    />
  );
}
