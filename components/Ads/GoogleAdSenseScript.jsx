import { useEffect } from "react";

export default function GoogleAdSenseScript({ clientId, shouldLoad }) {
  useEffect(() => {
    if (!clientId || !shouldLoad || typeof document === "undefined") return;

    if (document.getElementById("google-adsense")) return;

    const script = document.createElement("script");
    script.id = "google-adsense";
    script.async = true;
    script.crossOrigin = "anonymous";
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`;
    document.head.appendChild(script);
  }, [clientId, shouldLoad]);

  return null;
}
