import { useEffect } from "react";

const ADS_DEBUG =
  process.env.NODE_ENV === "development" ||
  process.env.NEXT_PUBLIC_ADS_DEBUG === "true";

function adsLog(...args) {
  if (ADS_DEBUG) console.info("[ADSENSE]", ...args);
}

export default function GoogleAdSenseScript({ clientId, shouldLoad }) {
  useEffect(() => {
    if (typeof document === "undefined") return;

    const existingScript = document.getElementById("google-adsense");
    if (!clientId || !shouldLoad) {
      if (existingScript) existingScript.remove();
      adsLog("script removed (clientId/shouldLoad missing)", {
        hasClientId: Boolean(clientId),
        shouldLoad,
      });
      return;
    }

    if (existingScript) {
      adsLog("script already present", { loaded: existingScript.dataset.loaded });
      return;
    }

    const script = document.createElement("script");
    script.id = "google-adsense";
    script.async = true;
    script.crossOrigin = "anonymous";
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`;
    script.onload = () => {
      script.dataset.loaded = "true";
      window.dispatchEvent(new Event("adsense-script-loaded"));
      adsLog("adsbygoogle.js loaded", { clientId });
    };
    script.onerror = (err) => {
      adsLog("adsbygoogle.js FAILED to load (ad blocker / network?)", err);
    };
    document.head.appendChild(script);
    adsLog("adsbygoogle.js injected", { clientId });
  }, [clientId, shouldLoad]);

  return null;
}
