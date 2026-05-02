import { useCallback, useState } from "react";

/**
 * Renders a preview image when {@link src} loads; otherwise shows {@link fallback}
 * (missing URL or browser load error — avoids broken-image icons).
 */
export default function PublicVideoThumbnail({ src, alt = "", imgClassName, fallback }) {
  const [failed, setFailed] = useState(false);
  const handleError = useCallback(() => setFailed(true), []);

  const normalized = typeof src === "string" ? src.trim() : "";
  if (!normalized || failed) {
    return fallback;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={normalized} alt={alt} className={imgClassName} onError={handleError} />
  );
}
