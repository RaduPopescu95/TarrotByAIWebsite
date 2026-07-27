import React, { useMemo } from "react";
import VideoStatsEmptyState from "./VideoStatsEmptyState";
import { ChartSkeleton } from "./VideoStatsSkeleton";

const LOCALE_LABELS = {
  ro: "Română",
  en: "English",
  de: "Deutsch",
  fr: "Français",
  es: "Español",
  it: "Italiano",
  pt: "Português",
  nl: "Nederlands",
  pl: "Polski",
  hu: "Magyar",
  cs: "Čeština",
  sk: "Slovenčina",
  bg: "Български",
  hr: "Hrvatski",
  sr: "Srpski",
  uk: "Українська",
  ru: "Русский",
  el: "Ελληνικά",
  tr: "Türkçe",
  ar: "العربية",
  he: "עברית",
  zh: "中文",
  ja: "日本語",
  ko: "한국어",
  hi: "हिन्दी",
  th: "ไทย",
  vi: "Tiếng Việt",
};

function localeLabel(code) {
  const key = typeof code === "string" ? code.trim().toLowerCase() : "";
  if (!key) return "—";
  return LOCALE_LABELS[key] || key.toUpperCase();
}

export default function ViewsByLocalePanel({
  loading,
  viewsByLocale = [],
  periodLabel,
  totalViews = 0,
  onClearFilters,
}) {
  const list = useMemo(
    () =>
      (Array.isArray(viewsByLocale) ? viewsByLocale : []).filter(
        (row) => (Number(row?.viewsCount) || 0) > 0
      ),
    [viewsByLocale]
  );

  const max = useMemo(
    () => Math.max(...list.map((row) => Number(row.viewsCount) || 0), 1),
    [list]
  );

  const sumLocales = useMemo(
    () => list.reduce((sum, row) => sum + (Number(row.viewsCount) || 0), 0),
    [list]
  );

  if (loading) return <ChartSkeleton />;

  if (list.length === 0) {
    return (
      <VideoStatsEmptyState
        title="Nu există încă vizionări pe limbă"
        description="Breakdown-ul pe limbă începe după activarea tracking-ului. Datele vechi rămân doar în totaluri."
        primaryLabel="Șterge filtrele"
        onPrimary={onClearFilters}
      />
    );
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">
            Vizionări pe limbă
          </h2>
          <p className="text-xs text-slate-500">{periodLabel}</p>
        </div>
        <p className="text-sm tabular-nums text-slate-600">
          {sumLocales} pe limbi
          {totalViews > 0 && sumLocales !== totalViews ? (
            <span className="text-slate-400"> · {totalViews} total</span>
          ) : null}
        </p>
      </div>

      <ul className="space-y-3">
        {list.map((row) => {
          const views = Number(row.viewsCount) || 0;
          const pct = Math.round((views / max) * 100);
          const share =
            totalViews > 0 ? Math.round((views / totalViews) * 1000) / 10 : null;
          return (
            <li key={row.locale}>
              <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
                <div className="min-w-0">
                  <span className="font-medium text-slate-900">
                    {localeLabel(row.locale)}
                  </span>
                  <span className="ml-2 font-mono text-xs uppercase text-slate-400">
                    {row.locale}
                  </span>
                </div>
                <div className="shrink-0 tabular-nums text-slate-700">
                  <span className="font-semibold text-slate-900">{views}</span>
                  {share != null ? (
                    <span className="ml-2 text-xs text-slate-400">{share}%</span>
                  ) : null}
                </div>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-slate-800 transition-[width]"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
