/**
 * @deprecated Use AdPlacementShell directly. Kept for imports that still reference AdsterraSlot.
 */
import AdPlacementShell from "./AdPlacementShell";

export default function AdsterraSlot({ placementId = "default", className = "" }) {
  return <AdPlacementShell placementId={placementId} className={className} />;
}
