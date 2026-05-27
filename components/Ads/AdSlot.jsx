import { useEffect, useMemo, useRef } from "react";
import useAdsRuntime from "../../hooks/useAdsRuntime";
import { AD_PROVIDERS, AD_SLOT_KEYS } from "../../lib/ads/config";

const slotStyles = {
  wrapper: {
    width: "100%",
    overflow: "hidden",
  },
  adsense: {
    display: "block",
    minHeight: "120px",
  },
};

export default function AdSlot({ slotKey, className = "" }) {
  const adRef = useRef(null);
  const { adsEnv, activeProvider, canShowSlots, isSlotEnabled } = useAdsRuntime();

  const adSenseSlotId = useMemo(() => {
    if (slotKey === AD_SLOT_KEYS.AFTER_HERO) return adsEnv.adSenseSlotAfterHero;
    if (slotKey === AD_SLOT_KEYS.IN_FEED) return adsEnv.adSenseSlotInFeed;
    return "";
  }, [adsEnv.adSenseSlotAfterHero, adsEnv.adSenseSlotInFeed, slotKey]);

  useEffect(() => {
    if (
      activeProvider !== AD_PROVIDERS.ADSENSE ||
      !canShowSlots ||
      !adSenseSlotId ||
      !adRef.current
    ) {
      return;
    }

    if (adRef.current.dataset.adLoaded === "true") return;

    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      adRef.current.dataset.adLoaded = "true";
    } catch (error) {
      console.error("[AdSlot] adsbygoogle push failed", error?.message || error);
    }
  }, [activeProvider, adSenseSlotId, canShowSlots]);

  if (!slotKey || !canShowSlots || !isSlotEnabled(slotKey)) return null;

  if (activeProvider === AD_PROVIDERS.ADSENSE) {
    if (!adSenseSlotId || !adsEnv.adSenseClientId) return null;
    return (
      <div className={className} style={slotStyles.wrapper}>
        <ins
          ref={adRef}
          className="adsbygoogle"
          style={slotStyles.adsense}
          data-ad-client={adsEnv.adSenseClientId}
          data-ad-slot={adSenseSlotId}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      </div>
    );
  }

  return null;
}
