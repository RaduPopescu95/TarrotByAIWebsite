import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useTranslation } from "next-i18next";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import PublicVideoThumbnail from "../../components/VideoLibrary/PublicVideoThumbnail";
import VideoPremiumThumbBadge from "../../components/VideoLibrary/VideoPremiumThumbBadge";
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

const skeletonShine =
  "bg-skeleton-shine bg-[length:200%_100%] animate-skeleton-shine";

function VideoDetailSkeleton() {
  return (
    <div className="space-y-6 xl:grid xl:grid-cols-[1fr_340px] xl:gap-10 xl:space-y-0">
      <div className="space-y-4">
        <div className={`aspect-video w-full rounded-xl ${skeletonShine}`} />
        <div className={`h-8 max-w-2xl rounded-lg ${skeletonShine}`} />
        <div className={`h-4 max-w-md rounded ${skeletonShine}`} />
        <div className={`h-24 max-w-3xl rounded-lg ${skeletonShine}`} />
      </div>
      <div className="hidden space-y-4 xl:block">
        <div className={`h-6 w-40 rounded ${skeletonShine}`} />
        {[1, 2, 3, 4].map((k) => (
          <div key={k} className="flex gap-3">
            <div className={`aspect-video w-36 shrink-0 rounded-lg ${skeletonShine}`} />
            <div className="flex flex-1 flex-col gap-2 pt-1">
              <div className={`h-4 w-full rounded ${skeletonShine}`} />
              <div className={`h-3 w-2/3 rounded ${skeletonShine}`} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function VideoDetailPage() {
  const router = useRouter();
  const { t } = useTranslation("common");
  const { currentUser, isGuestUser } = useAuth();
  const playerWrapRef = useRef(null);
  const [video, setVideo] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [fullscreenActive, setFullscreenActive] = useState(false);

  const videoIdRaw = router.query.videoId;
  const videoId = useMemo(
    () => (typeof videoIdRaw === "string" ? videoIdRaw : Array.isArray(videoIdRaw) ? videoIdRaw[0] : ""),
    [videoIdRaw]
  );

  const load = useCallback(async () => {
    if (!videoId) return;
    setLoading(true);
    setNotFound(false);
    setLoadError("");
    setVideo(null);
    setRelated([]);
    try {
      const locale = router.locale || "ro";
      const headers = await getFirebaseBearerHeader({ required: false });
      const res = await fetch(
        `/api/premium/video-library/${encodeURIComponent(videoId)}?locale=${encodeURIComponent(locale)}`,
        {
          headers: {
            Accept: "application/json",
            ...headers,
          },
        }
      );
      const data = await res.json().catch(() => ({}));
      if (res.status === 404) {
        setNotFound(true);
        return;
      }
      if (!res.ok) {
        throw new Error(data?.error || "load_failed");
      }
      setVideo(data?.video || null);
      setRelated(Array.isArray(data?.related) ? data.related : []);
    } catch (e) {
      console.error("[video-detail]", e?.message || e);
      setLoadError(t("videoLibraryLoadError"));
    } finally {
      setLoading(false);
    }
  }, [router.locale, t, videoId]);

  useEffect(() => {
    if (!router.isReady || !videoId) return;
    load();
  }, [load, router.isReady, videoId, currentUser?.uid]);

  useEffect(() => {
    const el = playerWrapRef.current;
    const sync = () => {
      setFullscreenActive(Boolean(document.fullscreenElement && document.fullscreenElement === el));
    };
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, [video?.id]);

  const toggleFullscreen = useCallback(async () => {
    const el = playerWrapRef.current;
    if (!el) return;
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await el.requestFullscreen();
      }
    } catch {
      /* noop */
    }
  }, []);

  const handleLockedIntent = useCallback(() => {
    const returnPath = router.asPath || `/videouri/${videoId}`;
    const signedIn = Boolean(currentUser) && !isGuestUser;
    if (!signedIn) {
      router.push(`/login/videoteca?returnUrl=${encodeURIComponent(returnPath)}`);
      return;
    }
    router.push("/abonament");
  }, [currentUser, isGuestUser, router, videoId]);

  const channelName = t("videoLibraryChannelName");
  const defaultTitle = t("videoLibrarySeoTitle");

  const pageTitle = video?.title ? `${video.title} | ${t("videoLibraryHeroTitle")}` : defaultTitle;
  const pageDesc =
    typeof video?.description === "string" && video.description.trim()
      ? video.description.trim().slice(0, 160)
      : t("videoLibrarySeoDesc");

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDesc} />
      </Head>
      <div className="min-h-screen bg-white">
        <Header />
        <div className="pb-14 pt-24 px-4 sm:px-6 sm:pt-28 lg:px-8 xl:px-12 lg:pt-24">
          <div className="mx-auto max-w-[1200px]">
            <Link
              href="/videouri"
              className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              <span aria-hidden>←</span>
              {t("videoLibraryBackToLibrary")}
            </Link>

            {loading ? (
              <VideoDetailSkeleton />
            ) : notFound ? (
              <p className="py-16 text-center text-slate-600">{t("videoLibraryNotFound")}</p>
            ) : loadError ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-8 text-center text-sm text-red-800">
                {loadError}
                <button
                  type="button"
                  className="mt-4 rounded-full bg-red-900 px-4 py-2 text-xs font-medium text-white hover:bg-red-800"
                  onClick={() => load()}
                >
                  {t("videoLibraryRetry")}
                </button>
              </div>
            ) : video ? (
              <div className="xl:grid xl:grid-cols-[1fr_380px] xl:items-start xl:gap-10">
                <div className="min-w-0">
                  <div
                    ref={playerWrapRef}
                    className="relative aspect-video w-full overflow-hidden rounded-xl bg-black"
                  >
                    {video.canPlay && video.embedSrc ? (
                      <>
                        <iframe
                          title={video.title}
                          src={video.embedSrc}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                          allowFullScreen
                          className="h-full w-full"
                        />
                        {video.isPremium ? (
                          <VideoPremiumThumbBadge label={t("videoLibraryPremiumCornerBadge")} />
                        ) : null}
                        <button
                          type="button"
                          onClick={() => toggleFullscreen()}
                          className="absolute right-3 top-3 z-10 rounded-lg bg-black/70 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm hover:bg-black/85"
                        >
                          {fullscreenActive
                            ? t("videoLibraryExitFullscreen")
                            : t("videoLibraryFullscreen")}
                        </button>
                      </>
                    ) : (
                      <div className="relative flex h-full flex-col items-center justify-center gap-4 bg-slate-900 px-6 text-center text-white">
                        {video.isPremium ? (
                          <VideoPremiumThumbBadge label={t("videoLibraryPremiumCornerBadge")} />
                        ) : null}
                        <PublicVideoThumbnail
                          src={video.thumbnailUrl}
                          imgClassName={
                            video.lockedReason === "source_invalid"
                              ? "absolute inset-0 h-full w-full object-cover opacity-30"
                              : "absolute inset-0 h-full w-full object-cover"
                          }
                          fallback={
                            <div
                              className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-950"
                              aria-hidden
                            />
                          }
                        />
                        {video.thumbnailUrl && video.lockedReason !== "source_invalid" ? (
                          <div className="absolute inset-0 bg-black/50" aria-hidden />
                        ) : null}
                        <div className="relative z-[1] max-w-md space-y-3">
                          {video.lockedReason === "source_invalid" ? (
                            <p className="text-sm font-medium text-slate-200">
                              {t("videoLibrarySourceMissing")}
                            </p>
                          ) : null}
                          {video.lockedReason !== "source_invalid" ? (
                            <div className="flex flex-wrap justify-center gap-2">
                              <button
                                type="button"
                                onClick={handleLockedIntent}
                                className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-100"
                              >
                                {Boolean(currentUser) && !isGuestUser
                                  ? t("videoLibrarySubscribeCta")
                                  : t("videoLibraryLoginCta")}
                              </button>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    )}
                  </div>

                  <h1 className="mt-5 text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
                    {video.title}
                  </h1>
                  <p className="mt-2 text-sm text-slate-600">
                    {[
                      channelName,
                      !video.isPremium ? t("videoLibraryBadgeFree") : t("videoLibraryBadgeSubscriber"),
                      typeof video.category === "string" && video.category.trim() ? video.category.trim() : null,
                      typeof video.durationSeconds === "number"
                        ? formatDuration(video.durationSeconds, "")
                        : null,
                    ]
                      .filter(Boolean)
                      .join(" • ")}
                  </p>
                  {video.description ? (
                    <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                      {video.description}
                    </p>
                  ) : null}
                </div>

                <aside className="mt-10 min-w-0 xl:mt-0 xl:border-l xl:border-slate-200 xl:pl-8">
                  <h2 className="mb-4 text-base font-semibold text-slate-900">{t("videoLibraryRelatedTitle")}</h2>
                  {related.length === 0 ? (
                    <p className="text-sm text-slate-500">{t("videoLibraryRelatedEmpty")}</p>
                  ) : (
                    <ul className="space-y-4">
                      {related.map((rv) => {
                        const thumb = rv.thumbnailUrl;
                        const dur =
                          typeof rv.durationSeconds === "number"
                            ? formatDuration(rv.durationSeconds, "")
                            : "";
                        return (
                          <li key={rv.id}>
                            <Link
                              href={`/videouri/${rv.id}`}
                              className="group flex gap-3 rounded-lg p-1 transition hover:bg-slate-50"
                            >
                              <div className="relative aspect-video w-36 shrink-0 overflow-hidden rounded-lg bg-slate-200">
                                <PublicVideoThumbnail
                                  src={thumb}
                                  imgClassName="h-full w-full object-cover transition group-hover:scale-[1.03]"
                                  fallback={
                                    <div className="flex h-full w-full items-center justify-center bg-slate-700 text-[10px] text-slate-400">
                                      {rv.platform || "video"}
                                    </div>
                                  }
                                />
                                {rv.isPremium ? (
                                  <VideoPremiumThumbBadge
                                    compact
                                    label={t("videoLibraryPremiumCornerBadge")}
                                  />
                                ) : null}
                                {dur ? (
                                  <span className="absolute bottom-1 right-1 rounded bg-black/75 px-1 py-px text-[10px] text-white">
                                    {dur}
                                  </span>
                                ) : null}
                              </div>
                              <div className="flex min-w-0 flex-1 flex-col justify-start pt-0.5">
                                <span className="line-clamp-2 text-sm font-medium leading-snug text-slate-900 group-hover:text-slate-700">
                                  {rv.title}
                                </span>
                              </div>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </aside>
              </div>
            ) : null}
          </div>
        </div>
        <Footer />
      </div>
    </>
  );
}
