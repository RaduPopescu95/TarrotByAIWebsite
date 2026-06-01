import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import {
  getAdsterraPlacementConfig,
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
  const placement = useMemo(
    () => getAdsterraPlacementConfig(placementId),
    [placementId]
  );
  const { key, format, width, height } = placement;
  const { canShowAdsterra, routeEligible } = useAdsEngagementContext();

  const [slotClaimed, setSlotClaimed] = useState(false);

  const iframeSrcDoc = useMemo(
    () => (placement.host && key ? buildAdsterraIframeSrcDoc(placement) : ""),
    [placement, key]
  );

  const iframeMinHeight =
    format === "iframe" ? Math.max(60, Number(height) || 90) : 90;
  const iframeMaxHeight =
    format === "iframe" ? Math.max(iframeMinHeight, Number(height) || 320) : 320;

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
      data-adsterra-format={format}
    >
      <div
        className={`w-full overflow-hidden rounded-xl border border-gray-100/80 bg-gray-50/60 px-4 py-3 ${
          format === "iframe" && width >= 600 ? "max-w-4xl" : "max-w-3xl"
        }`}
      >
        <p className="sr-only">Publicitate</p>
        {showIframe ? (
          <iframe
            title="Publicitate"
            srcDoc={iframeSrcDoc}
            sandbox="allow-scripts allow-same-origin"
            className="adsterra-slot mx-auto block w-full border-0 bg-transparent"
            style={{ minHeight: iframeMinHeight, maxHeight: iframeMaxHeight }}
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
