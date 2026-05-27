import { useEffect } from "react";

function getCmpScriptId(provider) {
  if (provider === "cookiebot") return "Cookiebot";
  return "tcf-cmp-script";
}

export default function CmpScriptLoader({
  enabled,
  scriptSrc,
  siteId,
  provider = "generic",
  cookiebotCbid = "",
  cookiebotBlockingMode = "auto",
}) {
  useEffect(() => {
    if (typeof document === "undefined") return;

    const scriptId = getCmpScriptId(provider);
    const existing =
      document.getElementById("Cookiebot") ||
      document.getElementById("tcf-cmp-script");
    if (!enabled || !scriptSrc) {
      if (existing) existing.remove();
      return;
    }

    if (existing?.id === scriptId) return;
    if (existing) existing.remove();

    const script = document.createElement("script");
    script.id = scriptId;
    script.type = "text/javascript";
    script.src = scriptSrc;
    script.async = true;

    if (provider === "cookiebot") {
      if (cookiebotCbid) {
        script.dataset.cbid = cookiebotCbid;
      }
      if (cookiebotBlockingMode) {
        script.dataset.blockingmode = cookiebotBlockingMode;
      }
    } else if (siteId) {
      script.dataset.siteId = siteId;
    }
    document.head.appendChild(script);
  }, [
    enabled,
    scriptSrc,
    siteId,
    provider,
    cookiebotCbid,
    cookiebotBlockingMode,
  ]);

  return null;
}
