import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import {
  getAdsterraPlacementKey,
  getAdsterraScriptHost,
  isAdsterraEnabled,
  isAdsterraRouteEligible,
} from "../../lib/ads/config";
import {
  claimAdsterraSlot,
  resetAdsterraPageRegistry,
} from "../../lib/ads/adsterraRegistry";
import { useAdsEngagementContext } from "./AdsEngagementContext";
import { buildAdsterraIframeSrcDoc } from "./adsterraIframe";

export default function AdPlacementShell({
  placementId = "default",
  className = "",
}) {
  const router = useRouter();
  const pathname = router?.pathname || "/";
  const enabled = isAdsterraEnabled();
  const host = getAdsterraScriptHost();
  const key = getAdsterraPlacementKey(placementId);
  const { canShowAdsterra, routeEligible } = useAdsEngagementContext();

  const [slotClaimed, setSlotClaimed] = useState(false);

  const iframeSrcDoc = useMemo(
    () => (host && key ? buildAdsterraIframeSrcDoc(host, key) : ""),
    [host, key]
  );

  useEffect(() => {
    resetAdsterraPageRegistry();
    setSlotClaimed(false);
  }, [pathname]);

  useEffect(() => {
    if (!enabled || !key) return;
    const claim = claimAdsterraSlot(key);
    setSlotClaimed(claim.ok);
  }, [enabled, key, pathname]);

  const showIframe =
    enabled &&
    routeEligible &&
    isAdsterraRouteEligible(pathname) &&
    canShowAdsterra &&
    slotClaimed &&
    Boolean(iframeSrcDoc);

  const showDevPlaceholder =
    process.env.NODE_ENV === "development" &&
    enabled &&
    routeEligible &&
    slotClaimed;

  if (!enabled || !isAdsterraRouteEligible(pathname) || !slotClaimed) {
    return null;
  }

  if (!showIframe && !showDevPlaceholder) {
    return null;
  }

  return (
    <aside
      className={`my-8 flex w-full justify-center px-4 ${className}`.trim()}
      aria-label="Publicitate"
      data-adsterra-placement={placementId}
    >
      <div className="w-full max-w-3xl overflow-hidden rounded-xl border border-gray-100/80 bg-gray-50/60 px-4 py-3">
        <p className="sr-only">Publicitate</p>
        {showIframe ? (
          <iframe
            title="Publicitate"
            srcDoc={iframeSrcDoc}
            sandbox="allow-scripts allow-same-origin"
            className="adsterra-native-banner mx-auto block w-full border-0 bg-transparent"
            style={{ minHeight: 90, maxHeight: 320 }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        ) : (
          <div
            className="adsterra-native-banner min-h-[90px] w-full rounded-lg border border-dashed border-gray-200 bg-gray-50/50"
            aria-hidden
          />
        )}
      </div>
    </aside>
  );
}
