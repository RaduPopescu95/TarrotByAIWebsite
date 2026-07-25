import React from "react";

export default function VideoStatsEmptyState({
  title = "Nu există date pentru perioada și filtrele selectate.",
  description = "",
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
}) {
  return (
    <div className="flex min-h-[220px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center">
      <p className="text-sm font-medium text-slate-800">{title}</p>
      {description ? <p className="mt-1 max-w-md text-sm text-slate-500">{description}</p> : null}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        {primaryLabel && typeof onPrimary === "function" ? (
          <button
            type="button"
            onClick={onPrimary}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
          >
            {primaryLabel}
          </button>
        ) : null}
        {secondaryLabel && typeof onSecondary === "function" ? (
          <button
            type="button"
            onClick={onSecondary}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
          >
            {secondaryLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}
