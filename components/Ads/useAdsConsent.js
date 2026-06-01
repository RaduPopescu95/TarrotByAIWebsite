import { useEffect, useState } from "react";
import { isAdsConsentRequired } from "../../lib/ads/config";

function readMarketingConsent() {
  if (typeof window === "undefined") return false;
  const cookiebot = window.Cookiebot?.consent;
  if (cookiebot && typeof cookiebot.marketing === "boolean") {
    return cookiebot.marketing;
  }
  return false;
}

/**
 * When NEXT_PUBLIC_ADS_CONSENT_REQUIRED=true, ads load only after Cookiebot marketing consent.
 */
export function useAdsConsent() {
  const consentRequired = isAdsConsentRequired();
  const [hasConsent, setHasConsent] = useState(() =>
    consentRequired ? false : true
  );

  useEffect(() => {
    if (!consentRequired) {
      setHasConsent(true);
      return undefined;
    }

    const sync = () => {
      setHasConsent(readMarketingConsent());
    };

    sync();

    window.addEventListener("CookiebotOnAccept", sync);
    window.addEventListener("CookiebotOnDecline", sync);
    window.addEventListener("CookiebotOnDialogDisplay", sync);

    return () => {
      window.removeEventListener("CookiebotOnAccept", sync);
      window.removeEventListener("CookiebotOnDecline", sync);
      window.removeEventListener("CookiebotOnDialogDisplay", sync);
    };
  }, [consentRequired]);

  return { consentRequired, hasConsent };
}
