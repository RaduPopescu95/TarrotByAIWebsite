import React, { useCallback, useEffect, useMemo, useState } from "react";
import Head from "next/head";
import LocalPasswordGate from "../../../components/Dashboard/LocalPasswordGate";

function dashboardHeaders() {
  return { Accept: "application/json" };
}

function StatCard({ label, value, sub }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold tabular-nums text-slate-900">{value}</p>
      {sub ? <p className="mt-1 text-xs text-slate-500">{sub}</p> : null}
    </div>
  );
}

function VideoViewsStatsScreen() {
  const [range, setRange] = useState("7d");
  const [platform, setPlatform] = useState("");
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [rows, setRows] = useState([]);
  const [totalViews, setTotalViews] = useState(0);
  const [videoCount, setVideoCount] = useState(0);
  const [topVideo, setTopVideo] = useState(null);
  const [fromDay, setFromDay] = useState(null);
  const [toDay, setToDay] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const queryString = useMemo(() => {
    const params = new URLSearchParams({ range });
    if (platform) params.set("platform", platform);
    if (appliedSearch.trim()) params.set("search", appliedSearch.trim());
    return params.toString();
  }, [appliedSearch, platform, range]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/dashboard/video-views?${queryString}`, {
        headers: dashboardHeaders(),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error || "Nu am putut încărca statisticile.");
      setRows(Array.isArray(data?.rows) ? data.rows : []);
      setTotalViews(Number(data?.totalViews) || 0);
      setVideoCount(Number(data?.videoCount) || 0);
      setTopVideo(data?.topVideo || null);
      setFromDay(data?.fromDay || null);
      setToDay(data?.toDay || null);
    } catch (loadError) {
      setError(loadError?.message || "Nu am putut încărca statisticile.");
      setRows([]);
      setTotalViews(0);
      setVideoCount(0);
      setTopVideo(null);
    } finally {
      setLoading(false);
    }
  }, [queryString]);

  useEffect(() => {
    void load();
  }, [load]);

  const periodLabel =
    range === "all"
      ? "Total (toate timpurile)"
      : fromDay && toDay
        ? fromDay === toDay
          ? fromDay
          : `${fromDay} → ${toDay}`
        : "—";

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-7">
          <h1 className="text-2xl font-bold text-slate-900">Statistici video</h1>
          <p className="mt-1 text-sm text-slate-600">
            Vizualizări din deschiderile de player (app + site). Perioadele pe zile acoperă datele
            de după activarea tracking-ului; „Total” folosește counter-ul lifetime.
          </p>
        </div>

        <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[180px_160px_1fr_auto]">
          <select
            value={range}
            onChange={(event) => setRange(event.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            <option value="today">Azi</option>
            <option value="7d">Ultimele 7 zile</option>
            <option value="30d">Ultimele 30 zile</option>
            <option value="all">Total</option>
          </select>
          <select
            value={platform}
            onChange={(event) => setPlatform(event.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            <option value="">Toate platformele</option>
            <option value="bunny">Bunny</option>
            <option value="youtube">YouTube</option>
            <option value="vimeo">Vimeo</option>
          </select>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") setAppliedSearch(search);
            }}
            placeholder="Caută după titlu, ID sau categorie"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={() => setAppliedSearch(search)}
            className="rounded-lg bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-700"
          >
            Caută
          </button>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <StatCard label="Vizualizări" value={loading ? "…" : totalViews} sub={periodLabel} />
          <StatCard
            label="Videouri cu views"
            value={loading ? "…" : videoCount}
            sub="în filtrul curent"
          />
          <StatCard
            label="Top video"
            value={
              loading
                ? "…"
                : topVideo
                  ? topVideo.viewsCount
                  : "—"
            }
            sub={topVideo?.title || "Niciun video în range"}
          />
        </div>

        {error ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        ) : null}

        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-600">
                <tr>
                  <th className="px-4 py-3">Titlu</th>
                  <th className="px-4 py-3">Platformă</th>
                  <th className="px-4 py-3">Categorie</th>
                  <th className="px-4 py-3 text-right">Vizualizări</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                      Se încarcă…
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                      Nicio vizualizare pentru filtrele selectate.
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => (
                    <tr key={row.videoId} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {row.title || "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {row.platform === "bunny"
                          ? "Bunny"
                          : row.platform === "vimeo"
                            ? "Vimeo"
                            : row.platform === "youtube"
                              ? "YouTube"
                              : row.platform || "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{row.category || "—"}</td>
                      <td className="px-4 py-3 text-right tabular-nums font-semibold text-slate-900">
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
                      <td className="px-4 py-3 font-mono text-[11px] text-slate-400">
                        {row.videoId}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function StatisticiVideoPage() {
  return (
    <>
      <Head>
        <title>Statistici video | Administrare</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <LocalPasswordGate redirectTo="/administrare/login">
        <VideoViewsStatsScreen />
      </LocalPasswordGate>
    </>
  );
}
