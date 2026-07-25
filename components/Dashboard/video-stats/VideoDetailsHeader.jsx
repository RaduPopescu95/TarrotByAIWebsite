import React, { useState } from "react";
import Link from "next/link";
import { platformLabel, titleInitial } from "./formatVideoStatsDelta";

export default function VideoDetailsHeader({
  backHref,
  video,
  videoId,
  loading,
  onRefresh,
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(videoId);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="space-y-4">
      <Link
        href={backHref}
        className="inline-flex text-sm font-medium text-slate-600 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
      >
        ← Înapoi la statistici
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 flex-1 gap-3">
          <div
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-slate-200 text-lg font-semibold text-slate-600"
            aria-hidden="true"
          >
            {titleInitial(video?.title)}
          </div>
          <div className="min-w-0">
            {loading && !video ? (
              <div className="h-8 w-56 animate-pulse rounded bg-slate-200" />
            ) : (
              <h1
                className="line-clamp-2 text-[28px] font-bold leading-tight text-slate-900"
                title={video?.title || ""}
              >
                {video?.title || "Video indisponibil"}
              </h1>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-600">
              <span className="rounded-full bg-slate-100 px-2.5 py-1">
                {platformLabel(video?.platform)}
              </span>
              <span className="rounded-full bg-slate-100 px-2.5 py-1">
                {video?.category || "Fără categorie"}
              </span>
              <span
                className={`rounded-full px-2.5 py-1 font-semibold ring-1 ring-inset ${
                  video?.isPublished
                    ? "bg-emerald-50 text-emerald-800 ring-emerald-600/20"
                    : "bg-slate-100 text-slate-700 ring-slate-300"
                }`}
              >
                {video?.isPublished ? "Public" : "Ascuns"}
              </span>
              <span className="font-mono text-[11px] text-slate-400">{videoId}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
          >
            {copied ? "Copiat" : "Copiază ID"}
          </button>
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
          >
            {loading ? "Se actualizează…" : "Actualizează"}
          </button>
        </div>
      </div>
    </div>
  );
}
