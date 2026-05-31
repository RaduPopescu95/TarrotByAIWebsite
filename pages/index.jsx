import Head from "next/head";
import Link from "next/link";
import Header from "../components/Header";
import Headline from "../components/Blog/Headline";
import PostCard from "../components/Cards/PostCard";
import Sidebar from "../components/Blog/Sidebar";
import { useState } from "react";
import { useEffect } from "react";
import { Fragment } from "react";
import { handleGetArticles } from "../utils/realtimeUtils";
import { useRouter } from "next/router";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useTranslation } from "next-i18next";
import {
  handleGetFirestore,
  handleQueryFirestore,
} from "../utils/firestoreUtils";
import { useAuth } from "../context/AuthContext";
import { useApiData } from "../context/ApiContext";
import FilterBar from "../components/Blog/FilterBar/FilterBar";
import { buildArticleHref } from "../utils/commonUtils";
import Footer from "../components/Footer";
import PublicVideoThumbnail from "../components/VideoLibrary/PublicVideoThumbnail";
import VideoPremiumThumbBadge from "../components/VideoLibrary/VideoPremiumThumbBadge";
import CourseCard from "../components/Courses/CourseCard";
import HeadlineConsultatii from "../components/Blog/HeadlineConsultatii";
import { loadContentHome } from "../lib/loadContentHome";
import { usePaginatedArticleGrid } from "../hooks/usePaginatedArticleGrid";

const HOME_VIDEO_PREVIEW_LIMIT = 6;

function formatVideoDuration(seconds, fallback) {
  if (typeof seconds !== "number" || !Number.isFinite(seconds) || seconds < 1) return fallback;
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function toTimestampMs(value) {
  if (!value) return null;
  if (typeof value === "string" || typeof value === "number") {
    const ms = Date.parse(String(value));
    return Number.isFinite(ms) ? ms : null;
  }
  if (typeof value?.toDate === "function") {
    const ms = value.toDate()?.getTime?.();
    return Number.isFinite(ms) ? ms : null;
  }
  if (typeof value?.toMillis === "function") {
    const ms = value.toMillis();
    return Number.isFinite(ms) ? ms : null;
  }
  if (typeof value?.seconds === "number") return value.seconds * 1000;
  if (typeof value?._seconds === "number") return value._seconds * 1000;
  return null;
}

function parseLegacyDateTimeMs(dateRaw, timeRaw) {
  if (typeof dateRaw !== "string" || !dateRaw.trim()) return null;
  const normalized = dateRaw.trim().replace(/[./]/g, "-");
  const [p1, p2, p3] = normalized.split("-");
  if (!p1 || !p2 || !p3) return null;
  const n1 = Number.parseInt(p1, 10);
  const n2 = Number.parseInt(p2, 10);
  const n3 = Number.parseInt(p3, 10);
  if (![n1, n2, n3].every(Number.isFinite)) return null;
  const [hourPart = "0", minutePart = "0"] =
    typeof timeRaw === "string" ? timeRaw.split(":") : ["0", "0"];
  const hour = Number.parseInt(hourPart, 10);
  const minute = Number.parseInt(minutePart, 10);
  const safeHour = Number.isFinite(hour) ? hour : 0;
  const safeMinute = Number.isFinite(minute) ? minute : 0;
  const yearFirst = p1.length === 4;
  const year = yearFirst ? n1 : n3;
  const month = n2;
  const day = yearFirst ? n3 : n1;
  const dateValue = new Date(year, month - 1, day, safeHour, safeMinute, 0, 0);
  const ms = dateValue.getTime();
  return Number.isFinite(ms) ? ms : null;
}

function getArticleSortMs(article) {
  return (
    toTimestampMs(article?.scheduledAtTs) ??
    toTimestampMs(article?.firstUploadTimestamp) ??
    parseLegacyDateTimeMs(article?.dataProgramata, article?.timpProgramat) ??
    parseLegacyDateTimeMs(article?.firstUploadDate, article?.firstUploadtime) ??
    0
  );
}

function buildArticlesPreview(articlesData = []) {
  if (!Array.isArray(articlesData) || articlesData.length === 0) {
    return {
      articlesData: [],
      latestArticles: [],
      lastArticle: [],
      latestFiveArticles: [],
    };
  }
  const sortedArticles = [...articlesData];
  return {
    articlesData,
    latestArticles: sortedArticles.slice(0, 2),
    lastArticle: sortedArticles[0],
    latestFiveArticles: sortedArticles.slice(0, 5),
  };
}

export async function getServerSideProps({ locale }) {
  let articlesData = [];
  let lastVisibleId = null;
  let homeVideosPreview = [];
  try {
    const payload = await loadContentHome({
      locale,
      articlesLimit: 4,
      videosLimit: HOME_VIDEO_PREVIEW_LIMIT,
      client: "web",
    });
    articlesData = Array.isArray(payload?.articles) ? payload.articles : [];
    lastVisibleId = typeof payload?.nextCursor === "string" ? payload.nextCursor : null;
    homeVideosPreview = Array.isArray(payload?.videos) ? payload.videos : [];
  } catch (error) {
    console.error("[index getServerSideProps] content.home failed", error?.message || error);
  }

  return {
    props: {
      articles: buildArticlesPreview(articlesData),
      lastVisibleId,
      homeVideosPreview,
      ...(await serverSideTranslations(locale, ["common"])),
    },
  };
}

function getCourseGridClass(courseCount = 0) {
  if (courseCount <= 1) {
    return "mx-auto grid w-full max-w-5xl grid-cols-1 gap-7";
  }
  if (courseCount === 2) {
    return "mx-auto grid w-full max-w-6xl grid-cols-1 gap-7 md:grid-cols-2";
  }
  if (courseCount === 3) {
    return "mx-auto grid w-full max-w-[96rem] grid-cols-1 gap-7 md:grid-cols-2 xl:grid-cols-3";
  }
  return "mx-auto grid w-full max-w-[120rem] grid-cols-1 gap-7 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4";
}

function Landing(props) {
  const { currentUser, isGuestUser } = useAuth();
  const {
    oreNorocoase,
    numereNorocoase,
    culoriNorocoase,
    citateMotivationale,
    categoriiViitor,
    cartiViitor,
    categoriiPersonalizate,
    cartiPersonalizate,
    loading,
    varianteCarti,
    error,
    fetchData,
    zilnicCitateMotivationale,
    blogData,
  } = useApiData();
  const { t, i18n } = useTranslation("common");

  const { articles, homeVideosPreview = [], lastVisibleId } = props;

  const router = useRouter();

  const handleHomeVideoIntent = (v) => {
    if (v.canPlay && v.embedSrc) {
      router.push(`/videouri/${v.id}`);
      return;
    }
    if (v.lockedReason === "source_invalid") return;
    const returnPath = router.asPath || "/";
    const signedIn = Boolean(currentUser) && !isGuestUser;
    if (!signedIn) {
      router.push(`/login/videoteca?returnUrl=${encodeURIComponent(returnPath)}`);
      return;
    }
    router.push("/abonament");
  };

  const currentLanguage = i18n.language || 'ro';

  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL || "https://cristinazurba.com";

  // In your component
  const currentUrl = `${baseUrl}${router.asPath || ""}`;

  const itemsPerPage = 4;

  const {
    filterItem,
    currentPage,
    articlesToDisplay,
    isGridLoading,
    canGoNext,
    canGoPrev,
    totalLoadedCount,
    loadedPageCount,
    handleFilter,
    handleNextPage,
    handlePrevPage,
  } = usePaginatedArticleGrid({
    locale: router.locale || "ro",
    pageSize: itemsPerPage,
    featuredCount: 0,
    initialFeaturedArticles: [],
    initialGridArticles: articles.articlesData || [],
    initialGridCursor: lastVisibleId,
    getSortMs: getArticleSortMs,
  });
  const [homeCoursesLoading, setHomeCoursesLoading] = useState(true);
  const [homeCoursesError, setHomeCoursesError] = useState("");
  const [homeCourses, setHomeCourses] = useState({
    latestCourses: [],
    featuredCourses: [],
  });
  const hasAnyHomeCourses =
    homeCourses.latestCourses.length > 0 || homeCourses.featuredCourses.length > 0;
  const shouldRenderHomeCoursesSection =
    homeCoursesLoading || Boolean(homeCoursesError) || hasAnyHomeCourses;
  const latestCourseCardsGridClass = getCourseGridClass(homeCourses.latestCourses.length);
  const featuredCourseCardsGridClass = getCourseGridClass(homeCourses.featuredCourses.length);

  useEffect(() => {
    let mounted = true;

    const loadHomeCourses = async () => {
      setHomeCoursesLoading(true);
      setHomeCoursesError("");
      try {
        const locale = router.locale || "ro";
        const response = await fetch(`/api/courses/home?locale=${encodeURIComponent(locale)}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(data?.error || "home_courses_failed");
        }

        const latestCourses = Array.isArray(data?.latestCourses) ? data.latestCourses : [];
        const featuredCourses = Array.isArray(data?.featuredCourses) ? data.featuredCourses : [];

        if (mounted) {
          setHomeCourses({ latestCourses, featuredCourses });
        }
      } catch (err) {
        console.error("[home.courses] load_fail", {
          locale: router.locale || "ro",
          message: err?.message || "unknown_error",
        });
        if (mounted) {
          setHomeCourses({ latestCourses: [], featuredCourses: [] });
          setHomeCoursesError(t("coursesHomeError"));
        }
      } finally {
        if (mounted) setHomeCoursesLoading(false);
      }
    };

    loadHomeCourses();
    return () => {
      mounted = false;
    };
  }, [router.locale, t]);

  // Loading state component
  const LoadingSpinner = () => (
    <div style={styles.loadingContainer}>
      <div style={styles.spinner}></div>
    </div>
  );

  // Mobile detection is now handled via CSS media queries

  return (
    <Fragment>
      <Head>
        <title>News | Cristina Zurba</title>
        <meta
          name="description"
          content="Embark on a journey of self-discovery with Cristina Zurba's News. These tailored readings offer insights into your personal growth, challenges, and potential. Ideal for individuals seeking guidance and deeper understanding of their personal journey."
        />
        <meta property="og:url" content={currentUrl} />
        <meta property="og:title" content="News | Cristina Zurba" />
        <meta
          property="og:description"
          content="Embark on a journey of self-discovery with Cristina Zurba's News. These tailored readings offer insights into your personal growth, challenges, and potential. Ideal for individuals seeking guidance and deeper understanding of their personal journey."
        />
        <meta
          property="og:image"
          content="https://cristinazurba.com/images/social-share.jpg"
        />
        <meta name="format-detection" content="telephone=no" />
      </Head>

      {/* Main wrapper with modern design */}
      <div style={styles.mainWrapper}>
        {/* Header section */}
        <Header />

        {/* Stunning Tailwind Hero Section */}
        <section className="relative min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 overflow-hidden">
          {/* Animated Background Elements */}
          <div className="absolute inset-0">
            <div className="absolute top-10 left-10 w-72 h-72 bg-gradient-to-r from-indigo-400/20 to-purple-400/20 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
            <div className="absolute top-10 right-10 w-72 h-72 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
            <div className="absolute -bottom-8 left-20 w-72 h-72 bg-gradient-to-r from-pink-400/20 to-indigo-400/20 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
          </div>

          {/* Floating Geometric Shapes */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-1/4 left-1/4 w-4 h-4 bg-indigo-500/30 rounded-full animate-float"></div>
            <div className="absolute top-1/3 right-1/3 w-6 h-6 bg-purple-500/30 rounded-full animate-float animation-delay-1000"></div>
            <div className="absolute bottom-1/4 left-1/3 w-3 h-3 bg-pink-500/30 rounded-full animate-float animation-delay-2000"></div>
            <div className="absolute top-1/2 right-1/4 w-5 h-5 bg-indigo-400/30 transform rotate-45 animate-float animation-delay-3000"></div>
          </div>

          {/* Main Hero Content */}
          <div className="relative z-10 container mx-auto px-6 pt-28 pb-20">
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              
              {/* Hero Header with Stunning Typography */}
              <div className="text-center lg:text-left mb-16 lg:mb-0">
                <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 backdrop-blur-lg border border-white/30 rounded-full mb-8 shadow-lg">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
                  <span className="text-indigo-700 font-semibold tracking-wide">{t("spiritualGuidance")}</span>
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse animation-delay-500"></div>
                </div>
                
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 mb-4 leading-none whitespace-nowrap">
                  Cristina Zurba
                </h1>
                
                <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed font-light">
                  {t("discoverSpiritualWisdom")}
                </p>

                {/* Animated CTA Buttons */}
                <div className="max-w-5xl mx-auto mt-12 space-y-6">
                  <Link
                    href="/videouri"
                    className="group relative flex w-full items-center justify-center px-8 py-4 bg-gradient-to-r from-fuchsia-600 to-violet-700 text-white font-bold rounded-2xl transform transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-fuchsia-500/30 text-decoration-none shadow-lg ring-2 ring-white/25"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-700 to-violet-800 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <span className="relative flex items-center justify-center gap-2 text-center leading-tight">
                      <i className="fa fa-play-circle" aria-hidden />
                      {t("homeHeroVideoLibrary")}
                    </span>
                  </Link>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-6">
                  
                  {/* Ședințe individuale */}
                  <Link href="/calendar" className="group relative px-8 py-4 sm:col-span-1 lg:col-span-2 lg:order-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold rounded-2xl transform transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-indigo-500/25 text-decoration-none">
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-700 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <span className="relative flex items-center justify-center text-center leading-tight whitespace-normal">
{t("individualSessions")}
                    </span>
                  </Link>
                  
                  {/* Cursuri/Conferințe LIVE */}
                  <Link href="/calendar-conferinte-grup" className="group relative px-8 py-4 sm:col-span-1 lg:col-span-3 lg:order-1 bg-gradient-to-r from-purple-500 to-pink-600 text-white font-bold rounded-2xl transform transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/25 text-decoration-none">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-700 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <span className="relative flex items-center justify-center text-center leading-tight whitespace-normal">
{t("conferencesCoursesLive")}
                    </span>
                  </Link>

                  {/* Cursuri/Conferințe înregistrate */}
                  <Link href="/courses" className="group relative px-8 py-4 sm:col-span-2 lg:col-span-3 lg:order-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold rounded-2xl transform transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-amber-500/25 text-decoration-none">
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-600 to-orange-700 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <span className="relative flex items-center justify-center text-center leading-tight whitespace-normal">
                      {t("conferencesCoursesRecorded")}
                    </span>
                  </Link>
                  
                  {/* Articole */}
                  <Link href="/news" className="group relative px-8 py-4 sm:col-span-1 lg:col-span-2 lg:order-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-2xl transform transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-cyan-500/25 text-decoration-none">
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-blue-700 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <span className="relative flex items-center justify-center text-center leading-tight whitespace-normal">
                      {t("articles")}
                    </span>
                  </Link>
                  
                  {/* Citiri instant */}
                  <Link href="/main-dashboard" className="group relative px-8 py-4 sm:col-span-1 lg:col-span-2 lg:order-5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold rounded-2xl transform transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-emerald-500/25 text-decoration-none">
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-700 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <span className="relative flex items-center justify-center text-center leading-tight whitespace-normal">
                      {t("instantReadings")}
                    </span>
                  </Link>
                  
                  </div>
                </div>
              </div>
                             {/* Right column – Hero image */}
               <div className="flex justify-center lg:justify-end">
                 <img src="/icon.png" alt="Cristina Zurba" className="w-64 h-64 lg:w-80 lg:h-80 rounded-full border-4 border-white shadow-2xl object-cover" />
               </div>
            </div>
          </div>


        </section>
        {/* Modern Blog Content Area */}
        <main style={styles.contentWrapper}>
            {articles.articlesData.length > 0 ? (
              <>



                                {/* Tailwind Blog Layout */}
                <section className="py-16 bg-gray-50">
                  <div className="max-w-7xl mx-auto px-4">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                      {/* Main Articles Area */}
                      <div className="lg:col-span-8 col-span-12">
                      {/* Section Header with Statistics */}
                      <div className="mb-12 pb-8 border-b-2 border-gray-100">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-6">
                          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">
                            {t("allArticles")}
                          </h2>
                          <div className="flex items-center gap-6">
                            <div className="flex flex-col items-center">
                              <span className="text-2xl font-bold text-indigo-600 leading-none">{totalLoadedCount}</span>
                              <span className="text-sm text-gray-500 font-medium uppercase tracking-wide">{t("articles")}</span>
                  </div>
                            <div className="w-px h-10 bg-gray-200"></div>
                            <div className="flex flex-col items-center">
                              <span className="text-2xl font-bold text-indigo-600 leading-none">{loadedPageCount}{canGoNext ? "+" : ""}</span>
                              <span className="text-sm text-gray-500 font-medium uppercase tracking-wide">{t("pages")}</span>
                  </div>
                  </div>
                        </div>
                        {filterItem !== "All" && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
                            <span className="text-blue-800">{t("activeFilter")}: <strong>{t(filterItem)}</strong></span>
                            <button 
                              onClick={() => handleFilter("All")}
                              className="px-3 py-1 text-sm font-medium text-blue-600 border border-blue-600 rounded-full hover:bg-blue-600 hover:text-white transition-colors duration-200"
                            >
                              {t("clearFilter")}
                            </button>
                        </div>
                        )}
                  </div>
                      {/* Featured Article + Other Articles Grid */}
                      <div className="mb-16 space-y-8">
                        {/* Featured Article - Full Width */}
                        {articlesToDisplay && articlesToDisplay.length > 0 && (
                          <div className="group relative transform transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:-translate-y-3 hover:shadow-amber-200/30">
                            {/* Floating Elements */}
                            <div className="absolute -top-6 -right-6 w-24 h-24 bg-gradient-to-br from-amber-400/20 to-orange-400/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-all duration-700 group-hover:scale-150"></div>
                            <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-gradient-to-br from-orange-400/15 to-red-400/15 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-700 delay-200 group-hover:scale-125"></div>
                            
                            {/* Featured Badge */}
                            <div className="absolute top-4 right-4 z-20">
                              <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 text-white rounded-full shadow-lg text-xs font-bold">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                                {t("featuredArticle")}
                              </div>
                            </div>
                            
                            <Headline newestArticle={articlesToDisplay[0]} isRo={false} />
                            
                            {/* Animated Bottom Border */}
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left rounded-b-2xl"></div>
                            
                            {/* Shine Effect */}
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 translate-x-full group-hover:-translate-x-full transition-transform duration-1000"></div>
                            </div>
                          </div>
                        )}
                        
                        {/* Other Articles Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {articlesToDisplay &&
                            articlesToDisplay.slice(1).map((article, index) => {
                              return (
                                <div key={index + 1} className="group h-full">
                                  <div className="relative h-full transform transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:-translate-y-2 hover:shadow-indigo-200/30">
                                    {/* Floating Elements */}
                                    <div className="absolute -top-4 -right-4 w-16 h-16 bg-gradient-to-br from-indigo-400/20 to-purple-400/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-all duration-700 group-hover:scale-150"></div>
                                    <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-gradient-to-br from-purple-400/15 to-pink-400/15 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-700 delay-200 group-hover:scale-125"></div>
                                    
                                    <PostCard article={article} isRo={true} />
                                    
                                    {/* Animated Bottom Border */}
                                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left rounded-b-2xl"></div>
                                    
                                    {/* Shine Effect */}
                                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
                                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 translate-x-full group-hover:-translate-x-full transition-transform duration-1000"></div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                        
                        {articlesToDisplay.length === 0 && (
                          <div className="text-center py-16">
                            <div className="mb-6">
                              <svg className="mx-auto w-20 h-20 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                              </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">Nu au fost găsite articole</h3>
                            <p className="text-gray-500 max-w-md mx-auto">
                              Încearcă să schimbi filtrul sau revino mai târziu pentru conținut nou
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Modern Pagination */}
                      {(canGoNext || canGoPrev) && (
                        <div className="mt-16 pt-12 border-t border-gray-200">
                          <div className="flex justify-center items-center max-w-2xl mx-auto gap-4">
                          <button
                            onClick={handlePrevPage}
                            disabled={!canGoPrev || isGridLoading}
                              className={`flex items-center gap-3 px-3 md:px-6 py-3 rounded-full font-semibold transition-all duration-200 ${
                                !canGoPrev || isGridLoading
                                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                  : 'bg-white text-indigo-600 border-2 border-indigo-600 hover:border-indigo-700 hover:text-indigo-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                              }`}
                            >
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M15 18l-6-6 6-6"/>
                            </svg>
                              <span className="hidden md:inline">{t("previous")}</span>
                          </button>
                          
                            <div className="flex flex-col items-center gap-3">
                              <div className="flex items-center gap-2 text-lg font-semibold">
                                <span className="text-indigo-600 text-xl">{currentPage}</span>
                                <span className="text-gray-400 text-sm">{t("of")}</span>
                                <span className="text-gray-600">{loadedPageCount}{canGoNext ? "+" : ""}</span>
                              </div>
                              <div className="w-32 h-1 bg-gray-200 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all duration-300"
                                  style={{ width: `${canGoNext ? Math.min(100, (currentPage / (loadedPageCount + 1)) * 100) : 100}%` }}
                                ></div>
                              </div>
                          </div>
                          
                          <button
                            onClick={handleNextPage}
                            disabled={!canGoNext || isGridLoading}
                              className={`flex items-center gap-3 px-3 md:px-6 py-3 rounded-full font-semibold transition-all duration-200 ${
                                !canGoNext || isGridLoading
                                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                  : 'bg-white text-indigo-600 border-2 border-indigo-600 hover:border-indigo-700 hover:text-indigo-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                              }`}
                            >
                              <span className="hidden md:inline">{t("next")}</span>
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M9 18l6-6-6-6"/>
                            </svg>
                          </button>
                        </div>
                      </div>
                      )}
                    </div>

                      {/* Tailwind Sidebar */}
                      <div className="lg:col-span-4 col-span-12">
                        <div className="sticky top-24 space-y-8">
                          {/* Filter Section */}
                          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4">
                              <h3 className="text-lg font-semibold text-white">{t("filterContent")}</h3>
                            </div>
                            <div className="p-6">
                          <FilterBar
                            handleFilter={handleFilter}
                            filterItem={filterItem}
                          />
                            </div>
                        </div>
                        
                          {/* Popular Articles Section */}
                          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4">
                              <h3 className="text-lg font-semibold text-white">{t("popularArticles")}</h3>
                        </div>
                            <div className="p-6">
                              <div className="space-y-4">
                                {latestFiveArticles && latestFiveArticles.slice(0, 5).map((article, index) => {
                                  const articleTitle = currentLanguage === "hi"
                                    ? article?.info?.hu?.nume
                                    : currentLanguage === "id"
                                      ? article?.info?.ru?.nume
                                      : article?.info?.[currentLanguage]?.nume || article?.info?.ro?.nume || "Untitled";
                                  
                                  return (
                                    <div key={index} className="group">
                                      <a href={buildArticleHref(article, articleTitle)} className="flex items-center gap-4 p-3 rounded-xl hover:bg-indigo-50 transition-colors duration-200">
                                        <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden">
                                          <img 
                                            src={article.image?.finalUri} 
                                            alt={articleTitle}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                          />
                        </div>
                                        <div className="flex-1 min-w-0">
                                          <h4 className="text-sm font-semibold text-gray-900 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                                            {articleTitle}
                                          </h4>
                                          <p className="text-xs text-gray-500 mt-1">
                                            {article.firstUploadDate}
                                          </p>
                                        </div>
                                        <div className="flex-shrink-0">
                                          <svg className="w-4 h-4 text-gray-400 group-hover:text-indigo-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                          </svg>
                                        </div>
                                      </a>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                      
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              </>
            ) : (
              <section className="py-32 bg-gradient-to-b from-gray-50 to-white">
                <div className="max-w-2xl mx-auto text-center px-4">
                  <div className="mb-8">
                    <svg className="mx-auto w-24 h-24 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </div>
                  <h2 className="text-4xl font-bold text-gray-900 mb-6">În curând...</h2>
                  <p className="text-xl text-gray-600 leading-relaxed mb-12">
                    {t("noContentMessage") || "Lucrăm la crearea unor conținuturi noi! Revino în curând pentru a citi cele mai recente articole. Între timp, explorează resursele noastre existente."}
                  </p>
                  <div className="flex justify-center">
                    <Link href="/consultatii" className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold py-4 px-8 rounded-2xl hover:from-indigo-600 hover:to-purple-700 transform hover:-translate-y-1 transition-all duration-300 shadow-lg hover:shadow-xl text-decoration-none">
                      Explorează serviciile
                    </Link>
                  </div>
                </div>
              </section>
            )}

            {homeVideosPreview.length > 0 ? (
              <section className="border-t border-gray-200 bg-white py-14">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                  <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                    <div>
                      <h2 className="text-3xl font-bold tracking-tight text-gray-900">
                        {t("videoLibraryHomePreviewTitle")}
                      </h2>
                      <p className="mt-2 max-w-2xl text-sm text-gray-600">
                        {t("videoLibraryHomePreviewSubtitle")}
                      </p>
                    </div>
                    <Link
                      href="/videouri"
                      className="inline-flex items-center rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700 transition hover:border-indigo-300 hover:bg-indigo-100"
                    >
                      {t("videoLibraryHomePreviewAll")}
                    </Link>
                  </div>
                  <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                    {homeVideosPreview.map((v) => {
                      const durationLabel =
                        typeof v.durationSeconds === "number"
                          ? formatVideoDuration(v.durationSeconds, "")
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
                            onClick={() => handleHomeVideoIntent(v)}
                            aria-label={v.title}
                          >
                            <PublicVideoThumbnail
                              src={v.thumbnailUrl}
                              imgClassName={
                                v.canPlay && v.embedSrc
                                  ? "h-full w-full object-cover transition duration-200 group-hover:scale-[1.02]"
                                  : "h-full w-full object-cover"
                              }
                              fallback={
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
                                </div>
                              }
                            />
                            {v.isPremium ? (
                              <VideoPremiumThumbBadge label={t("videoLibraryPremiumCornerBadge")} />
                            ) : null}
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
                          <div className="mt-3">
                            <button
                              type="button"
                              onClick={() => handleHomeVideoIntent(v)}
                              className="line-clamp-2 block w-full text-left text-sm font-medium leading-snug text-gray-900 hover:text-indigo-700"
                            >
                              {v.title}
                            </button>
                            <p className="mt-1 text-xs text-gray-500">{accessLabel}</p>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </div>
              </section>
            ) : null}

            {shouldRenderHomeCoursesSection && (
            <section className="bg-transparent">
              <div className="w-full space-y-10 px-4 py-16 sm:px-6 lg:px-8">
                <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                  <div className="max-w-3xl">
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900">{t("coursesHeading")}</h2>
                 
                  </div>
                  <Link
                    href="/courses"
                    className="inline-flex items-center rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700 transition hover:border-indigo-300 hover:bg-indigo-100"
                  >
                    {t("coursesHomeBrowseCta")}
                  </Link>
                </div>

                {homeCoursesLoading ? (
                  <div className="text-sm text-slate-600">{t("coursesLoading")}</div>
                ) : homeCoursesError ? (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {homeCoursesError}
                  </div>
                ) : (
                  <div className="space-y-8">
                    <article className="w-full space-y-6">
                      <div>
                        <h3 className="text-2xl font-semibold text-slate-900">{t("coursesHomeFeaturedTitle")}</h3>
                        <p className="mt-1 text-sm text-slate-600">{t("coursesHomeFeaturedSubtitle")}</p>
                      </div>

                      {homeCourses.featuredCourses.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-6 text-sm text-slate-600">
                          {t("coursesHomeFeaturedEmpty")}
                        </div>
                      ) : (
                        <div className={featuredCourseCardsGridClass}>
                          {homeCourses.featuredCourses.map((course) => (
                            <CourseCard
                              key={`featured-${course.id}`}
                              course={course}
                              onClick={() => router.push(`/courses/${course.id}`)}
                              noImageLabel={t("coursesCardNoImage")}
                              openLabel={t("coursesHomeOpenCourse")}
                              featuredLabel={t("coursesHomeFeaturedBadge")}
                              priceLocale={router.locale || "ro-RO"}
                              freePriceLabel={t("coursesPriceFree")}
                            />
                          ))}
                        </div>
                      )}
                    </article>

                    <article className="w-full space-y-6">
                      <div>
                        <h3 className="text-2xl font-semibold text-slate-900">{t("coursesHomeLatestTitle")}</h3>
                        <p className="mt-1 text-sm text-slate-600">{t("coursesHomeLatestSubtitle")}</p>
                      </div>

                      {homeCourses.latestCourses.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-6 text-sm text-slate-600">
                          {t("coursesHomeLatestEmpty")}
                        </div>
                      ) : (
                        <div className={latestCourseCardsGridClass}>
                          {homeCourses.latestCourses.map((course) => (
                            <CourseCard
                              key={`latest-${course.id}`}
                              course={course}
                              onClick={() => router.push(`/courses/${course.id}`)}
                              noImageLabel={t("coursesCardNoImage")}
                              openLabel={t("coursesHomeOpenCourse")}
                              priceLocale={router.locale || "ro-RO"}
                              freePriceLabel={t("coursesPriceFree")}
                            />
                          ))}
                        </div>
                      )}
                    </article>
                  </div>
                )}
              </div>
            </section>
            )}
        </main>
      </div>
      <Footer />
    </Fragment>
  );
}

// Modern styles with better layout and visual hierarchy
const styles = {
  mainWrapper: {
    minHeight: '100vh',
    backgroundColor: '#ffffff',
    width: '100%',
  },
  heroSection: {
    position: 'relative',
    zIndex: 1,
  },
  contentWrapper: {
    backgroundColor: '#f8fafc',
    minHeight: 'calc(100vh - 80px)',
    paddingTop: '3rem',
    paddingBottom: '4rem',
    position: 'relative',
  },
  container: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '0 20px',
  },
  
  // Hero Featured Section
  featuredHeroSection: {
    position: 'relative',
    padding: '4rem 0 6rem',
    background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)',
    borderBottom: '1px solid rgba(102, 126, 234, 0.1)',
    overflow: 'hidden',
  },
  featuredHeroContainer: {
    position: 'relative',
    zIndex: 2,
  },
  featuredLabel: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.75rem',
    marginBottom: '3rem',
    fontSize: '1rem',
    fontWeight: '600',
    color: '#667eea',
  },
  featuredIcon: {
    fontSize: '1.25rem',
  },
  featuredHeroContent: {
    maxWidth: '1000px',
    margin: '0 auto',
  },


  featuredContent: {
    height: '100%',
    padding: '1rem',
  },



  // Blog Section
  blogSection: {
    padding: '4rem 0 6rem',
    background: '#ffffff',
  },
  blogLayout: {
    display: 'grid',
    gridTemplateColumns: '1fr 380px',
    gap: '5rem',
    '@media (max-width: 1200px)': {
      gridTemplateColumns: '1fr',
      gap: '4rem',
    },
  },
  blogMainArea: {
    minWidth: 0,
  },
  
  // Blog Header
  blogHeader: {
    marginBottom: '3rem',
    padding: '2rem 0',
    borderBottom: '2px solid #f1f5f9',
  },
  blogHeaderTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
    '@media (max-width: 768px)': {
      flexDirection: 'column',
      gap: '1.5rem',
      alignItems: 'flex-start',
    },
  },
  blogTitle: {
    fontSize: '2.25rem',
    fontWeight: '700',
    color: '#1a202c',
    margin: '0',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  blogTitleIcon: {
    fontSize: '2rem',
  },
  articlesStats: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.5rem',
    '@media (max-width: 768px)': {
      width: '100%',
      justifyContent: 'center',
    },
  },
  statItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.25rem',
  },
  statNumber: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#667eea',
    lineHeight: '1',
  },
  statLabel: {
    fontSize: '0.875rem',
    color: '#718096',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  statDivider: {
    width: '1px',
    height: '40px',
    backgroundColor: '#e2e8f0',
  },
  activeFilter: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.75rem 1.25rem',
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    borderRadius: '50px',
    color: '#667eea',
    fontSize: '0.875rem',
    fontWeight: '500',
    border: '1px solid rgba(102, 126, 234, 0.2)',
  },
  activeFilterIcon: {
    fontSize: '1rem',
  },
  clearFilterButton: {
    background: 'none',
    border: 'none',
    color: '#667eea',
    cursor: 'pointer',
    padding: '0.25rem',
    borderRadius: '50%',
    fontSize: '0.875rem',
    fontWeight: '600',
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: 'rgba(102, 126, 234, 0.2)',
    },
  },

  // Articles Container
  articlesContainer: {
    marginBottom: '4rem',
  },
  articlesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
    gridAutoRows: 'masonry',
    gap: '2rem',
    '@media (max-width: 768px)': {
      gridTemplateColumns: '1fr',
      gap: '1.5rem',
    },
  },
  
  // Base Article Card
  articleCard: {
    opacity: 0,
    transform: 'translateY(20px)',
    animation: 'fadeInUp 0.6s ease forwards',
    borderRadius: '20px',
    overflow: 'hidden',
    background: 'white',
    border: '1px solid rgba(102, 126, 234, 0.1)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    position: 'relative',
  },
  articleCardInner: {
    position: 'relative',
    height: '100%',
  },
  articleCardBadge: {
    position: 'absolute',
    top: '1rem',
    right: '1rem',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    padding: '0.5rem 1rem',
    borderRadius: '50px',
    fontSize: '0.75rem',
    fontWeight: '600',
    zIndex: 2,
    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
  },

  // Dynamic Card Types
  articleCardLarge: {
    gridColumn: 'span 2',
    gridRow: 'span 2',
    background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.03) 0%, rgba(118, 75, 162, 0.03) 100%)',
    border: '2px solid rgba(102, 126, 234, 0.15)',
    '@media (max-width: 768px)': {
      gridColumn: 'span 1',
      gridRow: 'span 1',
    },
  },
  articleCardMedium: {
    gridColumn: 'span 1',
    gridRow: 'span 2',
    background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.02) 0%, rgba(118, 75, 162, 0.02) 100%)',
    '@media (max-width: 768px)': {
      gridRow: 'span 1',
    },
  },
  articleCardWide: {
    gridColumn: 'span 2',
    background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.01) 0%, rgba(118, 75, 162, 0.01) 100%)',
    '@media (max-width: 768px)': {
      gridColumn: 'span 1',
    },
  },
  articleCardNormal: {
    gridColumn: 'span 1',
    background: 'white',
  },
  
  // No Results
  noResults: {
    textAlign: 'center',
    padding: '4rem 2rem',
    backgroundColor: '#f8fafc',
    borderRadius: '20px',
    border: '2px dashed #cbd5e0',
  },
  noResultsIcon: {
    fontSize: '3rem',
    marginBottom: '1rem',
  },
  noResultsTitle: {
    fontSize: '1.5rem',
    fontWeight: '600',
    color: '#2d3748',
    margin: '0 0 0.75rem 0',
  },
  noResultsText: {
    fontSize: '1rem',
    color: '#718096',
    margin: '0',
  },

  // Enhanced Pagination
  paginationSection: {
    marginTop: '4rem',
    padding: '3rem 0',
    borderTop: '1px solid #e2e8f0',
  },
  paginationContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    maxWidth: '700px',
    margin: '0 auto',
    '@media (max-width: 768px)': {
      flexDirection: 'column',
      gap: '2rem',
    },
  },
  paginationButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '14px 28px',
    backgroundColor: 'white',
    border: '2px solid #667eea',
    borderRadius: '50px',
    color: '#667eea',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    textDecoration: 'none',
    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.1)',
    '&:hover': {
      backgroundColor: '#667eea',
      color: 'white',
      transform: 'translateY(-2px)',
      boxShadow: '0 8px 24px rgba(102, 126, 234, 0.25)',
    },
  },
  paginationButtonDisabled: {
    backgroundColor: '#f7fafc',
    borderColor: '#e2e8f0',
    color: '#a0aec0',
    cursor: 'not-allowed',
    boxShadow: 'none',
    '&:hover': {
      backgroundColor: '#f7fafc',
      color: '#a0aec0',
      transform: 'none',
      boxShadow: 'none',
    },
  },
  paginationInfo: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.75rem',
  },
  paginationNumbers: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '1rem',
    fontWeight: '600',
  },
  paginationCurrent: {
    color: '#667eea',
    fontSize: '1.25rem',
  },
  paginationSeparator: {
    color: '#a0aec0',
    fontSize: '0.875rem',
  },
  paginationTotal: {
    color: '#718096',
  },
  paginationProgress: {
    width: '120px',
    height: '4px',
    backgroundColor: '#e2e8f0',
    borderRadius: '2px',
    overflow: 'hidden',
  },
  paginationProgressBar: {
    height: '100%',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    borderRadius: '2px',
    transition: 'width 0.3s ease',
  },

  // Enhanced Sidebar
  blogSidebar: {
    '@media (max-width: 1200px)': {
      order: -1,
    },
  },
  sidebarContainer: {
    position: 'sticky',
    top: '120px',
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem',
    '@media (max-width: 1200px)': {
      position: 'static',
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: '2rem',
    },
  },
  sidebarCard: {
    backgroundColor: 'white',
    borderRadius: '20px',
    boxShadow: '0 8px 32px rgba(102, 126, 234, 0.08)',
    border: '1px solid rgba(102, 126, 234, 0.1)',
    overflow: 'hidden',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: '0 12px 40px rgba(102, 126, 234, 0.15)',
    },
  },
  sidebarCardHeader: {
    padding: '2rem 2rem 1rem',
    background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
    borderBottom: '1px solid rgba(102, 126, 234, 0.1)',
  },
  sidebarCardTitle: {
    fontSize: '1.25rem',
    fontWeight: '700',
    color: '#1a202c',
    margin: '0',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  sidebarCardIcon: {
    fontSize: '1.5rem',
  },
  sidebarCardContent: {
    padding: '2rem',
  },
  
  // Newsletter Section
  newsletterText: {
    fontSize: '0.95rem',
    color: '#4a5568',
    lineHeight: '1.6',
    margin: '0 0 1.5rem 0',
  },
  newsletterButton: {
    width: '100%',
    padding: '14px 24px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 8px 24px rgba(102, 126, 234, 0.3)',
    },
  },

  // Empty State
  emptySection: {
    padding: '8rem 0',
    textAlign: 'center',
    background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)',
  },
  emptyContainer: {
    backgroundColor: 'white',
    borderRadius: '24px',
    padding: '5rem 3rem',
    boxShadow: '0 20px 60px rgba(102, 126, 234, 0.1)',
    maxWidth: '700px',
    margin: '0 auto',
    border: '1px solid rgba(102, 126, 234, 0.1)',
  },
  emptyIcon: {
    fontSize: '5rem',
    marginBottom: '2rem',
  },
  emptyTitle: {
    fontSize: '2.5rem',
    fontWeight: '800',
    color: '#1a202c',
    marginBottom: '1.5rem',
    margin: '0 0 1.5rem 0',
  },
  emptyText: {
    fontSize: '1.25rem',
    color: '#4a5568',
    lineHeight: '1.6',
    margin: '0 0 3rem 0',
    maxWidth: '500px',
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  emptyActions: {
    display: 'flex',
    justifyContent: 'center',
  },
  emptyButton: {
    padding: '16px 32px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '50px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    '&:hover': {
      transform: 'translateY(-3px)',
      boxShadow: '0 12px 32px rgba(102, 126, 234, 0.3)',
    },
  },
  
  // Loading
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    width: '100%',
  },
  spinner: {
    width: '60px',
    height: '60px',
    border: '6px solid #e9ecef',
    borderTop: '6px solid #667eea',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
};

// CSS animations are now handled in global styles to avoid hydration issues

export default Landing;
