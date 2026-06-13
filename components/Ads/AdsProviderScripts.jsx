/**
 * AdSense is now scoped to `/main-dashboard` and is loaded directly from
 * `MainDashboardTopAd` (with its own 9s + interaction gate). All other public
 * routes use AdSterra via `AdPlacementShell`. There is therefore no global
 * AdSense script to manage from `_app.js`, so this provider intentionally
 * renders nothing.
 *
 * Kept as a thin component so existing `<AdsProviderScripts />` mount points
 * remain stable; if a future route needs global AdSense Auto Ads, re-add the
 * route-aware loader here.
 */
export default function AdsProviderScripts() {
  return null;
}
