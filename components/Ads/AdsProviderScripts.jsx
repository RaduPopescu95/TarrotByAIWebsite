import GoogleAdSenseScript from "./GoogleAdSenseScript";
import MonetagScript from "./MonetagScript";
import AdsterraScript from "./AdsterraScript";
import useAdsRuntime from "../../hooks/useAdsRuntime";
import { AD_PROVIDERS } from "../../lib/ads/config";

export default function AdsProviderScripts() {
  const { adsEnv, activeProvider, canLoadScripts, hasConsent, consentResolved } =
    useAdsRuntime();

  if (adsEnv.consentRequired && !consentResolved) return null;
  if (adsEnv.consentRequired && !hasConsent) return null;

  return (
    <>
      <GoogleAdSenseScript
        clientId={adsEnv.adSenseClientId}
        shouldLoad={
          canLoadScripts && activeProvider === AD_PROVIDERS.ADSENSE
        }
      />
      <MonetagScript
        scriptSrc={adsEnv.monetagScriptSrc}
        zoneId={adsEnv.monetagZoneId}
        shouldLoad={
          canLoadScripts && activeProvider === AD_PROVIDERS.MONETAG
        }
      />
      <AdsterraScript
        scriptSrc={adsEnv.adsterraScriptSrc}
        shouldLoad={
          canLoadScripts && activeProvider === AD_PROVIDERS.ADSTERRA
        }
      />
    </>
  );
}
