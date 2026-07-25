import React, { useEffect, useMemo, useRef, useState } from "react";
import { platformLabel, titleInitial } from "./formatVideoStatsDelta";
import { PAGE_SIZE_OPTIONS } from "./videoStatsConstants";
import VideoStatsEmptyState from "./VideoStatsEmptyState";
import { TableSkeleton } from "./VideoStatsSkeleton";
import VideoStatsMobileList from "./VideoStatsMobileList";

async function copyText(value) {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    return false;
  }
}

function RowActions({ videoId, onOpenDetail }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (event) => {
      if (ref.current && !ref.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-label="Acțiuni videoclip"
        aria-expanded={open}
        onClick={(event) => {
          event.stopPropagation();
          setOpen((value) => !value);
        }}
        className="rounded-lg px-2 py-1 text-lg leading-none text-slate-500 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
      >
        ⋮
      </button>
      {open ? (
        <div className="absolute right-0 z-20 mt-1 w-44 rounded-lg border border-slate-200 bg-white py-1 shadow-sm">
          <button
            type="button"
            className="block w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
            onClick={(event) => {
              event.stopPropagation();
              setOpen(false);
              onOpenDetail(videoId);
            }}
          >
            Vezi statistici
          </button>
          <button
            type="button"
            className="block w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
            onClick={async (event) => {
              event.stopPropagation();
              await copyText(videoId);
              setOpen(false);
            }}
          >
            Copiază ID-ul
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default function VideoStatsTable({
  loading,
  rows = [],
  page,
  pageSize,
  sort,
  onPageChange,
  onPageSizeChange,
  onSortChange,
  onOpenDetail,
  onClearFilters,
}) {
  const sorted = useMemo(() => {
    const list = [...(Array.isArray(rows) ? rows : [])];
    if (sort === "title") {
      list.sort((a, b) => String(a.title || "").localeCompare(String(b.title || ""), "ro"));
    } else {
      list.sort(
        (a, b) => (Number(b.viewsCount) || 0) - (Number(a.viewsCount) || 0)
      );
    }
    return list;
  }, [rows, sort]);

  const total = sorted.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, pageCount);
  const pageRows = sorted.slice((safePage - 1) * pageSize, safePage * pageSize);

  if (loading) return <TableSkeleton rows={8} />;

  if (total === 0) {
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
    <section className="rounded-xl border border-slate-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Toate videoclipurile</h2>
          <p className="text-xs text-slate-500">{total} rezultate</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-xs text-slate-600">
            Pe pagină
            <select
              value={pageSize}
              onChange={(event) => onPageSizeChange(Number(event.target.value))}
              className="ml-2 rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-slate-600">
            Sortare
            <select
              value={sort}
              onChange={(event) => onSortChange(event.target.value)}
              className="ml-2 rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
            >
              <option value="views">Vizualizări</option>
              <option value="title">Titlu</option>
            </select>
          </label>
        </div>
      </div>

      <div className="hidden md:block">
        <div className="max-h-[560px] overflow-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="sticky top-0 z-10 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-600">
              <tr>
                <th className="px-4 py-3">Videoclip</th>
                <th className="px-4 py-3">Categorie</th>
                <th className="px-4 py-3 text-right">Vizualizări</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Acțiuni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pageRows.map((row) => (
                <tr
                  key={row.videoId}
                  className="cursor-pointer hover:bg-slate-50"
                  onClick={() => onOpenDetail(row.videoId)}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-200 text-xs font-semibold text-slate-600"
                        aria-hidden="true"
                      >
                        {titleInitial(row.title)}
                      </div>
                      <div className="min-w-0">
                        <p
                          className="line-clamp-2 font-medium text-slate-900"
                          title={row.title || ""}
                        >
                          {row.title || "—"}
                        </p>
                        <p className="text-xs text-slate-500">
                          {platformLabel(row.platform)}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{row.category || "—"}</td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums text-slate-900">
                    {row.viewsCount}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${
                        row.isPublished
                          ? "bg-emerald-50 text-emerald-800 ring-emerald-600/20"
                          : "bg-slate-100 text-slate-700 ring-slate-300"
                      }`}
                    >
                      {row.isPublished ? "Public" : "Ascuns"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <RowActions videoId={row.videoId} onOpenDetail={onOpenDetail} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="md:hidden">
        <VideoStatsMobileList rows={pageRows} onOpenDetail={onOpenDetail} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 px-4 py-3">
        <p className="text-xs text-slate-500">
          Pagina {safePage} din {pageCount}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={safePage <= 1}
            onClick={() => onPageChange(safePage - 1)}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium disabled:opacity-40"
          >
            Înapoi
          </button>
          <button
            type="button"
            disabled={safePage >= pageCount}
            onClick={() => onPageChange(safePage + 1)}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium disabled:opacity-40"
          >
            Înainte
          </button>
        </div>
      </div>
    </section>
  );
}
