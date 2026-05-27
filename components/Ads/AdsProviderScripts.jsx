import { useEffect } from "react";
import GoogleAdSenseScript from "./GoogleAdSenseScript";
import CmpScriptLoader from "./CmpScriptLoader";
import useAdsRuntime from "../../hooks/useAdsRuntime";
import { AD_PROVIDERS } from "../../lib/ads/config";

export default function AdsProviderScripts() {
  const {
    adsEnv,
    activeProvider,
    canLoadScripts,
    hasConsent,
    consentResolved,
    pathname,
    routeEligible,
  } = useAdsRuntime();
  const shouldLogAdsDebug =
    process.env.NODE_ENV === "development" ||
    process.env.NEXT_PUBLIC_ADS_DEBUG === "true";

  useEffect(() => {
    if (!shouldLogAdsDebug) return;
    console.info("[ADS] runtime", {
      pathname,
      routeEligible,
      consentRequired: adsEnv.consentRequired,
      consentResolved,
      hasConsent,
      activeProvider,
      canLoadScripts,
    });
  }, [
    shouldLogAdsDebug,
    pathname,
    routeEligible,
    adsEnv.consentRequired,
    consentResolved,
    hasConsent,
    activeProvider,
    canLoadScripts,
  ]);

  const shouldLoadAdSenseScript =
    canLoadScripts &&
    adsEnv.enableAdSense &&
    Boolean(adsEnv.adSenseClientId) &&
    activeProvider === AD_PROVIDERS.ADSENSE &&
    (!adsEnv.consentRequired || (consentResolved && hasConsent));

  return (
    <>
      <CmpScriptLoader
        enabled={adsEnv.cmpEnabled}
        scriptSrc={adsEnv.cmpScriptSrc}
        siteId={adsEnv.cmpSiteId}
        provider={adsEnv.cmpProvider}
        cookiebotCbid={adsEnv.cmpCookiebotCbid}
        cookiebotBlockingMode={adsEnv.cmpCookiebotBlockingMode}
      />
      <GoogleAdSenseScript
        clientId={adsEnv.adSenseClientId}
        shouldLoad={shouldLoadAdSenseScript}
      />
    </>
  );
}
