import React, { useCallback, useEffect, useMemo, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import LocalPasswordGate from "../../../components/Dashboard/LocalPasswordGate";
import VideoDetailsHeader from "../../../components/Dashboard/video-stats/VideoDetailsHeader";
import VideoStatsTabs from "../../../components/Dashboard/video-stats/VideoStatsTabs";
import VideoEvolutionPanel from "../../../components/Dashboard/video-stats/VideoEvolutionPanel";
import VideoStatsEmptyState from "../../../components/Dashboard/video-stats/VideoStatsEmptyState";
import { formatVideoStatsDelta, platformLabel } from "../../../components/Dashboard/video-stats/formatVideoStatsDelta";
import {
  DETAIL_TABS,
  RANGE_OPTIONS,
  VALID_DETAIL_TABS,
  VALID_RANGES,
} from "../../../components/Dashboard/video-stats/videoStatsConstants";
import { KpiSkeleton } from "../../../components/Dashboard/video-stats/VideoStatsSkeleton";

function dashboardHeaders() {
  return { Accept: "application/json" };
}

function DetailKpi({ label, value, sub, loading }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      {loading ? (
        <div className="mt-3 h-8 w-20 animate-pulse rounded bg-slate-100" />
      ) : (
        <p className="mt-2 text-[30px] font-bold tabular-nums text-slate-900">{value}</p>
      )}
      {sub ? <p className="mt-2 text-xs text-slate-500">{sub}</p> : null}
    </article>
  );
}

function VideoViewsDetailScreen() {
  const router = useRouter();
  const videoId = typeof router.query.videoId === "string" ? router.query.videoId : "";
  const [range, setRange] = useState("7d");
  const [tab, setTab] = useState("evolutie");
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
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (!router.isReady) return;
    const nextRange =
      typeof router.query.range === "string" && VALID_RANGES.has(router.query.range)
        ? router.query.range
        : "7d";
    const nextTab =
      typeof router.query.tab === "string" && VALID_DETAIL_TABS.has(router.query.tab)
        ? router.query.tab
        : "evolutie";
    setRange(nextRange);
    setTab(nextTab);
    setHydrated(true);
  }, [router.isReady, router.query.range, router.query.tab]);

  const syncUrl = useCallback(
    (patch) => {
      if (!videoId) return;
      const nextRange = patch.range ?? range;
      const nextTab = patch.tab ?? tab;
      const query = {};
      if (nextRange && nextRange !== "7d") query.range = nextRange;
      if (nextTab && nextTab !== "evolutie") query.tab = nextTab;
      void router.replace(
        { pathname: `/administrare/statistici-video/${videoId}`, query },
        undefined,
        { shallow: true }
      );
    },
    [range, router, tab, videoId]
  );

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
      if (!response.ok) throw new Error(data?.error || "Datele nu au putut fi încărcate.");
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
      setError(loadError?.message || "Datele nu au putut fi încărcate.");
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
    if (!hydrated || !videoId) return;
    void load();
  }, [hydrated, load, videoId]);

  const backHref = useMemo(() => {
    const params = new URLSearchParams();
    if (range && range !== "7d") params.set("range", range);
    const qs = params.toString();
    return qs ? `/administrare/statistici-video?${qs}` : "/administrare/statistici-video";
  }, [range]);

  const periodLabel =
    seriesFromDay && seriesToDay
      ? seriesFromDay === seriesToDay
        ? seriesFromDay
        : `${seriesFromDay} → ${seriesToDay}`
      : "—";

  const periodViews = range === "all" ? seriesViews : totalViews;
  const viewsDelta = formatVideoStatsDelta(periodViews, previousTotalViews);
  const lifetime = video?.viewsCountLifetime ?? 0;
  const appreciationRate =
    lifetime > 0 ? `${Math.round((likesCount / lifetime) * 1000) / 10}%` : "—";

  if (!hydrated) {
    return <div className="min-h-screen bg-slate-50" />;
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <Head>
        <title>
          {video?.title ? `${video.title} | Statistici video` : "Detalii video | Statistici"}
        </title>
      </Head>
      <div className="mx-auto max-w-5xl space-y-5">
        <VideoDetailsHeader
          backHref={backHref}
          video={video}
          videoId={videoId}
          loading={loading}
          onRefresh={() => void load()}
        />

        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Perioadă">
            {RANGE_OPTIONS.map((option) => {
              const active = range === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => {
                    setRange(option.value);
                    syncUrl({ range: option.value });
                  }}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 ${
                    active
                      ? "bg-slate-900 text-white"
                      : "bg-slate-50 text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </section>

        {error ? (
          <VideoStatsEmptyState
            title="Datele nu au putut fi încărcate."
            description={error}
            primaryLabel="Încearcă din nou"
            onPrimary={() => void load()}
          />
        ) : (
          <>
            {loading && !video ? (
              <KpiSkeleton />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <DetailKpi
                  label="Vizualizări în perioada selectată"
                  value={periodViews}
                  sub={
                    viewsDelta.isNewActivity
                      ? "Activitate nouă în această perioadă"
                      : viewsDelta.label
                  }
                />
                <DetailKpi label="Vizualizări totale" value={lifetime} sub="all-time" />
                <DetailKpi label="Like-uri" value={likesCount} sub="lifetime" />
                <DetailKpi
                  label="Media zilnică"
                  value={avgViewsPerDay}
                  sub={range === "all" ? "ultimele 90 zile" : "în perioada selectată"}
                />
              </div>
            )}

            <VideoStatsTabs
              tabs={DETAIL_TABS}
              activeTab={tab}
              onChange={(nextTab) => {
                setTab(nextTab);
                syncUrl({ tab: nextTab });
              }}
            >
              {tab === "evolutie" ? (
                <VideoEvolutionPanel
                  loading={loading}
                  series={series}
                  range={range}
                  previousTotalViews={previousTotalViews}
                  periodLabel={periodLabel}
                  onClearFilters={() => {
                    setRange("7d");
                    syncUrl({ range: "7d" });
                  }}
                />
              ) : null}

              {tab === "interactiuni" ? (
                <section className="rounded-xl border border-slate-200 bg-white p-5">
                  <h2 className="text-lg font-semibold text-slate-900">Interacțiuni</h2>
                  <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-xl bg-slate-50 p-4">
                      <dt className="text-xs text-slate-500">Like-uri</dt>
                      <dd className="mt-1 text-2xl font-bold tabular-nums text-slate-900">
                        {likesCount}
                      </dd>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-4">
                      <dt className="text-xs text-slate-500">Rată de apreciere</dt>
                      <dd className="mt-1 text-2xl font-bold tabular-nums text-slate-900">
                        {appreciationRate}
                      </dd>
                      <p className="mt-1 text-xs text-slate-500">
                        like-uri / vizualizări totale
                      </p>
                    </div>
                  </dl>
                  <p className="mt-4 text-sm text-slate-500">
                    Istoric like-uri indisponibil — nu există serie zilnică pentru like-uri.
                  </p>
                </section>
              ) : null}

              {tab === "informatii" ? (
                <section className="rounded-xl border border-slate-200 bg-white p-5">
                  <h2 className="text-lg font-semibold text-slate-900">Informații</h2>
                  <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="text-xs text-slate-500">Platformă</dt>
                      <dd className="mt-0.5 font-medium text-slate-900">
                        {platformLabel(video?.platform)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-slate-500">Categorie</dt>
                      <dd className="mt-0.5 font-medium text-slate-900">
                        {video?.category || "—"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-slate-500">Status</dt>
                      <dd className="mt-0.5 font-medium text-slate-900">
                        {video?.isPublished ? "Public" : "Ascuns"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-slate-500">ID</dt>
                      <dd className="mt-0.5 font-mono text-xs text-slate-700">{videoId}</dd>
                    </div>
                  </dl>
                </section>
              ) : null}
            </VideoStatsTabs>
          </>
        )}
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
