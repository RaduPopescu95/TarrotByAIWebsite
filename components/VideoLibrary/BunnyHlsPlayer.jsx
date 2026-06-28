import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";

export default function BunnyHlsPlayer({
  src,
  title,
  poster,
  seekRequest,
  className = "",
  onReady,
  onError,
}) {
  const videoRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return undefined;

    let hls = null;
    setReady(false);

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
    } else if (Hls.isSupported()) {
      hls = new Hls({ enableWorker: true });
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data?.fatal) {
          onError?.(data);
        }
      });
    } else {
      onError?.(new Error("hls_not_supported"));
    }

    const handleReady = () => {
      setReady(true);
      onReady?.(video);
    };
    const handleError = () => onError?.(new Error("video_error"));

    video.addEventListener("loadedmetadata", handleReady);
    video.addEventListener("error", handleError);

    return () => {
      video.removeEventListener("loadedmetadata", handleReady);
      video.removeEventListener("error", handleError);
      if (hls) {
        hls.destroy();
      }
      video.removeAttribute("src");
      video.load();
    };
  }, [onError, onReady, src]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !ready || !seekRequest) return;
    const seconds = Number(seekRequest.seconds);
    if (!Number.isFinite(seconds) || seconds < 0) return;
    try {
      video.currentTime = seconds;
      void video.play();
    } catch (error) {
      onError?.(error);
    }
  }, [onError, ready, seekRequest]);

  return (
    <video
      ref={videoRef}
      title={title}
      poster={poster || undefined}
      controls
      playsInline
      preload="metadata"
      className={className}
    />
  );
}
