import React from "react";
import { platformLabel, titleInitial } from "./formatVideoStatsDelta";

export default function VideoStatsMobileList({ rows = [], onOpenDetail }) {
  return (
    <ul className="space-y-2 p-3">
      {rows.map((row) => (
        <li key={row.videoId}>
          <button
            type="button"
            onClick={() => onOpenDetail(row.videoId)}
            className="flex w-full gap-3 rounded-xl border border-slate-100 bg-white p-3 text-left hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
          >
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-slate-200 text-sm font-semibold text-slate-600"
              aria-hidden="true"
            >
              {titleInitial(row.title)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-sm font-semibold text-slate-900">
                {row.title || "—"}
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                {row.category || "Fără categorie"} · {platformLabel(row.platform)}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                <span className="font-semibold tabular-nums text-slate-900">
                  {row.viewsCount} viz.
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 font-semibold ring-1 ring-inset ${
                    row.isPublished
                      ? "bg-emerald-50 text-emerald-800 ring-emerald-600/20"
                      : "bg-slate-100 text-slate-700 ring-slate-300"
                  }`}
                >
                  {row.isPublished ? "Public" : "Ascuns"}
                </span>
              </div>
            </div>
          </button>
        </li>
      ))}
    </ul>
  );
}
