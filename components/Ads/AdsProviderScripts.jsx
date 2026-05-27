import GoogleAdSenseScript from "./GoogleAdSenseScript";
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
          canLoadScripts &&
          adsEnv.enableAdSense &&
          Boolean(adsEnv.adSenseClientId) &&
          activeProvider === AD_PROVIDERS.ADSENSE
        }
      />
    </>
  );
}
