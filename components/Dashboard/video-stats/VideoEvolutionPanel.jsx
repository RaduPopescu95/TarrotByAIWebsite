import React, { useMemo } from "react";
import dynamic from "next/dynamic";
import { formatDayRo, formatVideoStatsDelta } from "./formatVideoStatsDelta";
import VideoStatsEmptyState from "./VideoStatsEmptyState";
import { ChartSkeleton } from "./VideoStatsSkeleton";

const ViewsChart = dynamic(() => import("../VideoViewsAreaChart"), {
  ssr: false,
  loading: () => <ChartSkeleton />,
});

export default function VideoEvolutionPanel({
  loading,
  series = [],
  range,
  previousTotalViews,
  periodLabel,
  onClearFilters,
}) {
  const hasData = series.some((point) => (Number(point.views) || 0) > 0);
  const variant = range === "today" || range === "7d" ? "bar" : "line";

  const summary = useMemo(() => {
    if (!hasData) return null;
    let peak = series[0];
    for (const point of series) {
      if ((Number(point.views) || 0) > (Number(peak?.views) || 0)) peak = point;
    }
    const total = series.reduce((sum, point) => sum + (Number(point.views) || 0), 0);
    const delta = formatVideoStatsDelta(total, previousTotalViews);
    return { peak, total, delta };
  }, [hasData, previousTotalViews, series]);

  if (loading) return <ChartSkeleton />;

  if (!hasData) {
    return (
      <VideoStatsEmptyState
        primaryLabel="Șterge filtrele"
        onPrimary={onClearFilters}
        secondaryLabel="Selectează o altă perioadă"
        onSecondary={onClearFilters}
      />
    );
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">
            Evoluția performanței
          </h2>
          <p className="text-xs text-slate-500">{periodLabel}</p>
        </div>
      </div>
      <ViewsChart data={series} variant={variant} />
      {summary ? (
        <dl className="mt-4 grid gap-3 border-t border-slate-100 pt-4 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-xs text-slate-500">Zi de vârf</dt>
            <dd className="mt-0.5 font-semibold text-slate-900">
              {formatDayRo(summary.peak.day)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Maxim pe zi</dt>
            <dd className="mt-0.5 font-semibold tabular-nums text-slate-900">
              {summary.peak.views}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Față de perioada anterioară</dt>
            <dd className="mt-0.5 font-semibold text-slate-900">
              {summary.delta.isNewActivity
                ? "Activitate nouă în această perioadă"
                : summary.delta.label}
            </dd>
          </div>
        </dl>
      ) : null}
    </section>
  );
}
