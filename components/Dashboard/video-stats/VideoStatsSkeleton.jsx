import React from "react";

export function KpiSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={`kpi-skel-${index}`}
          className="rounded-xl border border-slate-200 bg-white p-4"
        >
          <div className="h-3 w-20 animate-pulse rounded bg-slate-100" />
          <div className="mt-3 h-8 w-24 animate-pulse rounded bg-slate-100" />
          <div className="mt-2 h-3 w-32 animate-pulse rounded bg-slate-100" />
        </div>
      ))}
    </div>
  );
}

export function ChartSkeleton({ label = "Se încarcă graficul…" }) {
  return (
    <div
      className="flex h-72 items-center justify-center rounded-xl border border-slate-100 bg-slate-50 text-sm text-slate-500"
      role="status"
      aria-live="polite"
    >
      {label}
    </div>
  );
}

export function TableSkeleton({ rows = 6 }) {
  return (
    <div className="space-y-2" role="status" aria-live="polite">
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={`row-skel-${index}`}
          className="h-14 animate-pulse rounded-xl bg-slate-100"
        />
      ))}
    </div>
  );
}
