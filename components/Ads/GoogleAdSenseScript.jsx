import { useEffect } from "react";

export default function GoogleAdSenseScript({ clientId, shouldLoad }) {
  useEffect(() => {
    if (typeof document === "undefined") return;
    const shouldLogAdsDebug = process.env.NODE_ENV === "development";

    const existingScript = document.getElementById("google-adsense");
    if (!clientId || !shouldLoad) {
      if (existingScript) existingScript.remove();
      if (shouldLogAdsDebug) {
        console.info("[ADS] google-adsense script removed");
      }
      return;
    }

    if (existingScript) return;
    const script = document.createElement("script");
    script.id = "google-adsense";
    script.async = true;
    script.crossOrigin = "anonymous";
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`;
    script.onload = () => {
      script.dataset.loaded = "true";
      window.dispatchEvent(new Event("adsense-script-loaded"));
    };
    document.head.appendChild(script);
    if (shouldLogAdsDebug) {
      console.info("[ADS] google-adsense script loaded", { clientId });
    }
  }, [clientId, shouldLoad]);

  return null;
}
