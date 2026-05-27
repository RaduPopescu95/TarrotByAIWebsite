import { useMemo } from "react";
import { useRouter } from "next/router";
import useAdsConsent from "./useAdsConsent";
import { getAdsEnv } from "../lib/ads/env";
import {
  isRouteEligibleForAds,
  isSlotEnabledForRoute,
  resolveActiveAdProvider,
} from "../lib/ads/orchestrator";
import { AD_PROVIDERS } from "../lib/ads/config";

export default function useAdsRuntime() {
  const router = useRouter();
  const pathname = router?.pathname || "/";
  const isProduction = process.env.NODE_ENV === "production";
  const adsEnv = useMemo(() => getAdsEnv(), []);
  const { hasConsent, resolved: consentResolved } = useAdsConsent(
    adsEnv.consentRequired,
    adsEnv.cmpEnabled && Boolean(adsEnv.cmpScriptSrc)
  );

  const routeEligible = isRouteEligibleForAds(pathname);
  const activeProvider = resolveActiveAdProvider(pathname, adsEnv);
  const canLoadScripts =
    isProduction &&
    adsEnv.adsEnabled &&
    routeEligible &&
    (!adsEnv.consentRequired || hasConsent);

  return {
    pathname,
    adsEnv,
    routeEligible,
    activeProvider,
    hasConsent,
    consentResolved,
    canLoadScripts,
    canShowSlots:
      canLoadScripts &&
      activeProvider === AD_PROVIDERS.ADSENSE,
    isSlotEnabled: (slotKey) => isSlotEnabledForRoute(pathname, slotKey),
  };
}
