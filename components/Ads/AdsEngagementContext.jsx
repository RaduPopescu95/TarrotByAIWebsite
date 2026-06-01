import { createContext, useContext } from "react";
import { isAdsterraRouteEligible } from "../../lib/ads/config";
import { useAdsEngagement } from "./useAdsEngagement";
import { useAdsConsent } from "./useAdsConsent";

const AdsEngagementContext = createContext(null);

export function AdsEngagementProvider({ children }) {
  const engagement = useAdsEngagement({ routeCheck: isAdsterraRouteEligible });
  const consent = useAdsConsent();

  const value = {
    ...engagement,
    ...consent,
    canShowAdsterra:
      engagement.shouldShowAds && consent.hasConsent,
  };

  return (
    <AdsEngagementContext.Provider value={value}>
      {children}
    </AdsEngagementContext.Provider>
  );
}

export function useAdsEngagementContext() {
  const ctx = useContext(AdsEngagementContext);
  if (!ctx) {
    throw new Error("useAdsEngagementContext must be used within AdsEngagementProvider");
  }
  return ctx;
}
