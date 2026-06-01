import { useRouter } from "next/router";
import { isAdsterraEnabled, isAdsterraRouteEligible } from "../../lib/ads/config";
import AdsterraSlot from "./AdsterraSlot";

export default function AdPlacementShell({
  placementId = "default",
  className = "",
}) {
  const router = useRouter();
  const pathname = router?.pathname || "/";

  if (!isAdsterraEnabled() || !isAdsterraRouteEligible(pathname)) {
    return null;
  }

  return (
    <aside
      className={`my-8 flex w-full justify-center px-4 ${className}`.trim()}
      aria-label="Publicitate"
    >
      <div className="w-full max-w-3xl rounded-xl border border-gray-100 bg-gray-50/80 px-4 py-5">
        <p className="mb-3 text-center text-[10px] font-medium uppercase tracking-widest text-gray-400">
          Publicitate
        </p>
        <AdsterraSlot placementId={placementId} />
      </div>
    </aside>
  );
}
