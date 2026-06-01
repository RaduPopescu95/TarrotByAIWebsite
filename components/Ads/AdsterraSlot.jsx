import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import {
  getAdsterraPlacementKey,
  getAdsterraScriptHost,
  isAdsterraEnabled,
} from "../../lib/ads/config";
import {
  claimAdsterraSlot,
  resetAdsterraPageRegistry,
} from "../../lib/ads/adsterraRegistry";
import { useAdsEngagementContext } from "./AdsEngagementContext";

function normalizeScriptHost(host) {
  const trimmed = (host || "").trim().replace(/\/$/, "");
  if (!trimmed) return "";
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  if (trimmed.startsWith("//")) {
    return `https:${trimmed}`;
  }
  return `https://${trimmed}`;
}

function buildIframeSrcDoc(scriptHost, key) {
  const base = normalizeScriptHost(scriptHost);
  if (!base || !key) return "";

  const invokeUrl = `${base}/${key}/invoke.js`;
  const containerId = `container-${key}`;

  return `<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    html, body { margin: 0; padding: 0; background: transparent; overflow: hidden; }
    #${containerId} { max-width: 100%; margin: 0 auto; }
  </style>
</head>
<body>
  <div id="${containerId}"></div>
  <script async="async" data-cfasync="false" src="${invokeUrl}"><\/script>
</body>
</html>`;
}

export default function AdsterraSlot({ placementId = "default", className = "" }) {
  const router = useRouter();
  const enabled = isAdsterraEnabled();
  const host = getAdsterraScriptHost();
  const key = getAdsterraPlacementKey(placementId);
  const { canShowAdsterra, routeEligible } = useAdsEngagementContext();
  const containerRef = useRef(null);
  const [inViewport, setInViewport] = useState(false);
  const [slotClaimed, setSlotClaimed] = useState(false);

  const iframeSrcDoc = useMemo(
    () => (host && key ? buildIframeSrcDoc(host, key) : ""),
    [host, key]
  );

  useEffect(() => {
    resetAdsterraPageRegistry();
    setSlotClaimed(false);
  }, [router.pathname]);

  useEffect(() => {
    if (!enabled || !key || slotClaimed) return undefined;
    const claim = claimAdsterraSlot(key);
    if (claim.ok) {
      setSlotClaimed(true);
    }
  }, [enabled, key, slotClaimed, router.pathname]);

  useEffect(() => {
    if (!enabled || !containerRef.current || !slotClaimed) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setInViewport(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px 0px", threshold: 0.01 }
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [enabled, slotClaimed]);

  const canShow =
    enabled &&
    Boolean(host) &&
    Boolean(key) &&
    Boolean(iframeSrcDoc) &&
    routeEligible &&
    canShowAdsterra &&
    slotClaimed &&
    inViewport;

  const showDevPlaceholder =
    process.env.NODE_ENV === "development" &&
    routeEligible &&
    enabled &&
    Boolean(key) &&
    slotClaimed;

  if (!enabled || !key || !slotClaimed) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className={className}
      data-adsterra-placement={placementId}
      data-adsterra-key={key}
    >
      {canShow ? (
        <iframe
          title="Publicitate"
          srcDoc={iframeSrcDoc}
          sandbox="allow-scripts allow-same-origin"
          className="adsterra-native-banner mx-auto block min-h-[90px] w-full max-w-3xl overflow-hidden rounded-lg border-0 bg-transparent"
          style={{ minHeight: 90, maxHeight: 320 }}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      ) : showDevPlaceholder ? (
        <div
          className="adsterra-native-banner min-h-[90px] w-full rounded-lg border border-dashed border-gray-200 bg-gray-50/50"
          aria-hidden
        />
      ) : null}
    </div>
  );
}
