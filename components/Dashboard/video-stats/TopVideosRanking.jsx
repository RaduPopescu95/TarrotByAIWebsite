import React, { useMemo } from "react";
import { platformLabel, titleInitial } from "./formatVideoStatsDelta";
import VideoStatsEmptyState from "./VideoStatsEmptyState";
import { TableSkeleton } from "./VideoStatsSkeleton";

export default function TopVideosRanking({
  loading,
  topVideos = [],
  rows = [],
  onOpenDetail,
  onClearFilters,
}) {
  const metaById = useMemo(() => {
    const map = new Map();
    for (const row of rows) {
      if (row?.videoId) map.set(row.videoId, row);
    }
    return map;
  }, [rows]);

  const items = useMemo(() => {
    const list = (Array.isArray(topVideos) ? topVideos : []).slice(0, 10);
    const max = Math.max(...list.map((item) => Number(item.viewsCount) || 0), 1);
    return list.map((item, index) => {
      const meta = metaById.get(item.videoId) || {};
      const views = Number(item.viewsCount) || 0;
      return {
        ...item,
        rank: index + 1,
        platform: meta.platform || "",
        category: meta.category || "",
        widthPct: Math.max(8, Math.round((views / max) * 100)),
      };
    });
  }, [metaById, topVideos]);

  if (loading) return <TableSkeleton rows={5} />;

  if (items.length === 0) {
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
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">
          Cele mai performante videoclipuri
        </h2>
        <p className="text-sm text-slate-500">
          Clasament în funcție de perioada și filtrele selectate.
        </p>
      </div>
      <ol className="space-y-3">
        {items.map((item) => (
          <li
            key={item.videoId}
            className="rounded-xl border border-slate-100 p-3 transition hover:border-slate-200 hover:bg-slate-50"
          >
            <div className="flex gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-sm font-bold text-slate-700">
                {item.rank}
              </span>
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-slate-200 text-sm font-semibold text-slate-600"
                aria-hidden="true"
              >
                {titleInitial(item.title)}
              </div>
              <div className="min-w-0 flex-1">
                <p
                  className="line-clamp-2 text-sm font-semibold text-slate-900"
                  title={item.title || ""}
                >
                  {item.title || "Fără titlu"}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {platformLabel(item.platform)}
                  {item.category ? ` · ${item.category}` : ""}
                </p>
                <div className="mt-2 flex items-center gap-3">
                  <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-slate-900"
                      style={{ width: `${item.widthPct}%` }}
                    />
                  </div>
                  <span className="shrink-0 text-sm font-semibold tabular-nums text-slate-900">
                    {item.viewsCount}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onOpenDetail(item.videoId)}
                className="shrink-0 self-start rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
              >
                Vezi statistici
              </button>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
