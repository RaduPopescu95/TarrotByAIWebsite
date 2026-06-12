import { useEffect, useRef } from "react";

export default function GoogleAdSenseBanner({
  slot,
  shouldRequest = false,
  format = "auto",
  responsive = true,
  requestStorageKey = "",
  className = "",
  style,
}) {
  const hasRequestedAd = useRef(false);
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_CLIENT_ID || "";

  useEffect(() => {
    if (
      !clientId ||
      !slot ||
      !shouldRequest ||
      hasRequestedAd.current ||
      typeof window === "undefined"
    ) {
      return;
    }

    if (requestStorageKey && window.sessionStorage.getItem(requestStorageKey) === "requested") {
      hasRequestedAd.current = true;
      return;
    }

    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      hasRequestedAd.current = true;
      if (requestStorageKey) {
        window.sessionStorage.setItem(requestStorageKey, "requested");
      }
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.info("[ADSENSE_MAIN_DASHBOARD] push skipped", error);
      }
    }
  }, [clientId, requestStorageKey, shouldRequest, slot]);

  if (!clientId || !slot) {
    return (
      <div
        className={`rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 ${className}`.trim()}
      >
        Completeaza `NEXT_PUBLIC_GOOGLE_ADSENSE_CLIENT_ID` si
        `NEXT_PUBLIC_GOOGLE_ADSENSE_MAIN_DASHBOARD_SLOT_ID`.
      </div>
    );
  }

  return (
    <div className={className}>
      <ins
        className="adsbygoogle"
        style={{
          display: "block",
          minHeight: "120px",
          ...style,
        }}
        data-ad-client={clientId}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive ? "true" : "false"}
      />
    </div>
  );
}
