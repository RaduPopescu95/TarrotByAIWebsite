import { useEffect, useRef, useState } from "react";
import {
  getAdsterraPlacementKey,
  getAdsterraScriptHost,
  isAdsterraEnabled,
} from "../../lib/ads/config";
import { useAdsEngagementContext } from "./AdsEngagementContext";

const loadedScriptKeys = new Set();

function loadAdsterraInvokeScript(host, key) {
  if (typeof document === "undefined" || !host || !key) return;
  const scriptId = `adsterra-invoke-${key}`;
  if (loadedScriptKeys.has(scriptId) || document.getElementById(scriptId)) {
    loadedScriptKeys.add(scriptId);
    return;
  }

  const script = document.createElement("script");
  script.id = scriptId;
  script.async = true;
  script.setAttribute("data-cfasync", "false");
  script.src = `${host}/${key}/invoke.js`;
  document.body.appendChild(script);
  loadedScriptKeys.add(scriptId);
}

export default function AdsterraSlot({ placementId = "default", className = "" }) {
  const enabled = isAdsterraEnabled();
  const host = getAdsterraScriptHost();
  const key = getAdsterraPlacementKey(placementId);
  const { canShowAdsterra, routeEligible } = useAdsEngagementContext();
  const containerRef = useRef(null);
  const [inViewport, setInViewport] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  const containerId = key ? `container-${key}` : "";

  useEffect(() => {
    if (!enabled || !containerRef.current) return undefined;

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
  }, [enabled, key]);

  const canLoad =
    enabled &&
    Boolean(host) &&
    Boolean(key) &&
    routeEligible &&
    canShowAdsterra &&
    inViewport;

  useEffect(() => {
    if (!canLoad || scriptLoaded) return;
    loadAdsterraInvokeScript(host, key);
    setScriptLoaded(true);
  }, [canLoad, host, key, scriptLoaded]);

  if (!enabled || !key) {
    return null;
  }

  const showPlaceholder =
    process.env.NODE_ENV === "development" && routeEligible;

  return (
    <div
      ref={containerRef}
      className={className}
      data-adsterra-placement={placementId}
      aria-hidden={!canLoad && !showPlaceholder}
    >
      {canLoad || showPlaceholder ? (
        <div
          id={containerId}
          className="adsterra-native-banner min-h-[90px] w-full overflow-hidden rounded-lg"
        />
      ) : null}
    </div>
  );
}
