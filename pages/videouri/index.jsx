import React, { useCallback, useEffect, useMemo, useState } from "react";
import Head from "next/head";
import Image from "next/image";
import { useRouter } from "next/router";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useTranslation } from "next-i18next";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { useAuth } from "../../context/AuthContext";
import { getFirebaseBearerHeader } from "../../utils/firebaseAuthHeaders";

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common"])),
    },
  };
}

function formatDuration(seconds, fallback) {
  if (typeof seconds !== "number" || !Number.isFinite(seconds) || seconds < 1) return fallback;
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

const skeletonBg =
  "bg-skeleton-shine bg-[length:200%_100%] animate-skeleton-shine";

function VideoLibrarySkeletonGrid({ loadingLabel }) {
  const placeholders = Array.from({ length: 12 }, (_, i) => `sk-${i}`);
  return (
    <div
      className="mx-auto grid w-full max-w-[1920px] grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      aria-busy="true"
      role="status"
    >
      <span className="sr-only">{loadingLabel}</span>
      {placeholders.map((key) => (
        <div key={key} className="flex flex-col">
          <div className={`aspect-video w-full rounded-xl ${skeletonBg}`} />
          <div className="mt-3 flex gap-3">
            <div className={`h-9 w-9 shrink-0 rounded-full ${skeletonBg}`} />
            <div className="min-w-0 flex-1 space-y-2 pt-0.5">
              <div className={`h-3.5 w-full rounded-md sm:h-4 ${skeletonBg}`} />
              <div className={`h-3.5 w-[80%] rounded-md sm:h-4 ${skeletonBg}`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function VideoLibraryPage() {
  const router = useRouter();
  const { t } = useTranslation("common");
  const { currentUser, isGuestUser } = useAuth();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const locale = router.locale || "ro";
      const authHeaders = await getFirebaseBearerHeader({ required: false });
      const res = await fetch(
        `/api/premium/video-library?locale=${encodeURIComponent(locale)}`,
        {
          headers: {
            Accept: "application/json",
            ...authHeaders,
          },
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || "load_failed");
      }
      setVideos(Array.isArray(data?.videos) ? data.videos : []);
    } catch (e) {
      console.error("[video-library]", e?.message || e);
      setError(t("videoLibraryLoadError"));
      setVideos([]);
    } finally {
      setLoading(false);
    }
  }, [router.locale, t]);

  useEffect(() => {
    load();
  }, [load, currentUser?.uid]);

  const categories = useMemo(() => {
    const set = new Set();
    videos.forEach((v) => {
      const c = typeof v.category === "string" ? v.category.trim() : "";
      if (c) set.add(c);
    });
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [videos]);

  const categoryFilteredVideos = useMemo(() => {
    if (!selectedCategory) return videos;
    return videos.filter((v) => (typeof v.category === "string" ? v.category.trim() : "") === selectedCategory);
  }, [videos, selectedCategory]);

  const normalizedSearch = searchQuery.trim().toLowerCase();

  const filteredVideos = useMemo(() => {
    if (!normalizedSearch) return categoryFilteredVideos;
    return categoryFilteredVideos.filter((v) => {
      const title = (v.title || "").toLowerCase();
      const desc = (typeof v.description === "string" ? v.description : "").toLowerCase();
      const cat = (typeof v.category === "string" ? v.category : "").toLowerCase();
      return title.includes(normalizedSearch) || desc.includes(normalizedSearch) || cat.includes(normalizedSearch);
    });
  }, [categoryFilteredVideos, normalizedSearch]);

  const gridClass =
    filteredVideos.length === 0 && videos.length > 0
      ? ""
      : "mx-auto grid w-full max-w-[1920px] grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";

  const handleVideoIntent = useCallback(
    (v) => {
      if (v.canPlay && v.embedSrc) {
        router.push(`/videouri/${v.id}`);
        return;
      }
      if (v.lockedReason === "source_invalid") return;

      const returnPath = router.asPath || "/videouri";
      const signedIn = Boolean(currentUser) && !isGuestUser;
      if (!signedIn) {
        router.push(`/login/videoteca?returnUrl=${encodeURIComponent(returnPath)}`);
        return;
      }
      router.push("/abonament");
    },
    [currentUser, isGuestUser, router],
  );

  const channelName = t("videoLibraryChannelName");

  return (
    <>
      <Head>
        <title>{t("videoLibrarySeoTitle")}</title>
        <meta name="description" content={t("videoLibrarySeoDesc")} />
      </Head>
      <div className="min-h-screen bg-white">
        <Header />
        <div className="pb-12 pt-24 px-4 sm:px-6 sm:pt-28 lg:px-8 xl:px-12 lg:pt-24">
          <div className="mx-auto w-full max-w-[1920px]">
            <main className="min-w-0">
              <div className="mb-6 flex flex-col gap-2 sm:gap-3 lg:mb-5">
                <h1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
                  {t("videoLibraryHeroTitle")}
                </h1>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <div className="w-full max-w-md">
                    <label htmlFor="video-library-search" className="sr-only">
                      {t("videoLibrarySearchLabel")}
                    </label>
                    <div className="relative">
                      <svg
                        className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden
                      >
                        <circle cx="11" cy="11" r="8" />
                        <path d="m21 21-4.35-4.35" />
                      </svg>
                      <input
                        id="video-library-search"
                        type="search"
                        enterKeyHint="search"
                        autoComplete="off"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        disabled={loading}
                        placeholder={t("videoLibrarySearchPlaceholder")}
                        className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-11 pr-10 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-70"
                      />
                      {searchQuery.trim() ? (
                        <button
                          type="button"
                          onClick={() => setSearchQuery("")}
                          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                          aria-label={t("videoLibrarySearchClear")}
                        >
                          ×
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>

              {loading ? (
                <VideoLibrarySkeletonGrid loadingLabel={t("videoLibraryLoading")} />
              ) : error ? (
                <div className="max-w-md rounded-xl border border-red-200 bg-red-50 px-6 py-5 text-center text-sm text-red-800">
                  {error}
                  <button
                    type="button"
                    className="mt-4 rounded-full bg-red-900 px-4 py-2 text-xs font-medium text-white transition hover:bg-red-800"
                    onClick={() => load()}
                  >
                    {t("videoLibraryRetry")}
                  </button>
                </div>
              ) : videos.length === 0 ? (
                <p className="py-12 text-center text-slate-600">{t("videoLibraryEmpty")}</p>
              ) : (
                <>
                  <div className="-mx-4 mb-6 flex gap-2 overflow-x-auto pb-2 pl-4 pr-4 sm:-mx-0 sm:pl-0 sm:pr-0">
                    <button
                      type="button"
                      onClick={() => setSelectedCategory(null)}
                      className={`shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition ${
                        selectedCategory === null
                          ? "bg-slate-900 text-white"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      {t("videoLibraryChipAll")}
                    </button>
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSelectedCategory(cat)}
                        className={`shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition ${
                          selectedCategory === cat
                            ? "bg-slate-900 text-white"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  {filteredVideos.length === 0 ? (
                    <p className="py-12 text-center text-slate-600">
                      {normalizedSearch ? t("videoLibrarySearchNoResults") : t("videoLibraryFilteredEmpty")}
                    </p>
                  ) : (
                    <div className={gridClass}>
                      {filteredVideos.map((v) => {
                        const durationLabel =
                          typeof v.durationSeconds === "number"
                            ? formatDuration(v.durationSeconds, "")
                            : "";
                        const accessLabel = !v.isPremium
                          ? t("videoLibraryBadgeFree")
                          : t("videoLibraryBadgeSubscriber");

                        return (
                          <article key={v.id} className="group flex flex-col">
                            <button
                              type="button"
                              disabled={
                                !(v.canPlay && v.embedSrc) && v.lockedReason === "source_invalid"
                              }
                              className={`relative aspect-video w-full overflow-hidden rounded-xl bg-slate-200 text-left ${
                                v.canPlay && v.embedSrc
                                  ? "cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
                                  : v.lockedReason === "source_invalid"
                                    ? "cursor-not-allowed"
                                    : "cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
                              }`}
                              onClick={() => handleVideoIntent(v)}
                              aria-label={v.title}
                            >
                              {v.thumbnailUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={v.thumbnailUrl}
                                  alt=""
                                  className={
                                    v.canPlay && v.embedSrc
                                      ? "h-full w-full object-cover transition duration-200 group-hover:scale-[1.02]"
                                      : "h-full w-full object-cover"
                                  }
                                />
                              ) : (
                                <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-slate-700 to-slate-900 text-slate-400">
                                  <svg
                                    className="h-12 w-12 opacity-50"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.25"
                                    aria-hidden
                                  >
                                    <rect x="2" y="4" width="20" height="16" rx="2" />
                                    <path d="M10 9l6 3-6 3V9z" fill="currentColor" stroke="none" />
                                  </svg>
                                  <span className="text-[10px] uppercase tracking-[0.2em]">
                                    {v.platform === "bunny"
                                      ? "Bunny"
                                      : v.platform === "vimeo"
                                        ? "Vimeo"
                                        : "YouTube"}
                                  </span>
                                </div>
                              )}
                              {durationLabel ? (
                                <span className="absolute bottom-1.5 right-1.5 z-10 rounded bg-black/80 px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-white">
                                  {durationLabel}
                                </span>
                              ) : null}
                              {v.lockedReason === "source_invalid" && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-950/55 px-4 text-center backdrop-blur-[1px]">
                                  <p className="max-w-[12rem] text-xs font-medium text-amber-50">
                                    {t("videoLibrarySourceMissing")}
                                  </p>
                                </div>
                              )}
                              {v.canPlay && v.embedSrc && (
                                <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/35 opacity-0 transition group-hover:opacity-100">
                                  <span className="rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-slate-900 shadow-lg">
                                    {t("videoLibraryPlay")}
                                  </span>
                                </div>
                              )}
                            </button>

                            <div className="mt-3 flex gap-3">
                              <div
                                className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200"
                                aria-hidden
                              >
                                <Image
                                  src="/LogoPngTransparent.png"
                                  alt=""
                                  width={36}
                                  height={36}
                                  className="object-contain p-1"
                                />
                              </div>
                              <div className="min-w-0 flex-1">
                                {v.canPlay && v.embedSrc ? (
                                  <button
                                    type="button"
                                    onClick={() => router.push(`/videouri/${v.id}`)}
                                    className="line-clamp-2 block w-full text-left text-sm font-medium leading-snug text-slate-900 hover:text-slate-700"
                                  >
                                    {v.title}
                                  </button>
                                ) : v.lockedReason === "source_invalid" ? (
                                  <h2 className="line-clamp-2 text-sm font-medium leading-snug text-slate-900">
                                    {v.title}
                                  </h2>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleVideoIntent(v)}
                                    className="line-clamp-2 block w-full text-left text-sm font-medium leading-snug text-slate-900 hover:text-slate-700"
                                  >
                                    {v.title}
                                  </button>
                                )}
                                <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-600">
                                  {[channelName, accessLabel, v.category || null].filter(Boolean).join(" • ")}
                                </p>
                              </div>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </main>
          </div>
        </div>
        <Footer />
      </div>
    </>
  );
}
