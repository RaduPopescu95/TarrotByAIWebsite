import React, { useCallback, useEffect, useMemo, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useTranslation } from "next-i18next";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import VideoCard from "../../components/Courses/VideoCard";
import LessonTabs from "../../components/Courses/LessonTabs";
import MaterialsPanel from "../../components/Courses/MaterialsPanel";
import SidebarCurriculum from "../../components/Courses/SidebarCurriculum";
import { useAuth } from "../../context/AuthContext";
import { authentication } from "../../firebase";

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common"])),
    },
  };
}

function formatPrice(price, currency, locale, fallbackLabel) {
  if (typeof price !== "number") return fallbackLabel;
  return new Intl.NumberFormat(locale || "ro-RO", {
    style: "currency",
    currency: currency || "RON",
    minimumFractionDigits: 0,
  }).format(price);
}

function mapCourseStateError(status, t) {
  if (status === 401) return t("coursesErrorsAuthRequired");
  if (status === 404) return t("coursesErrorsNotFound");
  return t("coursesErrorsLoadCourse");
}

function mapPlaybackError(status, t) {
  if (status === 401) return t("coursesErrorsAuthRequired");
  if (status === 403) return t("coursesErrorsNoPlaybackAccess");
  if (status === 404) return t("coursesErrorsPlaybackSourceMissing");
  return t("coursesErrorsLoadPlayback");
}

function mapCheckoutError(status, t) {
  if (status === 401) return t("coursesErrorsAuthRequired");
  if (status === 404) return t("coursesErrorsNotFound");
  if (status === 409) return t("coursesErrorsAlreadyPurchased");
  if (status === 400) return t("coursesErrorsCourseUnavailableForPurchase");
  return t("coursesErrorsCheckoutStart");
}

function mapCertificateError(status, t) {
  if (status === 401) return t("coursesErrorsCertificateAuthRequired");
  if (status === 403) return t("coursesErrorsCertificateAccessDenied");
  if (status === 404) return t("coursesErrorsCertificateNotFound");
  return t("coursesErrorsCertificateDownload");
}

function toGoogleCalendarDate(value) {
  return value.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

export default function CourseDetailPage() {
  const router = useRouter();
  const { t } = useTranslation("common");
  const { courseId, success, canceled } = router.query;
  const normalizedCourseId = Array.isArray(courseId) ? courseId[0] : courseId;
  const { currentUser } = useAuth();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [accessLoading, setAccessLoading] = useState(false);
  const [pageError, setPageError] = useState("");
  const [checkoutError, setCheckoutError] = useState("");
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [playbackVimeoId, setPlaybackVimeoId] = useState(null);
  const [playbackLoading, setPlaybackLoading] = useState(false);
  const [playbackError, setPlaybackError] = useState("");
  const [activeTab, setActiveTab] = useState("materials");
  const [activeLessonId, setActiveLessonId] = useState("");
  const [shareFeedback, setShareFeedback] = useState("");
  const [certificateLoading, setCertificateLoading] = useState(false);
  const [certificateError, setCertificateError] = useState("");

  const getAuthHeaders = useCallback(async () => {
    const user = authentication.currentUser;
    if (!user) return {};
    const token = await user.getIdToken();
    return { Authorization: `Bearer ${token}` };
  }, []);

  const toCourseReturnUrl = useCallback(() => {
    const fallbackPath = normalizedCourseId ? `/courses/${normalizedCourseId}` : "/courses";
    return encodeURIComponent(router.asPath || fallbackPath);
  }, [normalizedCourseId, router.asPath]);

  const handleLogin = useCallback(() => {
    router.push(`/login?returnUrl=${toCourseReturnUrl()}`);
  }, [router, toCourseReturnUrl]);

  const handleRegister = useCallback(() => {
    router.push(`/register?returnUrl=${toCourseReturnUrl()}`);
  }, [router, toCourseReturnUrl]);

  const loadCourseState = useCallback(
    async ({ withSpinner = false } = {}) => {
      if (!normalizedCourseId) return null;
      if (withSpinner) setLoading(true);
      setPageError("");
      setCheckoutError("");
      setCertificateError("");

      try {
        const authHeaders = await getAuthHeaders();
        const locale = router.locale || "ro";
        const response = await fetch(
          `/api/courses/${normalizedCourseId}?locale=${encodeURIComponent(locale)}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              ...authHeaders,
            },
          }
        );

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(mapCourseStateError(response.status, t));
        }

        const nextCourse = data?.course || null;
        const nextHasAccess = !!data?.hasAccess;
        const nextIsVisible = !!data?.isVisible;

        setCourse(nextCourse);
        setHasAccess(nextHasAccess);
        setIsVisible(nextIsVisible);
        return { course: nextCourse, hasAccess: nextHasAccess, isVisible: nextIsVisible };
      } catch (err) {
        console.error("[courses.detail] state_load_fail", {
          courseId: normalizedCourseId,
          locale: router.locale || "ro",
          message: err?.message || "unknown_error",
        });
        setCourse(null);
        setHasAccess(false);
        setIsVisible(false);
        setPlaybackVimeoId(null);
        setPageError(err.message || t("coursesErrorsLoadCourse"));
        return null;
      } finally {
        if (withSpinner) setLoading(false);
      }
    },
    [normalizedCourseId, getAuthHeaders, router.locale, t]
  );

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      const result = await loadCourseState({ withSpinner: true });
      if (!mounted) return;
      if (!result) setLoading(false);
    };
    run();
    return () => {
      mounted = false;
    };
  }, [loadCourseState, currentUser]);

  useEffect(() => {
    if (!success || !normalizedCourseId || !currentUser) return;
    let mounted = true;
    const refreshAccessAfterCheckout = async () => {
      setAccessLoading(true);
      try {
        const maxAttempts = 5;
        for (let i = 0; i < maxAttempts; i += 1) {
          const result = await loadCourseState();
          if (!mounted) return;
          if (result?.hasAccess) return;
          if (i < maxAttempts - 1) {
            await new Promise((resolve) => setTimeout(resolve, 1500));
          }
        }
      } finally {
        if (mounted) setAccessLoading(false);
      }
    };
    refreshAccessAfterCheckout();
    return () => {
      mounted = false;
    };
  }, [success, normalizedCourseId, currentUser, loadCourseState]);

  const loadPlayback = useCallback(async () => {
    if (!normalizedCourseId || !hasAccess) {
      setPlaybackVimeoId(null);
      setPlaybackError("");
      setPlaybackLoading(false);
      return;
    }

    setPlaybackLoading(true);
    setPlaybackError("");
    try {
      const authHeaders = await getAuthHeaders();
      if (!authHeaders.Authorization) {
        throw new Error(t("coursesErrorsAuthRequired"));
      }
      const response = await fetch(`/api/courses/${normalizedCourseId}/playback`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(mapPlaybackError(response.status, t));
      }
      if (!data?.vimeoId) {
        throw new Error(t("coursesErrorsPlaybackSourceMissing"));
      }
      setPlaybackVimeoId(data.vimeoId);
    } catch (err) {
      console.error("[courses.detail] playback_load_fail", {
        courseId: normalizedCourseId,
        message: err?.message || "unknown_error",
      });
      setPlaybackVimeoId(null);
      setPlaybackError(err.message || t("coursesErrorsLoadPlayback"));
    } finally {
      setPlaybackLoading(false);
    }
  }, [normalizedCourseId, getAuthHeaders, hasAccess, t]);

  useEffect(() => {
    loadPlayback();
  }, [loadPlayback]);

  useEffect(() => {
    if (loading || pageError || !course) return;
    if (course.thumbnailUrl || course.previewVimeoId) return;
    console.warn("[courses.detail] preview_unavailable", {
      courseId: normalizedCourseId,
      hasCustomThumbnail: Boolean(course.hasCustomThumbnail),
      hasVimeoPreview: Boolean(course.hasVimeoPreview),
      hasPreviewVimeoId: Boolean(course.previewVimeoId),
    });
  }, [loading, pageError, course, normalizedCourseId]);

  const waitingForCheckoutConfirmation =
    Boolean(success) && Boolean(currentUser) && accessLoading && !hasAccess;
  const shouldRenderPreviewVideo =
    !course?.thumbnailUrl &&
    typeof course?.previewVimeoId === "string" &&
    course.previewVimeoId.length > 0;

  const priceLabel = useMemo(
    () =>
      formatPrice(
        course?.price,
        course?.currency,
        router.locale || "ro-RO",
        t("coursesPriceUnavailable")
      ),
    [course?.price, course?.currency, router.locale, t]
  );

  const curriculumData = useMemo(() => {
    const hasLessonsField = course && Object.prototype.hasOwnProperty.call(course, "curriculumLessons");
    const isLessonsArray = Array.isArray(course?.curriculumLessons);
    const rawLessons = isLessonsArray ? course.curriculumLessons : [];
    let invalidCount = hasLessonsField && !isLessonsArray ? 1 : 0;

    const normalized = rawLessons
      .map((lesson, index) => {
        if (!lesson || typeof lesson !== "object" || Array.isArray(lesson)) {
          invalidCount += 1;
          return null;
        }

        const title = typeof lesson.title === "string" ? lesson.title.trim() : "";
        if (!title) {
          invalidCount += 1;
          return null;
        }

        const id =
          typeof lesson.id === "string" && lesson.id.trim()
            ? lesson.id.trim()
            : `lesson-${index + 1}`;

        let durationMinutes = null;
        if (lesson.durationMinutes !== null && lesson.durationMinutes !== undefined) {
          const parsedDuration = Number(lesson.durationMinutes);
          if (Number.isInteger(parsedDuration) && parsedDuration > 0) {
            durationMinutes = parsedDuration;
          } else {
            invalidCount += 1;
          }
        }

        return {
          id,
          title,
          durationMinutes,
          durationLabel:
            durationMinutes && durationMinutes > 0
              ? t("coursesDetailLessonDurationTemplate", { minutes: durationMinutes })
              : t("coursesDetailLessonDurationUnknown"),
          summary: typeof lesson.summary === "string" ? lesson.summary.trim() : "",
          completed: lesson.isCompleted === true,
          order:
            typeof lesson.order === "number" && Number.isFinite(lesson.order)
              ? Math.trunc(lesson.order)
              : index,
          _index: index,
        };
      })
      .filter(Boolean)
      .sort((left, right) => {
        if (left.order === right.order) return left._index - right._index;
        return left.order - right.order;
      })
      .map((lesson, index) => ({
        id: lesson.id,
        title: lesson.title,
        durationMinutes: lesson.durationMinutes,
        durationLabel: lesson.durationLabel,
        summary: lesson.summary,
        completed: lesson.completed,
        order: index,
      }));

    return {
      lessons: normalized,
      invalidCount,
    };
  }, [course?.curriculumLessons, t]);

  useEffect(() => {
    if (curriculumData.invalidCount <= 0) return;
    console.error("[courses.detail] curriculum_data_invalid", {
      courseId: normalizedCourseId,
      invalidCount: curriculumData.invalidCount,
    });
  }, [curriculumData.invalidCount, normalizedCourseId]);

  useEffect(() => {
    if (loading || pageError || !course) return;
    if (curriculumData.lessons.length > 0) return;
    console.info("[courses.detail] curriculum_render_empty", {
      courseId: normalizedCourseId,
    });
  }, [loading, pageError, course, curriculumData.lessons.length, normalizedCourseId]);

  useEffect(() => {
    if (!curriculumData.lessons.length) {
      if (activeLessonId) setActiveLessonId("");
      return;
    }
    const hasActiveLesson = curriculumData.lessons.some((lesson) => lesson.id === activeLessonId);
    if (!hasActiveLesson) {
      setActiveLessonId(curriculumData.lessons[0].id);
    }
  }, [curriculumData.lessons, activeLessonId]);

  const selectedLesson = useMemo(() => {
    if (!curriculumData.lessons.length) return null;
    return (
      curriculumData.lessons.find((lesson) => lesson.id === activeLessonId) ||
      curriculumData.lessons[0]
    );
  }, [curriculumData.lessons, activeLessonId]);

  const completedLessonsCount = useMemo(
    () => curriculumData.lessons.filter((lesson) => lesson.completed).length,
    [curriculumData.lessons]
  );

  const notesContent =
    typeof course?.notesContent === "string" && course.notesContent.trim().length > 0
      ? course.notesContent.trim()
      : "";
  const contactContent =
    typeof course?.contactContent === "string" && course.contactContent.trim().length > 0
      ? course.contactContent.trim()
      : "";

  const handleCheckout = async () => {
    if (!normalizedCourseId) return;
    if (!authentication.currentUser) {
      handleLogin();
      return;
    }

    setCheckoutLoading(true);
    setCheckoutError("");
    try {
      const token = await authentication.currentUser.getIdToken();
      const response = await fetch("/api/stripe/courses/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ courseId: normalizedCourseId }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(mapCheckoutError(response.status, t));
      }
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error(t("coursesErrorsCheckoutStart"));
      }
    } catch (err) {
      console.error("[courses.detail] checkout_fail", {
        courseId: normalizedCourseId,
        message: err?.message || "unknown_error",
      });
      setCheckoutError(err.message || t("coursesErrorsCheckoutStart"));
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleAddToCalendar = useCallback(() => {
    if (typeof window === "undefined") return;

    try {
      const startDate = new Date();
      const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
      const calendarUrl =
        "https://calendar.google.com/calendar/render?action=TEMPLATE" +
        `&text=${encodeURIComponent(course?.title || t("coursesDetailDefaultTitle"))}` +
        `&details=${encodeURIComponent(course?.description || "")}` +
        `&dates=${toGoogleCalendarDate(startDate)}/${toGoogleCalendarDate(endDate)}` +
        `&location=${encodeURIComponent(window.location.href)}`;

      window.open(calendarUrl, "_blank", "noopener,noreferrer");
    } catch (err) {
      console.error("[courses.detail] add_calendar_fail", {
        courseId: normalizedCourseId,
        message: err?.message || "unknown_error",
      });
    }
  }, [course?.title, course?.description, normalizedCourseId, t]);

  const handleShare = useCallback(async () => {
    if (typeof window === "undefined") return;

    const shareUrl = window.location.href;
    const shareTitle = course?.title || t("coursesDetailDefaultTitle");

    try {
      if (navigator.share) {
        await navigator.share({
          title: shareTitle,
          url: shareUrl,
        });
        setShareFeedback(t("coursesDetailShareDone"));
        return;
      }

      await navigator.clipboard.writeText(shareUrl);
      setShareFeedback(t("coursesDetailShareCopied"));
    } catch (err) {
      if (err?.name === "AbortError") {
        return;
      }
      console.error("[courses.detail] share_fail", {
        courseId: normalizedCourseId,
        message: err?.message || "unknown_error",
      });
      setShareFeedback(t("coursesDetailShareFailed"));
    }
  }, [course?.title, normalizedCourseId, t]);

  useEffect(() => {
    if (!shareFeedback) return undefined;
    const timeoutId = setTimeout(() => {
      setShareFeedback("");
    }, 3000);

    return () => clearTimeout(timeoutId);
  }, [shareFeedback]);

  const handleDownloadCertificate = useCallback(async () => {
    if (!normalizedCourseId) return;

    const currentAuthUser = authentication.currentUser;
    if (!currentAuthUser) {
      setCertificateError(t("coursesErrorsCertificateAuthRequired"));
      return;
    }

    setCertificateLoading(true);
    setCertificateError("");
    try {
      const token = await currentAuthUser.getIdToken();
      const locale = router.locale || "ro";
      const response = await fetch(
        `/api/courses/${normalizedCourseId}/certificate?locale=${encodeURIComponent(locale)}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(mapCertificateError(response.status, t));
      }

      const blob = await response.blob();
      const disposition = response.headers.get("content-disposition") || "";
      const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i);
      const quotedMatch = disposition.match(/filename=\"([^\"]+)\"/i);
      const fallbackName = `certificat-${normalizedCourseId}-${locale}.pdf`;
      const filename = utf8Match?.[1]
        ? decodeURIComponent(utf8Match[1])
        : quotedMatch?.[1] || fallbackName;

      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1200);
    } catch (err) {
      console.error("[courses.detail] certificate_download_fail", {
        courseId: normalizedCourseId,
        locale: router.locale || "ro",
        message: err?.message || "unknown_error",
      });
      setCertificateError(err.message || t("coursesErrorsCertificateDownload"));
    } finally {
      setCertificateLoading(false);
    }
  }, [normalizedCourseId, router.locale, t]);

  return (
    <>
      <Head>
        <title>
          {course?.title
            ? t("coursesDetailSeoTitle", { title: course.title })
            : t("coursesDetailDefaultTitle")}
        </title>
      </Head>
      <Header />
      <div className="min-h-screen bg-slate-100 pt-24">
        <div className="mx-auto w-full max-w-[1680px] px-2 pb-16 sm:px-3 lg:px-4">
          {loading ? (
            <div className="text-sm text-gray-600">{t("coursesLoading")}</div>
          ) : pageError ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {pageError}
            </div>
          ) : !course ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {t("coursesErrorsNotFound")}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Link
                  href="/courses"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-500"
                >
                  <span aria-hidden="true">←</span>
                  {t("coursesDetailBackToList")}
                </Link>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center rounded-full bg-indigo-50 px-4 py-1.5 text-sm font-semibold text-indigo-700">
                    {priceLabel}
                  </span>
                  <Link
                    href="/courses/purchased"
                    className="inline-flex items-center rounded-full border border-indigo-200 bg-white px-4 py-1.5 text-sm font-semibold text-indigo-700 transition hover:border-indigo-300 hover:bg-indigo-50"
                  >
                    {t("coursesPurchasedCta")}
                  </Link>
                </div>
              </div>

              {(success || canceled) && (
                <div
                  className={`rounded-lg border px-4 py-3 text-sm ${
                    success
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-amber-200 bg-amber-50 text-amber-700"
                  }`}
                >
                  {success ? t("coursesCheckoutSuccess") : t("coursesCheckoutCanceled")}
                </div>
              )}

              {checkoutError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {checkoutError}
                </div>
              )}

              {certificateError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {certificateError}
                </div>
              )}

              <div className="grid gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,3fr)]">
                <section className="space-y-5">
                  <VideoCard
                    hasAccess={hasAccess}
                    playbackLoading={playbackLoading}
                    playbackError={playbackError}
                    playbackVimeoId={playbackVimeoId}
                    previewThumbnailUrl={course.thumbnailUrl}
                    shouldRenderPreviewVideo={shouldRenderPreviewVideo}
                    previewVimeoId={course.previewVimeoId}
                    title={course.title}
                    preparingLabel={t("coursesPlaybackPreparing")}
                    noPreviewLabel={t("coursesDetailNoPreview")}
                    playbackUnavailableLabel={t("coursesPlaybackUnavailable")}
                    fallbackPlayerTitle={t("coursesPlayerTitleFallback")}
                  />

                  <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_14px_34px_-28px_rgba(15,23,42,0.75)] md:p-7">
                    <header className="mb-5 space-y-2">
                      <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">{course.title}</h1>
                      <p className="text-sm text-slate-500">{t("coursesDetailHeroSubtitle")}</p>
                    </header>

                    <LessonTabs
                      activeTab={activeTab}
                      onTabChange={setActiveTab}
                      onAddToCalendar={handleAddToCalendar}
                      onShare={handleShare}
                      materialsLabel={t("coursesDetailTabsMaterials")}
                      notesLabel={t("coursesDetailTabsNotes")}
                      contactLabel={t("coursesDetailTabsContact")}
                      calendarButtonLabel={t("coursesDetailCalendarButton")}
                      shareButtonLabel={t("coursesDetailShareButton")}
                    />

                    {shareFeedback && (
                      <p className="mt-3 text-xs font-medium text-emerald-700">{shareFeedback}</p>
                    )}

                    <div className="mt-6">
                      {activeTab === "materials" && (
                        <div
                          id="course-tabpanel-materials"
                          role="tabpanel"
                          aria-labelledby="course-tab-materials"
                        >
                          <MaterialsPanel
                            lesson={selectedLesson}
                            lessonSummaryTitle={t("coursesDetailLessonSummaryTitle")}
                            lessonDurationLabel={t("coursesDetailLessonDurationLabel")}
                            lessonDurationUnknown={t("coursesDetailLessonDurationUnknown")}
                            emptyTitle={t("coursesDetailLessonsEmptyTitle")}
                            emptyDescription={t("coursesDetailLessonsEmptyDescription")}
                          />
                        </div>
                      )}

                      {activeTab === "notes" && (
                        <div
                          id="course-tabpanel-notes"
                          role="tabpanel"
                          aria-labelledby="course-tab-notes"
                          className="space-y-3"
                        >
                          <h2 className="text-lg font-semibold text-slate-900">
                            {t("coursesDetailTabsNotes")}
                          </h2>
                          <p className="text-sm leading-relaxed text-slate-700">
                            {notesContent || t("coursesDetailNotesEmpty")}
                          </p>
                        </div>
                      )}

                      {activeTab === "contact" && (
                        <div
                          id="course-tabpanel-contact"
                          role="tabpanel"
                          aria-labelledby="course-tab-contact"
                          className="space-y-3"
                        >
                          <h2 className="text-lg font-semibold text-slate-900">
                            {t("coursesDetailTabsContact")}
                          </h2>
                          <p className="text-sm leading-relaxed text-slate-700">
                            {contactContent || t("coursesDetailContactEmpty")}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      {!isVisible && !hasAccess ? (
                        waitingForCheckoutConfirmation ? (
                          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                            {t("coursesCheckoutPendingLong")}
                          </div>
                        ) : (
                          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                            {t("coursesDetailUnavailable")}
                          </div>
                        )
                      ) : hasAccess ? (
                        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                          {t("coursesAccessAlreadyGranted")}
                        </div>
                      ) : waitingForCheckoutConfirmation ? (
                        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                          {t("coursesCheckoutPendingShort")}
                        </div>
                      ) : (
                        <div className="space-y-3 rounded-xl border border-slate-200 bg-white px-4 py-4">
                          <p className="text-sm text-slate-700">
                            {currentUser
                              ? t("coursesLockedDescriptionLoggedIn")
                              : t("coursesLockedDescriptionLoggedOut")}
                          </p>

                          {currentUser ? (
                            <button
                              type="button"
                              onClick={handleCheckout}
                              disabled={checkoutLoading}
                              className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-70"
                            >
                              {checkoutLoading
                                ? t("coursesLockedPurchaseLoading")
                                : t("coursesLockedPurchaseButton", { price: priceLabel })}
                            </button>
                          ) : (
                            <div className="space-y-3">
                              <p className="text-sm font-semibold text-slate-900">
                                {t("coursesLockedAuthCtaTitle")}
                              </p>
                              <p className="text-sm text-slate-600">{t("coursesDetailAuthHint")}</p>
                              <div className="flex flex-wrap gap-3">
                                <button
                                  type="button"
                                  onClick={handleLogin}
                                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
                                >
                                  {t("coursesLockedLoginButton")}
                                </button>
                                <button
                                  type="button"
                                  onClick={handleRegister}
                                  className="rounded-lg border border-indigo-300 bg-white px-4 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-50"
                                >
                                  {t("coursesLockedRegisterButton")}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </article>

                  {accessLoading && (
                    <div className="text-xs text-gray-500">{t("coursesAccessChecking")}</div>
                  )}
                </section>

                <SidebarCurriculum
                  title={t("coursesDetailSidebarTitle")}
                  lessons={curriculumData.lessons}
                  activeLessonId={activeLessonId}
                  onSelectLesson={setActiveLessonId}
                  progressLabel={t("coursesDetailSidebarProgress", {
                    completed: completedLessonsCount,
                    total: curriculumData.lessons.length,
                  })}
                  finalTestLabel={t("coursesDetailFinalTest")}
                  finalTestHint={t("coursesDetailFinalTestHint")}
                  downloadCertificateLabel={
                    certificateLoading
                      ? t("coursesDetailCertificateDownloading")
                      : t("coursesDetailDownloadCertificate")
                  }
                  certificateLockedLabel={t("coursesDetailCertificateLocked")}
                  isCertificateEnabled={hasAccess}
                  onDownloadCertificate={handleDownloadCertificate}
                  isCertificateLoading={certificateLoading}
                  emptyLabel={t("coursesDetailLessonsEmptyDescription")}
                />
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
