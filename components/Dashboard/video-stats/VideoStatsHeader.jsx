import React, { useId, useState } from "react";
import { formatRelativeUpdatedAt } from "./formatVideoStatsDelta";
import { TRACKING_INFO } from "./videoStatsConstants";

export default function VideoStatsHeader({
  title = "Statistici video",
  subtitle = "Analizează performanța videoclipurilor și evoluția vizualizărilor.",
  updatedAtMs,
  loading,
  onRefresh,
}) {
  const tipId = useId();
  const [tipOpen, setTipOpen] = useState(false);

  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0 max-w-2xl">
        <div className="flex items-center gap-2">
          <h1 className="text-[28px] font-bold leading-tight text-slate-900 sm:text-[32px]">
            {title}
          </h1>
          <button
            type="button"
            className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-xs font-semibold text-slate-600 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
            aria-label="Informații despre tracking"
            aria-expanded={tipOpen}
            aria-controls={tipId}
            onClick={() => setTipOpen((open) => !open)}
            onBlur={() => setTipOpen(false)}
          >
            i
          </button>
        </div>
        <p className="mt-1 text-sm text-slate-600">{subtitle}</p>
        {tipOpen ? (
          <p
            id={tipId}
            role="tooltip"
            className="mt-2 max-w-xl rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 shadow-sm"
          >
            {TRACKING_INFO}
          </p>
        ) : null}
      </div>
      <div className="flex flex-col items-stretch gap-2 sm:items-end">
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
        >
          {loading ? "Se actualizează…" : "Actualizează"}
        </button>
        <p className="text-xs text-slate-500">{formatRelativeUpdatedAt(updatedAtMs)}</p>
      </div>
    </div>
  );
}
