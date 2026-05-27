import { useMemo, useState } from "react";
import Head from "next/head";
import CustomDrawer from "../../../components/Dashboard/CustomDrawer";
import LocalPasswordGate from "../../../components/Dashboard/LocalPasswordGate";
import { getAdsEnv } from "../../../lib/ads/env";
import {
  getRouteSlots,
  isRouteEligibleForAds,
  isSlotEnabledForRoute,
  resolveActiveAdProvider,
} from "../../../lib/ads/orchestrator";
import { AD_SLOT_KEYS } from "../../../lib/ads/config";
import useAdsConsent from "../../../hooks/useAdsConsent";

function formatValue(value) {
  if (value === null || typeof value === "undefined" || value === "") return "not set";
  if (typeof value === "boolean") return value ? "true" : "false";
  return String(value);
}

function statusClass(value) {
  return value
    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
    : "border-rose-200 bg-rose-50 text-rose-800";
}

export default function AdsOrchestrationDashboardPage() {
  const adsEnv = useMemo(() => getAdsEnv(), []);
  const [previewPath, setPreviewPath] = useState("/");
  const { hasConsent, resolved: consentResolved } = useAdsConsent(
    adsEnv.consentRequired,
    adsEnv.cmpEnabled && Boolean(adsEnv.cmpScriptSrc)
  );

  const previewEligible = isRouteEligibleForAds(previewPath);
  const previewProvider = resolveActiveAdProvider(previewPath, adsEnv);
  const previewSlots = getRouteSlots(previewPath);

  const envRows = [
    ["NEXT_PUBLIC_ADS_ENABLED", formatValue(adsEnv.adsEnabled)],
    ["NEXT_PUBLIC_ADS_CONSENT_REQUIRED", formatValue(adsEnv.consentRequired)],
    ["NEXT_PUBLIC_ENABLE_ADSENSE", formatValue(adsEnv.enableAdSense)],
    ["NEXT_PUBLIC_GOOGLE_ADSENSE_CLIENT_ID", formatValue(adsEnv.adSenseClientId)],
    ["NEXT_PUBLIC_ADSENSE_SLOT_AFTER_HERO", formatValue(adsEnv.adSenseSlotAfterHero)],
    ["NEXT_PUBLIC_ADSENSE_SLOT_IN_FEED", formatValue(adsEnv.adSenseSlotInFeed)],
    ["NEXT_PUBLIC_CMP_ENABLED", formatValue(adsEnv.cmpEnabled)],
    ["NEXT_PUBLIC_CMP_SCRIPT_SRC", formatValue(adsEnv.cmpScriptSrc)],
    ["NEXT_PUBLIC_CMP_SITE_ID", formatValue(adsEnv.cmpSiteId)],
    ["NEXT_PUBLIC_CMP_PROVIDER", formatValue(adsEnv.cmpProvider)],
    ["NEXT_PUBLIC_CMP_COOKIEBOT_CBID", formatValue(adsEnv.cmpCookiebotCbid)],
    [
      "NEXT_PUBLIC_CMP_COOKIEBOT_BLOCKING_MODE",
      formatValue(adsEnv.cmpCookiebotBlockingMode),
    ],
    ["NEXT_PUBLIC_PRIMARY_AD_PROVIDER", "adsense (forced in runtime)"],
    ["NEXT_PUBLIC_ADS_FORCE_PROVIDER", formatValue(adsEnv.forceProvider)],
    ["NEXT_PUBLIC_ENABLE_MONETAG", "deprecated (ignored)"],
    ["NEXT_PUBLIC_MONETAG_ZONE_ID", "deprecated (ignored)"],
    ["NEXT_PUBLIC_MONETAG_FORMAT", "deprecated (ignored)"],
    ["NEXT_PUBLIC_MONETAG_SCRIPT_SRC", "deprecated (ignored)"],
    ["NEXT_PUBLIC_ENABLE_ADSTERRA", "deprecated (ignored)"],
    ["NEXT_PUBLIC_ADSTERRA_SCRIPT_SRC", "deprecated (ignored)"],
  ];

  return (
    <>
      <Head>
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <LocalPasswordGate>
        <CustomDrawer selectedItem="Orchestrare Ads" drawerText="Orchestrare Ads">
          <div className="min-h-screen bg-slate-100 p-4 md:p-6">
            <div className="mx-auto max-w-6xl space-y-6">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h1 className="text-xl font-bold text-slate-900">Dashboard Ads Orchestration</h1>
                <p className="mt-2 text-sm text-slate-600">
                  Status runtime pentru ads + simulator de rută pentru verificare rapidă înainte de deploy.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className={`rounded-xl border p-4 text-sm ${statusClass(adsEnv.adsEnabled)}`}>
                  <p className="font-semibold">Ads Enabled</p>
                  <p className="mt-1">{adsEnv.adsEnabled ? "Activ" : "Oprit"}</p>
                </div>
                <div
                  className={`rounded-xl border p-4 text-sm ${statusClass(
                    !adsEnv.consentRequired || hasConsent
                  )}`}
                >
                  <p className="font-semibold">Consent (TCF)</p>
                  <p className="mt-1">
                    {!adsEnv.consentRequired
                      ? "Bypass (consent off)"
                      : consentResolved
                      ? hasConsent
                        ? "Granted"
                        : "Denied"
                      : "Pending"}
                  </p>
                </div>
              <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4 text-sm text-indigo-800">
                <p className="font-semibold">Primary Provider</p>
                <p className="mt-1 uppercase">adsense</p>
              </div>
            </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">Route Simulator</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Introdu o rută (ex: <code>/</code>, <code>/news</code>, <code>/premium</code>) pentru a vedea
                  ce provider ar rula.
                </p>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <input
                    value={previewPath}
                    onChange={(event) => setPreviewPath(event.target.value || "/")}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="/news"
                  />
                </div>
                <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                  <div className={`rounded-lg border p-3 text-sm ${statusClass(previewEligible)}`}>
                    <p className="font-semibold">Route Eligible</p>
                    <p>{previewEligible ? "Yes" : "No"}</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-800">
                    <p className="font-semibold">Resolved Provider</p>
                    <p className="uppercase">{previewProvider}</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-800">
                    <p className="font-semibold">Active Slots</p>
                    <p>{previewSlots.length ? previewSlots.join(", ") : "none"}</p>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div
                    className={`rounded-lg border p-3 text-sm ${statusClass(
                      isSlotEnabledForRoute(previewPath, AD_SLOT_KEYS.AFTER_HERO)
                    )}`}
                  >
                    <p className="font-semibold">Slot after-hero</p>
                    <p>{isSlotEnabledForRoute(previewPath, AD_SLOT_KEYS.AFTER_HERO) ? "enabled" : "disabled"}</p>
                  </div>
                  <div
                    className={`rounded-lg border p-3 text-sm ${statusClass(
                      isSlotEnabledForRoute(previewPath, AD_SLOT_KEYS.IN_FEED)
                    )}`}
                  >
                    <p className="font-semibold">Slot in-feed</p>
                    <p>{isSlotEnabledForRoute(previewPath, AD_SLOT_KEYS.IN_FEED) ? "enabled" : "disabled"}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">Environment Snapshot</h2>
                <div className="mt-4 overflow-auto">
                  <table className="min-w-full border-collapse text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-700">
                        <th className="px-3 py-2 font-semibold">Variable</th>
                        <th className="px-3 py-2 font-semibold">Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {envRows.map(([key, value]) => (
                        <tr key={key} className="border-b border-slate-100">
                          <td className="px-3 py-2 font-mono text-xs text-slate-700">{key}</td>
                          <td className="px-3 py-2 font-mono text-xs text-slate-900">{value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900 shadow-sm">
                <h2 className="text-base font-semibold">Manual AdSense + CMP mode</h2>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  <li>Monetag și Adsterra sunt dezactivate în runtime până la reactivare explicită în cod.</li>
                  <li>Providerul activ este doar AdSense dacă ruta este eligibilă, consentul este valid și env-urile sunt setate.</li>
                  <li>Plasarea este manuală prin sloturi `after-hero` și `in-feed`.</li>
                  <li>Nu folosi formate intruzive pe același domeniu cu AdSense (popunder/onclick/smartlink).</li>
                </ul>
              </div>
            </div>
          </div>
        </CustomDrawer>
      </LocalPasswordGate>
    </>
  );
}
