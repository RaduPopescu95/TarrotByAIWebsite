import React, { useCallback, useEffect, useMemo, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import LocalPasswordGate from "../../../components/Dashboard/LocalPasswordGate";

const ViewsAreaChart = dynamic(() => import("../../../components/Dashboard/VideoViewsAreaChart"), {
  ssr: false,
  loading: () => <ChartSkeleton label="Se încarcă graficul…" />,
});

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

function platformLabel(platform) {
  if (platform === "bunny") return "Bunny";
  if (platform === "vimeo") return "Vimeo";
  if (platform === "youtube") return "YouTube";
  return platform || "—";
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

function VideoViewsDetailScreen() {
  const router = useRouter();
  const videoId = typeof router.query.videoId === "string" ? router.query.videoId : "";
  const rangeFromQuery =
    typeof router.query.range === "string" &&
    ["today", "7d", "30d", "all"].includes(router.query.range)
      ? router.query.range
      : "7d";

  const [range, setRange] = useState(rangeFromQuery);
  const [video, setVideo] = useState(null);
  const [series, setSeries] = useState([]);
  const [totalViews, setTotalViews] = useState(0);
  const [seriesViews, setSeriesViews] = useState(0);
  const [previousTotalViews, setPreviousTotalViews] = useState(0);
  const [avgViewsPerDay, setAvgViewsPerDay] = useState(0);
  const [likesCount, setLikesCount] = useState(0);
  const [seriesFromDay, setSeriesFromDay] = useState(null);
  const [seriesToDay, setSeriesToDay] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setRange(rangeFromQuery);
  }, [rangeFromQuery]);

  const backHref = useMemo(() => {
    const params = new URLSearchParams();
    if (range) params.set("range", range);
    const qs = params.toString();
    return qs ? `/administrare/statistici-video?${qs}` : "/administrare/statistici-video";
  }, [range]);

  const load = useCallback(async () => {
    if (!videoId) return;
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ range });
      const response = await fetch(
        `/api/dashboard/video-views/${encodeURIComponent(videoId)}?${params}`,
        { headers: dashboardHeaders() }
      );
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error || "Nu am putut încărca detaliile.");
      setVideo(data?.video || null);
      setSeries(Array.isArray(data?.series) ? data.series : []);
      setTotalViews(Number(data?.totalViews) || 0);
      setSeriesViews(Number(data?.seriesViews) || 0);
      setPreviousTotalViews(Number(data?.previousTotalViews) || 0);
      setAvgViewsPerDay(Number(data?.avgViewsPerDay) || 0);
      setLikesCount(Number(data?.likesCount) || 0);
      setSeriesFromDay(data?.seriesFromDay || null);
      setSeriesToDay(data?.seriesToDay || null);
    } catch (loadError) {
      setError(loadError?.message || "Nu am putut încărca detaliile.");
      setVideo(null);
      setSeries([]);
      setTotalViews(0);
      setSeriesViews(0);
      setPreviousTotalViews(0);
      setAvgViewsPerDay(0);
      setLikesCount(0);
    } finally {
      setLoading(false);
    }
  }, [range, videoId]);

  useEffect(() => {
    if (!router.isReady) return;
    void load();
  }, [load, router.isReady]);

  const setRangeAndQuery = (nextRange) => {
    setRange(nextRange);
    if (!videoId) return;
    void router.replace(
      {
        pathname: `/administrare/statistici-video/${videoId}`,
        query: { range: nextRange },
      },
      undefined,
      { shallow: true }
    );
  };

  const chartPeriodLabel =
    seriesFromDay && seriesToDay
      ? seriesFromDay === seriesToDay
        ? seriesFromDay
        : `${seriesFromDay} → ${seriesToDay}`
      : "—";

  const deltaCurrent = range === "all" ? seriesViews : totalViews;
  const viewsDelta = formatDeltaPercent(deltaCurrent, previousTotalViews);
  const hasChartData = series.some((point) => (Number(point.views) || 0) > 0);
  const pageTitle = video?.title
    ? `${video.title} | Statistici video`
    : "Detalii video | Statistici";

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-8">
      <Head>
        <title>{pageTitle}</title>
      </Head>
      <div className="mx-auto max-w-5xl">
        <div className="mb-6">
          <Link
            href={backHref}
            className="text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            ← Înapoi la statistici
          </Link>
        </div>

        <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            {loading && !video ? (
              <div className="h-8 w-64 animate-pulse rounded bg-slate-200" />
            ) : (
              <h1 className="text-2xl font-bold text-slate-900">
                {video?.title || "Video indisponibil"}
              </h1>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-600">
              <span className="rounded-full bg-white px-2.5 py-1 ring-1 ring-slate-200">
                {platformLabel(video?.platform)}
              </span>
              <span className="rounded-full bg-white px-2.5 py-1 ring-1 ring-slate-200">
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
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-60"
          >
            {loading ? "Se actualizează…" : "Reîmprospătează"}
          </button>
        </div>

        <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <RangeButton active={range === "today"} onClick={() => setRangeAndQuery("today")}>
            Azi
          </RangeButton>
          <RangeButton active={range === "7d"} onClick={() => setRangeAndQuery("7d")}>
            7 zile
          </RangeButton>
          <RangeButton active={range === "30d"} onClick={() => setRangeAndQuery("30d")}>
            30 zile
          </RangeButton>
          <RangeButton active={range === "all"} onClick={() => setRangeAndQuery("all")}>
            Total
          </RangeButton>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Vizualizări"
            value={totalViews}
            sub={
              range === "all"
                ? "lifetime · delta pe ultimele 90 zile"
                : `vs perioada anterioară (${previousTotalViews})`
            }
            delta={viewsDelta}
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
          <StatCard
            label="Lifetime"
            value={video?.viewsCountLifetime ?? 0}
            sub="total all-time"
            loading={loading}
          />
          <StatCard
            label="Likes"
            value={likesCount}
            sub="lifetime"
            loading={loading}
          />
        </div>

        {error ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        ) : null}

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Vizualizări pe zi</h2>
              <p className="text-xs text-slate-500">{chartPeriodLabel}</p>
            </div>
            {!loading && viewsDelta.label !== "—" ? (
              <span className="text-xs text-slate-500">
                vs perioada anterioară:{" "}
                <span className="font-semibold text-slate-800">{viewsDelta.label}</span>
              </span>
            ) : null}
          </div>
          {loading ? (
            <ChartSkeleton label="Se încarcă graficul…" />
          ) : !hasChartData ? (
            <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
              Nicio vizualizare zilnică pentru perioada selectată.
            </div>
          ) : (
            <ViewsAreaChart data={series} />
          )}
        </section>
      </div>
    </main>
  );
}

export default function StatisticiVideoDetailPage() {
  return (
    <>
      <Head>
        <title>Detalii video | Administrare</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <LocalPasswordGate redirectTo="/administrare/login">
        <VideoViewsDetailScreen />
      </LocalPasswordGate>
    </>
  );
}
