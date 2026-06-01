import { createContext, useContext } from "react";
import { isAdsterraRouteEligible } from "../../lib/ads/config";
import { useAdsEngagement } from "./useAdsEngagement";

const AdsEngagementContext = createContext(null);

export function AdsEngagementProvider({ children }) {
  const engagement = useAdsEngagement({ routeCheck: isAdsterraRouteEligible });

  const value = {
    ...engagement,
    canShowAdsterra: engagement.shouldShowAds,
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
