import React from "react";
import { formatVideoStatsDelta } from "./formatVideoStatsDelta";
import { KpiSkeleton } from "./VideoStatsSkeleton";

function KpiCard({ label, value, comparison, loading }) {
  const toneClass =
    comparison?.tone === "emerald"
      ? "text-emerald-700"
      : comparison?.tone === "rose"
        ? "text-rose-700"
        : "text-slate-500";

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      {loading ? (
        <div className="mt-3 h-9 w-24 animate-pulse rounded bg-slate-100" />
      ) : (
        <p className="mt-2 text-[30px] font-bold tabular-nums leading-none text-slate-900 sm:text-[34px]">
          {value}
        </p>
      )}
      {comparison?.label ? (
        <p className={`mt-2 text-xs ${toneClass}`}>
          {comparison.isNewActivity ? "Activitate nouă în această perioadă" : comparison.label}
        </p>
      ) : (
        <p className="mt-2 text-xs text-slate-400">—</p>
      )}
    </article>
  );
}

export default function VideoStatsKpiGrid({
  loading,
  range,
  totalViews,
  previousTotalViews,
  seriesViews,
  videoCount,
  avgViewsPerDay,
  topVideo,
}) {
  if (loading) return <KpiSkeleton />;

  const viewsForDelta = range === "all" ? seriesViews : totalViews;
  const viewsDelta = formatVideoStatsDelta(viewsForDelta, previousTotalViews);
  const viewsLabel = range === "all" ? "Vizualizări totale" : "Vizualizări";

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard
        label={viewsLabel}
        value={totalViews}
        comparison={viewsDelta}
        loading={false}
      />
      <KpiCard
        label="Videoclipuri vizionate"
        value={videoCount}
        comparison={{ label: "cu cel puțin o vizualizare", tone: "slate" }}
      />
      <KpiCard
        label="Media zilnică"
        value={avgViewsPerDay}
        comparison={{
          label: range === "all" ? "ultimele 90 zile" : "în perioada selectată",
          tone: "slate",
        }}
      />
      <KpiCard
        label="Top video"
        value={topVideo ? topVideo.viewsCount : "—"}
        comparison={{
          label: topVideo?.title
            ? topVideo.title.length > 42
              ? `${topVideo.title.slice(0, 41)}…`
              : topVideo.title
            : "Niciun video în range",
          tone: "slate",
        }}
      />
    </div>
  );
}
