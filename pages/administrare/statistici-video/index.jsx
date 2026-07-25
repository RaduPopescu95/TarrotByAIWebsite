import React, { useCallback, useEffect, useMemo, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import LocalPasswordGate from "../../../components/Dashboard/LocalPasswordGate";
import VideoStatsHeader from "../../../components/Dashboard/video-stats/VideoStatsHeader";
import VideoStatsFilters from "../../../components/Dashboard/video-stats/VideoStatsFilters";
import VideoStatsKpiGrid from "../../../components/Dashboard/video-stats/VideoStatsKpiGrid";
import VideoStatsTabs from "../../../components/Dashboard/video-stats/VideoStatsTabs";
import VideoEvolutionPanel from "../../../components/Dashboard/video-stats/VideoEvolutionPanel";
import TopVideosRanking from "../../../components/Dashboard/video-stats/TopVideosRanking";
import VideoStatsTable from "../../../components/Dashboard/video-stats/VideoStatsTable";
import VideoStatsEmptyState from "../../../components/Dashboard/video-stats/VideoStatsEmptyState";
import {
  LIST_TABS,
  PAGE_SIZE_OPTIONS,
  VALID_LIST_TABS,
  VALID_RANGES,
} from "../../../components/Dashboard/video-stats/videoStatsConstants";

function dashboardHeaders() {
  return { Accept: "application/json" };
}

function readQueryString(query, key, fallback = "") {
  return typeof query[key] === "string" ? query[key] : fallback;
}

function VideoViewsStatsScreen() {
  const router = useRouter();
  const [range, setRange] = useState("7d");
  const [tab, setTab] = useState("evolutie");
  const [platform, setPlatform] = useState("");
  const [category, setCategory] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sort, setSort] = useState("views");
  const [rows, setRows] = useState([]);
  const [series, setSeries] = useState([]);
  const [topVideos, setTopVideos] = useState([]);
  const [totalViews, setTotalViews] = useState(0);
  const [previousTotalViews, setPreviousTotalViews] = useState(0);
  const [avgViewsPerDay, setAvgViewsPerDay] = useState(0);
  const [videoCount, setVideoCount] = useState(0);
  const [topVideo, setTopVideo] = useState(null);
  const [seriesFromDay, setSeriesFromDay] = useState(null);
  const [seriesToDay, setSeriesToDay] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatedAtMs, setUpdatedAtMs] = useState(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (!router.isReady) return;
    const nextRange = readQueryString(router.query, "range", "7d");
    const nextTab = readQueryString(router.query, "tab", "evolutie");
    const nextPlatform = readQueryString(router.query, "platform", "");
    const nextCategory = readQueryString(router.query, "category", "");
    const nextSearch = readQueryString(router.query, "search", "");
    const nextSort = readQueryString(router.query, "sort", "views");
    const nextPage = Number(readQueryString(router.query, "page", "1")) || 1;
    const nextPageSize = Number(readQueryString(router.query, "pageSize", "20")) || 20;

    setRange(VALID_RANGES.has(nextRange) ? nextRange : "7d");
    setTab(VALID_LIST_TABS.has(nextTab) ? nextTab : "evolutie");
    setPlatform(nextPlatform);
    setCategory(nextCategory);
    setSearchInput(nextSearch);
    setAppliedSearch(nextSearch);
    setSort(nextSort === "title" ? "title" : "views");
    setPage(Math.max(1, nextPage));
    setPageSize(PAGE_SIZE_OPTIONS.includes(nextPageSize) ? nextPageSize : 20);
    setHydrated(true);
  }, [router.isReady, router.query]);

  const syncUrl = useCallback(
    (patch) => {
      if (!router.isReady) return;
      const next = {
        range,
        tab,
        platform,
        category,
        search: appliedSearch,
        page: String(page),
        pageSize: String(pageSize),
        sort,
        ...patch,
      };
      const query = {};
      if (next.range && next.range !== "7d") query.range = next.range;
      if (next.tab && next.tab !== "evolutie") query.tab = next.tab;
      if (next.platform) query.platform = next.platform;
      if (next.category) query.category = next.category;
      if (next.search) query.search = next.search;
      if (next.page && String(next.page) !== "1") query.page = String(next.page);
      if (next.pageSize && String(next.pageSize) !== "20") {
        query.pageSize = String(next.pageSize);
      }
      if (next.sort && next.sort !== "views") query.sort = next.sort;
      void router.replace({ pathname: "/administrare/statistici-video", query }, undefined, {
        shallow: true,
      });
    },
    [appliedSearch, category, page, pageSize, platform, range, router, sort, tab]
  );

  const apiQueryString = useMemo(() => {
    const params = new URLSearchParams({ range });
    if (platform) params.set("platform", platform);
    if (appliedSearch.trim()) params.set("search", appliedSearch.trim());
    return params.toString();
  }, [appliedSearch, platform, range]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/dashboard/video-views?${apiQueryString}`, {
        headers: dashboardHeaders(),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error || "Datele nu au putut fi încărcate.");
      setRows(Array.isArray(data?.rows) ? data.rows : []);
      setSeries(Array.isArray(data?.series) ? data.series : []);
      setTopVideos(Array.isArray(data?.topVideos) ? data.topVideos : []);
      setTotalViews(Number(data?.totalViews) || 0);
      setPreviousTotalViews(Number(data?.previousTotalViews) || 0);
      setAvgViewsPerDay(Number(data?.avgViewsPerDay) || 0);
      setVideoCount(Number(data?.videoCount) || 0);
      setTopVideo(data?.topVideo || null);
      setSeriesFromDay(data?.seriesFromDay || null);
      setSeriesToDay(data?.seriesToDay || null);
      setUpdatedAtMs(Date.now());
    } catch (loadError) {
      setError(loadError?.message || "Datele nu au putut fi încărcate.");
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
  }, [apiQueryString]);

  useEffect(() => {
    if (!hydrated) return;
    void load();
  }, [hydrated, load]);

  const categories = useMemo(() => {
    const set = new Set();
    for (const row of rows) {
      if (row?.category) set.add(row.category);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, "ro"));
  }, [rows]);

  const filteredRows = useMemo(() => {
    if (!category) return rows;
    return rows.filter((row) => row.category === category);
  }, [category, rows]);

  const filteredTopVideos = useMemo(() => {
    if (!category) return topVideos;
    const allowed = new Set(filteredRows.map((row) => row.videoId));
    return topVideos.filter((item) => allowed.has(item.videoId));
  }, [category, filteredRows, topVideos]);

  const seriesViews = useMemo(
    () => series.reduce((sum, point) => sum + (Number(point.views) || 0), 0),
    [series]
  );

  const periodLabel =
    seriesFromDay && seriesToDay
      ? seriesFromDay === seriesToDay
        ? seriesFromDay
        : `${seriesFromDay} → ${seriesToDay}`
      : "—";

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

  const clearFilters = () => {
    setPlatform("");
    setCategory("");
    setSearchInput("");
    setAppliedSearch("");
    setPage(1);
    syncUrl({
      platform: "",
      category: "",
      search: "",
      page: "1",
    });
  };

  const displayVideoCount = category
    ? filteredRows.filter((row) => (Number(row.viewsCount) || 0) > 0).length
    : videoCount;

  const displayTopVideo = category
    ? filteredTopVideos[0]
      ? {
          videoId: filteredTopVideos[0].videoId,
          title: filteredTopVideos[0].title,
          viewsCount: filteredTopVideos[0].viewsCount,
        }
      : null
    : topVideo;

  if (!hydrated) {
    return <div className="min-h-screen bg-slate-50" />;
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-5">
        <VideoStatsHeader
          updatedAtMs={updatedAtMs}
          loading={loading}
          onRefresh={() => void load()}
        />

        <VideoStatsFilters
          range={range}
          platform={platform}
          category={category}
          searchInput={searchInput}
          categories={categories}
          onRangeChange={(value) => {
            setRange(value);
            setPage(1);
            syncUrl({ range: value, page: "1" });
          }}
          onPlatformChange={(value) => {
            setPlatform(value);
            setPage(1);
            syncUrl({ platform: value, page: "1" });
          }}
          onCategoryChange={(value) => {
            setCategory(value);
            setPage(1);
            syncUrl({ category: value, page: "1" });
          }}
          onSearchInputChange={setSearchInput}
          onSearchApply={(value) => {
            const next = typeof value === "string" ? value.trim() : "";
            setAppliedSearch(next);
            setSearchInput(next);
            setPage(1);
            syncUrl({ search: next, page: "1" });
          }}
          onClearFilters={clearFilters}
        />

        {error ? (
          <VideoStatsEmptyState
            title="Datele nu au putut fi încărcate."
            description={error}
            primaryLabel="Încearcă din nou"
            onPrimary={() => void load()}
          />
        ) : (
          <>
            <VideoStatsKpiGrid
              loading={loading}
              range={range}
              totalViews={totalViews}
              previousTotalViews={previousTotalViews}
              seriesViews={seriesViews}
              videoCount={displayVideoCount}
              avgViewsPerDay={avgViewsPerDay}
              topVideo={displayTopVideo}
            />

            <VideoStatsTabs
              tabs={LIST_TABS}
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
                  onClearFilters={clearFilters}
                />
              ) : null}
              {tab === "clasament" ? (
                <TopVideosRanking
                  loading={loading}
                  topVideos={filteredTopVideos}
                  rows={filteredRows}
                  onOpenDetail={openVideoDetail}
                  onClearFilters={clearFilters}
                />
              ) : null}
              {tab === "videoclipuri" ? (
                <VideoStatsTable
                  loading={loading}
                  rows={filteredRows}
                  page={page}
                  pageSize={pageSize}
                  sort={sort}
                  onPageChange={(nextPage) => {
                    setPage(nextPage);
                    syncUrl({ page: String(nextPage) });
                  }}
                  onPageSizeChange={(nextSize) => {
                    setPageSize(nextSize);
                    setPage(1);
                    syncUrl({ pageSize: String(nextSize), page: "1" });
                  }}
                  onSortChange={(nextSort) => {
                    setSort(nextSort);
                    setPage(1);
                    syncUrl({ sort: nextSort, page: "1" });
                  }}
                  onOpenDetail={openVideoDetail}
                  onClearFilters={clearFilters}
                />
              ) : null}
            </VideoStatsTabs>
          </>
        )}
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
