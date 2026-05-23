import GoogleAdSenseScript from "./GoogleAdSenseScript";
import MonetagScript from "./MonetagScript";
import AdsterraScript from "./AdsterraScript";
import useAdsRuntime from "../../hooks/useAdsRuntime";
import { AD_PROVIDERS } from "../../lib/ads/config";

export default function AdsProviderScripts() {
  const { adsEnv, canLoadScripts, hasConsent, consentResolved } =
    useAdsRuntime();

  if (adsEnv.consentRequired && !consentResolved) return null;
  if (adsEnv.consentRequired && !hasConsent) return null;

  return (
    <>
      <GoogleAdSenseScript
        clientId={adsEnv.adSenseClientId}
        shouldLoad={
          canLoadScripts &&
          adsEnv.enableAdSense &&
          Boolean(adsEnv.adSenseClientId) &&
          adsEnv.primaryProvider === AD_PROVIDERS.ADSENSE
        }
      />
      <MonetagScript
        scriptSrc={adsEnv.monetagScriptSrc}
        zoneId={adsEnv.monetagZoneId}
        shouldLoad={
          canLoadScripts &&
          adsEnv.enableMonetag &&
          Boolean(adsEnv.monetagScriptSrc) &&
          adsEnv.monetagFormat !== "onclick"
        }
      />
      <AdsterraScript
        scriptSrc={adsEnv.adsterraScriptSrc}
        shouldLoad={
          canLoadScripts &&
          adsEnv.enableAdsterra &&
          Boolean(adsEnv.adsterraScriptSrc)
        }
      />
    </>
  );
}
