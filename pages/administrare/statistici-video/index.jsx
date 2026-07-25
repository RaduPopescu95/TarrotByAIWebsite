import React, { useCallback, useEffect, useMemo, useState } from "react";
import Head from "next/head";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import LocalPasswordGate from "../../../components/Dashboard/LocalPasswordGate";

const ViewsAreaChart = dynamic(() => import("../../../components/Dashboard/VideoViewsAreaChart"), {
  ssr: false,
  loading: () => <ChartSkeleton label="Se încarcă graficul…" />,
});

const TopVideosBarChart = dynamic(
  () => import("../../../components/Dashboard/VideoTopViewsBarChart"),
  {
    ssr: false,
    loading: () => <ChartSkeleton label="Se încarcă top videouri…" />,
  }
);

function dashboardHeaders() {
  return { Accept: "application/json" };
}

function formatDeltaPercent(current, previous) {
  const cur = Number(current) || 0;
  const prev = Number(previous) || 0;
  if (prev <= 0) {
    if (cur <= 0) return { label: "—", tone: "slate" };
    return { label: "+100%", tone: "emerald" };
  }
  const pct = Math.round(((cur - prev) / prev) * 100);
  if (pct > 0) return { label: `+${pct}%`, tone: "emerald" };
  if (pct < 0) return { label: `${pct}%`, tone: "rose" };
  return { label: "0%", tone: "slate" };
}

function ChartSkeleton({ label }) {
  return (
    <div className="flex h-64 items-center justify-center rounded-xl bg-slate-50 text-sm text-slate-500">
      {label}
    </div>
  );
}

function StatCard({ label, value, sub, delta, loading }) {
  const deltaTone =
    delta?.tone === "emerald"
      ? "text-emerald-700 bg-emerald-50 ring-emerald-600/15"
      : delta?.tone === "rose"
        ? "text-rose-700 bg-rose-50 ring-rose-600/15"
        : "text-slate-600 bg-slate-100 ring-slate-300/40";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
        {delta?.label ? (
          <span
            className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${deltaTone}`}
          >
            {delta.label}
          </span>
        ) : null}
      </div>
      {loading ? (
        <div className="mt-3 h-8 w-20 animate-pulse rounded bg-slate-100" />
      ) : (
        <p className="mt-2 text-2xl font-bold tabular-nums text-slate-900">{value}</p>
      )}
      {sub ? <p className="mt-1 text-xs text-slate-500">{sub}</p> : null}
    </div>
  );
}

function RangeButton({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
        active
          ? "bg-slate-900 text-white shadow-sm"
          : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
      }`}
    >
      {children}
    </button>
  );
}

function VideoViewsStatsScreen() {
  const router = useRouter();
  const rangeFromQuery =
    typeof router.query.range === "string" &&
    ["today", "7d", "30d", "all"].includes(router.query.range)
      ? router.query.range
      : null;
  const [range, setRange] = useState(rangeFromQuery || "7d");
  const [platform, setPlatform] = useState("");
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [rows, setRows] = useState([]);
  const [series, setSeries] = useState([]);
  const [topVideos, setTopVideos] = useState([]);
  const [totalViews, setTotalViews] = useState(0);
  const [previousTotalViews, setPreviousTotalViews] = useState(0);
  const [avgViewsPerDay, setAvgViewsPerDay] = useState(0);
  const [videoCount, setVideoCount] = useState(0);
  const [topVideo, setTopVideo] = useState(null);
  const [fromDay, setFromDay] = useState(null);
  const [toDay, setToDay] = useState(null);
  const [seriesFromDay, setSeriesFromDay] = useState(null);
  const [seriesToDay, setSeriesToDay] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (rangeFromQuery) setRange(rangeFromQuery);
  }, [rangeFromQuery]);

  const openVideoDetail = useCallback(
    (videoId) => {
      if (!videoId) return;
      void router.push({
        pathname: `/administrare/statistici-video/${videoId}`,
        query: { range },
      });
    },
    [range, router]
  );

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
      setSeries(Array.isArray(data?.series) ? data.series : []);
      setTopVideos(Array.isArray(data?.topVideos) ? data.topVideos : []);
      setTotalViews(Number(data?.totalViews) || 0);
      setPreviousTotalViews(Number(data?.previousTotalViews) || 0);
      setAvgViewsPerDay(Number(data?.avgViewsPerDay) || 0);
      setVideoCount(Number(data?.videoCount) || 0);
      setTopVideo(data?.topVideo || null);
      setFromDay(data?.fromDay || null);
      setToDay(data?.toDay || null);
      setSeriesFromDay(data?.seriesFromDay || null);
      setSeriesToDay(data?.seriesToDay || null);
    } catch (loadError) {
      setError(loadError?.message || "Nu am putut încărca statisticile.");
      setRows([]);
      setSeries([]);
      setTopVideos([]);
      setTotalViews(0);
      setPreviousTotalViews(0);
      setAvgViewsPerDay(0);
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

  const chartPeriodLabel =
    seriesFromDay && seriesToDay
      ? seriesFromDay === seriesToDay
        ? seriesFromDay
        : `${seriesFromDay} → ${seriesToDay}`
      : periodLabel;

  const viewsDelta = formatDeltaPercent(totalViews, previousTotalViews);
  const chartDelta =
    range === "all"
      ? formatDeltaPercent(
          series.reduce((sum, point) => sum + (Number(point.views) || 0), 0),
          previousTotalViews
        )
      : viewsDelta;

  const hasChartData = series.some((point) => (Number(point.views) || 0) > 0);
  const hasTopData = topVideos.length > 0;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-7 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Statistici video</h1>
            <p className="mt-1 text-sm text-slate-600">
              Vizualizări din deschiderile de player (app + site). Graficul pe zile folosește
              tracking-ul zilnic; „Total” pe carduri rămâne lifetime.
            </p>
            <p className="mt-1 text-xs text-slate-500">Perioadă: {periodLabel}</p>
          </div>
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-60"
          >
            {loading ? "Se actualizează…" : "Reîmprospătează"}
          </button>
        </div>

        <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap gap-2">
            <RangeButton active={range === "today"} onClick={() => setRange("today")}>
              Azi
            </RangeButton>
            <RangeButton active={range === "7d"} onClick={() => setRange("7d")}>
              7 zile
            </RangeButton>
            <RangeButton active={range === "30d"} onClick={() => setRange("30d")}>
              30 zile
            </RangeButton>
            <RangeButton active={range === "all"} onClick={() => setRange("all")}>
              Total
            </RangeButton>
          </div>
          <div className="grid gap-3 md:grid-cols-[180px_1fr_auto]">
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
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Vizualizări"
            value={totalViews}
            sub={
              range === "all"
                ? "Lifetime · delta pe ultimele 90 zile"
                : `vs perioada anterioară (${previousTotalViews})`
            }
            delta={range === "all" ? chartDelta : viewsDelta}
            loading={loading}
          />
          <StatCard
            label="Videouri cu views"
            value={videoCount}
            sub="în filtrul curent"
            loading={loading}
          />
          <StatCard
            label="Top video"
            value={topVideo ? topVideo.viewsCount : "—"}
            sub={topVideo?.title || "Niciun video în range"}
            loading={loading}
          />
          <StatCard
            label="Media / zi"
            value={avgViewsPerDay}
            sub={
              range === "all"
                ? "medie pe ultimele 90 zile"
                : `pe ${series.length || 0} zile din grafic`
            }
            loading={loading}
          />
        </div>

        {error ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        ) : null}

        <div className="mt-6 grid gap-4 xl:grid-cols-5">
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm xl:col-span-3">
            <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Vizualizări pe zi</h2>
                <p className="text-xs text-slate-500">{chartPeriodLabel}</p>
              </div>
              {!loading && chartDelta.label !== "—" ? (
                <span className="text-xs text-slate-500">
                  vs perioada anterioară:{" "}
                  <span className="font-semibold text-slate-800">{chartDelta.label}</span>
                </span>
              ) : null}
            </div>
            {loading ? (
              <ChartSkeleton label="Se încarcă graficul…" />
            ) : !hasChartData ? (
              <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
                Nicio vizualizare zilnică pentru filtrele selectate.
              </div>
            ) : (
              <ViewsAreaChart data={series} />
            )}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm xl:col-span-2">
            <div className="mb-3">
              <h2 className="text-sm font-semibold text-slate-900">Top 10 videouri</h2>
              <p className="text-xs text-slate-500">
                Click pe un video pentru detalii
              </p>
            </div>
            {loading ? (
              <ChartSkeleton label="Se încarcă top videouri…" />
            ) : !hasTopData ? (
              <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
                Niciun video cu views în range.
              </div>
            ) : (
              <TopVideosBarChart data={topVideos} onSelect={openVideoDetail} />
            )}
          </section>
        </div>

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
                  Array.from({ length: 5 }).map((_, index) => (
                    <tr key={`skeleton-${index}`}>
                      <td colSpan={6} className="px-4 py-3">
                        <div className="h-4 animate-pulse rounded bg-slate-100" />
                      </td>
                    </tr>
                  ))
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                      Nicio vizualizare pentru filtrele selectate.
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => {
                    return (
                      <tr
                        key={row.videoId}
                        className="cursor-pointer transition hover:bg-slate-50"
                        onClick={() => openVideoDetail(row.videoId)}
                      >
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
                    );
                  })
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
