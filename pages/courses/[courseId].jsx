import React, { useCallback, useEffect, useMemo, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useTranslation } from "next-i18next";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import VideoCard from "../../components/Courses/VideoCard";
import CourseLanguageSelect from "../../components/Courses/CourseLanguageSelect";
import LessonTabs from "../../components/Courses/LessonTabs";
import MaterialsPanel from "../../components/Courses/MaterialsPanel";
import SidebarCurriculum from "../../components/Courses/SidebarCurriculum";
import CoursePurchaseFab from "../../components/Courses/CoursePurchaseFab";
import BillingDetailsForm from "../../components/BillingDetailsForm";
import { useAuth } from "../../context/AuthContext";
import { getFirebaseBearerHeader } from "../../utils/firebaseAuthHeaders";
import {
  buildBillingAuditInput,
  buildCourseBillingDetails,
  billingValuesIndividualFrom,
  createInitialBillingFormValues,
  INDIVIDUAL_BILLING_AUDIT_OPTS,
  mapBillingAuditErrorsToForm,
} from "../../utils/billingAddressData.mjs";
import {
  buildInvoiceDecision,
  logBillingAudit,
  normalizeBillingContext,
} from "../../utils/billingAudit.mjs";
import VideoPlaybackConsentModal from "../../components/VideoPlayback/VideoPlaybackConsentModal";
import { useVideoPlaybackConsentGate } from "../../lib/videoPlaybackConsent";

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
  if (status === 403) return t("coursesErrorsNoPlaybackAccess");
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

function splitDisplayName(displayName = "") {
  const normalized = typeof displayName === "string" ? displayName.trim() : "";
  if (!normalized) {
    return { firstName: "", lastName: "" };
  }

  const parts = normalized.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: "" };
  }

  return {
    firstName: parts.slice(0, -1).join(" "),
    lastName: parts.slice(-1).join(" "),
  };
}

function getCheckoutInputClass(error) {
  return [
    "w-full rounded-xl border bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition",
    error
      ? "border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100"
      : "border-slate-300 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100",
  ].join(" ");
}

function toGoogleCalendarDate(value) {
  return value.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

export default function CourseDetailPage() {
  const router = useRouter();
  const { t } = useTranslation("common");
  const { courseId, success, canceled } = router.query;
  const normalizedCourseId = Array.isArray(courseId) ? courseId[0] : courseId;
  const { currentUser, userData } = useAuth();
  const {
    consentGranted,
    modalVisible,
    recording,
    requestPlayback,
    handleAccept,
    handleDecline,
  } = useVideoPlaybackConsentGate({
    userData,
    onDecline: () => router.back(),
  });

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [accessSource, setAccessSource] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [accessLoading, setAccessLoading] = useState(false);
  const [pageError, setPageError] = useState("");
  const [checkoutError, setCheckoutError] = useState("");
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutFormErrors, setCheckoutFormErrors] = useState({});
  const [billingContact, setBillingContact] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });
  const [billingForm, setBillingForm] = useState(createInitialBillingFormValues());
  const [playbackEmbedSrc, setPlaybackEmbedSrc] = useState(null);
  const [playbackPlatform, setPlaybackPlatform] = useState("vimeo");
  const [playbackLoading, setPlaybackLoading] = useState(false);
  const [playbackError, setPlaybackError] = useState("");
  const [activeTab, setActiveTab] = useState("materials");
  const [activeLessonId, setActiveLessonId] = useState("");
  const [shareFeedback, setShareFeedback] = useState("");
  const [certificateLoading, setCertificateLoading] = useState(false);
  const [certificateError, setCertificateError] = useState("");
  const [availableLocales, setAvailableLocales] = useState([]);

  const getAuthHeaders = useCallback(
    async ({ required = false } = {}) => {
      try {
        return await getFirebaseBearerHeader({ required });
      } catch (error) {
        if (required) {
          throw new Error(t("coursesErrorsAuthRequired"));
        }
        throw error;
      }
    },
    [t]
  );

  const toCourseReturnUrl = useCallback(() => {
    const fallbackPath = normalizedCourseId ? `/courses/${normalizedCourseId}` : "/courses";
    return router.asPath || fallbackPath;
  }, [normalizedCourseId, router.asPath]);

  const handleLogin = useCallback(() => {
    router.push(`/login?returnUrl=${encodeURIComponent(toCourseReturnUrl())}`);
  }, [router, toCourseReturnUrl]);

  const handleRegister = useCallback(() => {
    router.push(`/register?returnUrl=${encodeURIComponent(toCourseReturnUrl())}`);
  }, [router, toCourseReturnUrl]);

  const loadCourseState = useCallback(
    async ({ withSpinner = false } = {}) => {
      if (!normalizedCourseId) return null;
      if (withSpinner) setLoading(true);
      setPageError("");
      setCheckoutError("");
      setCertificateError("");

      try {
        const authHeaders = await getAuthHeaders({ required: false });
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
        const nextAccessSource =
          typeof data?.accessSource === "string" ? data.accessSource : null;

        setCourse(nextCourse);
        setHasAccess(nextHasAccess);
        setAccessSource(nextAccessSource);
        setIsVisible(nextIsVisible);
        setAvailableLocales(
          Array.isArray(data?.availableLocales) ? data.availableLocales : []
        );
        return {
          course: nextCourse,
          hasAccess: nextHasAccess,
          isVisible: nextIsVisible,
          accessSource: nextAccessSource,
          availableLocales: Array.isArray(data?.availableLocales) ? data.availableLocales : [],
        };
      } catch (err) {
        console.error("[courses.detail] state_load_fail", {
          courseId: normalizedCourseId,
          locale: router.locale || "ro",
          message: err?.message || "unknown_error",
        });
        setCourse(null);
        setHasAccess(false);
        setAccessSource(null);
        setIsVisible(false);
        setAvailableLocales([]);
        setPlaybackEmbedSrc(null);
        setPlaybackPlatform("vimeo");
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
    const derivedName = splitDisplayName(currentUser?.displayName || "");

    setBillingContact((prev) => ({
      firstName: prev.firstName || userData?.first_name || derivedName.firstName,
      lastName: prev.lastName || userData?.last_name || derivedName.lastName,
      email: prev.email || userData?.email || currentUser?.email || "",
      phone:
        prev.phone ||
        userData?.telefon ||
        userData?.phoneNumber ||
        currentUser?.phoneNumber ||
        "",
    }));
  }, [
    currentUser?.displayName,
    currentUser?.email,
    currentUser?.phoneNumber,
    userData?.email,
    userData?.first_name,
    userData?.last_name,
    userData?.phoneNumber,
    userData?.telefon,
  ]);

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
      setPlaybackEmbedSrc(null);
      setPlaybackPlatform("vimeo");
      setPlaybackError("");
      setPlaybackLoading(false);
      return;
    }

    setPlaybackLoading(true);
    setPlaybackError("");
    try {
      const needAuth = accessSource !== "free";
      const authHeaders = await getAuthHeaders({ required: needAuth });
      if (needAuth && !authHeaders.Authorization) {
        throw new Error(t("coursesErrorsAuthRequired"));
      }
      const playbackLocale = router.locale || "ro";
      const response = await fetch(
        `/api/courses/${normalizedCourseId}/playback?locale=${encodeURIComponent(playbackLocale)}`,
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
        throw new Error(mapPlaybackError(response.status, t));
      }
      const embedSrc =
        typeof data?.embedSrc === "string" && data.embedSrc.trim()
          ? data.embedSrc.trim()
          : data?.vimeoId
            ? `https://player.vimeo.com/video/${data.vimeoId}`
            : null;
      if (!embedSrc) {
        throw new Error(t("coursesErrorsPlaybackSourceMissing"));
      }
      setPlaybackEmbedSrc(embedSrc);
      setPlaybackPlatform(
        typeof data?.platform === "string" && data.platform.trim()
          ? data.platform.trim()
          : "vimeo"
      );
    } catch (err) {
      console.error("[courses.detail] playback_load_fail", {
        courseId: normalizedCourseId,
        message: err?.message || "unknown_error",
      });
      setPlaybackEmbedSrc(null);
      setPlaybackPlatform("vimeo");
      setPlaybackError(err.message || t("coursesErrorsLoadPlayback"));
    } finally {
      setPlaybackLoading(false);
    }
  }, [normalizedCourseId, getAuthHeaders, hasAccess, accessSource, t, router.locale]);

  useEffect(() => {
    loadPlayback();
  }, [loadPlayback]);

  useEffect(() => {
    if (!course?.id || !hasAccess || !playbackEmbedSrc) return;
    void requestPlayback({
      contentType: "course",
      contentId: course.id,
      platform: playbackPlatform || "vimeo",
      title: course.title || "",
      locale: router.locale || "ro",
    });
  }, [
    course?.id,
    course?.title,
    hasAccess,
    playbackEmbedSrc,
    playbackPlatform,
    requestPlayback,
    router.locale,
  ]);

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

  const lockedPreviewThumbnailUrl = useMemo(() => {
    if (typeof course?.thumbnailUrl === "string" && course.thumbnailUrl.trim()) {
      return course.thumbnailUrl.trim();
    }
    const previewVimeoId =
      typeof course?.previewVimeoId === "string" ? course.previewVimeoId.trim() : "";
    if (previewVimeoId.length > 0) {
      return `https://vumbnail.com/${previewVimeoId}.jpg`;
    }
    return null;
  }, [course?.previewVimeoId, course?.thumbnailUrl]);

  const priceLabel = useMemo(() => {
    if (typeof course?.price === "number" && course.price === 0) {
      return t("coursesPriceFree");
    }
    return formatPrice(
      course?.price,
      course?.currency,
      router.locale || "ro-RO",
      t("coursesPriceUnavailable")
    );
  }, [course?.price, course?.currency, router.locale, t]);

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

  const handleBillingContactChange = (field, value) => {
    setBillingContact((prev) => ({
      ...prev,
      [field]: value,
    }));
    setCheckoutFormErrors((prev) => ({
      ...prev,
      [field]: false,
    }));
    setCheckoutError("");
  };

  const handleBillingFieldChange = (field, value) => {
    setBillingForm((prev) => ({
      ...prev,
      [field]: value,
    }));
    setCheckoutFormErrors((prev) => ({
      ...prev,
      [field]: false,
    }));
    setCheckoutError("");
  };

  const handleCheckout = async () => {
    if (!normalizedCourseId) return;
    if (!currentUser) {
      handleLogin();
      return;
    }

    const billingValuesIndividual = billingValuesIndividualFrom(billingForm);
    const nextErrors = {};
    if (!billingContact.firstName.trim()) {
      nextErrors.firstName = t("coursesBillingFirstNameRequired", {
        defaultValue: "Prenumele este obligatoriu pentru facturare.",
      });
    }
    if (!billingContact.lastName.trim()) {
      nextErrors.lastName = t("coursesBillingLastNameRequired", {
        defaultValue: "Numele este obligatoriu pentru facturare.",
      });
    }
    if (!billingContact.email.trim()) {
      nextErrors.email = t("coursesBillingEmailRequired", {
        defaultValue: "Email-ul este obligatoriu pentru facturare.",
      });
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(billingContact.email.trim())) {
      nextErrors.email = t("coursesBillingEmailInvalid", {
        defaultValue: "Email-ul introdus nu este valid.",
      });
    }
    if (!billingContact.phone.trim()) {
      nextErrors.phone = t("coursesBillingPhoneRequired", {
        defaultValue: "Telefonul este obligatoriu pentru facturare.",
      });
    }

    const rawBillingInput = buildBillingAuditInput({
      billingValues: billingValuesIndividual,
      firstName: billingContact.firstName,
      lastName: billingContact.lastName,
      fullName: `${billingContact.firstName} ${billingContact.lastName}`.trim(),
      email: billingContact.email,
      phone: billingContact.phone,
      individualAddress: billingValuesIndividual.billingAddress,
    });
    const billingAudit = normalizeBillingContext(rawBillingInput, INDIVIDUAL_BILLING_AUDIT_OPTS);
    const invoiceDecision = buildInvoiceDecision(billingAudit);

    logBillingAudit({
      flow: "courses",
      stage: "ui_submit",
      raw: rawBillingInput,
      normalized: billingAudit.normalizedClient,
      decision: invoiceDecision,
    });

    if (!billingAudit.validation.ok) {
      Object.assign(
        nextErrors,
        mapBillingAuditErrorsToForm(billingAudit.validation.errorsByField, {
          billingType: "individual",
        })
      );
    }

    if (Object.keys(nextErrors).length > 0) {
      setCheckoutFormErrors(nextErrors);
      setCheckoutError(
        Object.values(nextErrors)[0] ||
          t("coursesBillingFormInvalid", {
            defaultValue: "Completeaza datele de facturare inainte de a continua.",
          })
      );
      return;
    }

    setCheckoutLoading(true);
    setCheckoutError("");
    setCheckoutFormErrors({});
    try {
      const authHeaders = await getAuthHeaders({ required: true });
      const billingDetails = buildCourseBillingDetails({
        billingValues: billingValuesIndividual,
        firstName: billingContact.firstName,
        lastName: billingContact.lastName,
        email: billingContact.email,
        phone: billingContact.phone,
        individualAddress: billingValuesIndividual.billingAddress,
      });
      const response = await fetch("/api/stripe/courses/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        body: JSON.stringify({
          courseId: normalizedCourseId,
          billingDetails,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const msg =
          data?.error === "free_course"
            ? t("coursesErrorsFreeCourse")
            : data?.error || mapCheckoutError(response.status, t);
        throw new Error(msg);
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

    if (!currentUser) {
      setCertificateError(t("coursesErrorsCertificateAuthRequired"));
      return;
    }

    setCertificateLoading(true);
    setCertificateError("");
    try {
      const authHeaders = await getAuthHeaders({ required: true });
      const locale = router.locale || "ro";
      const response = await fetch(
        `/api/courses/${normalizedCourseId}/certificate?locale=${encodeURIComponent(locale)}`,
        {
          method: "GET",
          headers: authHeaders,
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
  }, [normalizedCourseId, router.locale, t, currentUser, getAuthHeaders]);

  const shouldShowPurchaseFab =
    Boolean(currentUser) &&
    !hasAccess &&
    isVisible === true &&
    !loading &&
    !pageError &&
    !waitingForCheckoutConfirmation;

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
                  {hasAccess && !consentGranted ? (
                    <section className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-[0_14px_34px_-26px_rgba(15,23,42,0.75)]">
                      <div className="flex aspect-video w-full items-center justify-center bg-slate-900 text-sm text-slate-300">
                        {t("coursesPlaybackPreparing")}
                      </div>
                    </section>
                  ) : (
                    <VideoCard
                      hasAccess={hasAccess}
                      playbackLoading={playbackLoading}
                      playbackError={playbackError}
                      playbackEmbedSrc={playbackEmbedSrc}
                      previewThumbnailUrl={
                        hasAccess ? course.thumbnailUrl : lockedPreviewThumbnailUrl
                      }
                      shouldRenderPreviewVideo={hasAccess ? shouldRenderPreviewVideo : false}
                      previewVimeoId={course.previewVimeoId}
                      title={course.title}
                      preparingLabel={t("coursesPlaybackPreparing")}
                      noPreviewLabel={t("coursesDetailNoPreview")}
                      playbackUnavailableLabel={t("coursesPlaybackUnavailable")}
                      fallbackPlayerTitle={t("coursesPlayerTitleFallback")}
                    />
                  )}

                  <CourseLanguageSelect availableLocales={availableLocales} />

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
                          {accessSource === "free"
                            ? t("coursesAccessFreeBadge")
                            : t("coursesAccessAlreadyGranted")}
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
                            <div className="space-y-4">
                              <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-1.5">
                                  <label className="block text-sm font-semibold text-slate-700">
                                    {t("coursesBillingFirstNameLabel", {
                                      defaultValue: "Prenume",
                                    })}
                                  </label>
                                  <input
                                    type="text"
                                    value={billingContact.firstName}
                                    onChange={(event) =>
                                      handleBillingContactChange("firstName", event.target.value)
                                    }
                                    className={getCheckoutInputClass(checkoutFormErrors.firstName)}
                                  />
                                  {typeof checkoutFormErrors.firstName === "string" ? (
                                    <p className="text-xs font-medium text-red-600">
                                      {checkoutFormErrors.firstName}
                                    </p>
                                  ) : null}
                                </div>

                                <div className="space-y-1.5">
                                  <label className="block text-sm font-semibold text-slate-700">
                                    {t("coursesBillingLastNameLabel", {
                                      defaultValue: "Nume",
                                    })}
                                  </label>
                                  <input
                                    type="text"
                                    value={billingContact.lastName}
                                    onChange={(event) =>
                                      handleBillingContactChange("lastName", event.target.value)
                                    }
                                    className={getCheckoutInputClass(checkoutFormErrors.lastName)}
                                  />
                                  {typeof checkoutFormErrors.lastName === "string" ? (
                                    <p className="text-xs font-medium text-red-600">
                                      {checkoutFormErrors.lastName}
                                    </p>
                                  ) : null}
                                </div>

                                <div className="space-y-1.5">
                                  <label className="block text-sm font-semibold text-slate-700">
                                    {t("coursesBillingEmailLabel", {
                                      defaultValue: "Email facturare",
                                    })}
                                  </label>
                                  <input
                                    type="email"
                                    value={billingContact.email}
                                    onChange={(event) =>
                                      handleBillingContactChange("email", event.target.value)
                                    }
                                    className={getCheckoutInputClass(checkoutFormErrors.email)}
                                  />
                                  {typeof checkoutFormErrors.email === "string" ? (
                                    <p className="text-xs font-medium text-red-600">
                                      {checkoutFormErrors.email}
                                    </p>
                                  ) : null}
                                </div>

                                <div className="space-y-1.5">
                                  <label className="block text-sm font-semibold text-slate-700">
                                    {t("coursesBillingPhoneLabel", {
                                      defaultValue: "Telefon",
                                    })}
                                  </label>
                                  <input
                                    type="tel"
                                    value={billingContact.phone}
                                    onChange={(event) =>
                                      handleBillingContactChange("phone", event.target.value)
                                    }
                                    className={getCheckoutInputClass(checkoutFormErrors.phone)}
                                  />
                                  {typeof checkoutFormErrors.phone === "string" ? (
                                    <p className="text-xs font-medium text-red-600">
                                      {checkoutFormErrors.phone}
                                    </p>
                                  ) : null}
                                </div>
                              </div>

                              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                <BillingDetailsForm
                                  variant="tailwind"
                                  individualBillingOnly
                                  hidePersonalCnp
                                  title={t("coursesBillingCardTitle", {
                                    defaultValue: "Date pentru factura",
                                  })}
                                  description={t("coursesBillingCardDescription", {
                                    defaultValue:
                                      "Pentru clientii din Romania, judetul si localitatea se aleg din listele valide pentru Oblio.",
                                  })}
                                  billingValues={billingForm}
                                  onBillingChange={handleBillingFieldChange}
                                  errors={checkoutFormErrors}
                                  individualAddressValue={billingForm.billingAddress}
                                  onIndividualAddressChange={(value) =>
                                    handleBillingFieldChange("billingAddress", value)
                                  }
                                  disabled={checkoutLoading}
                                />
                              </div>

                              <p className="text-xs text-slate-500">
                                {t("coursesBillingInlineHint", {
                                  defaultValue:
                                    "Completeaza datele de facturare, apoi finalizeaza comanda din butonul flotant.",
                                })}
                              </p>
                            </div>
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
                  isCertificateEnabled={hasAccess && accessSource !== "free"}
                  onDownloadCertificate={handleDownloadCertificate}
                  isCertificateLoading={certificateLoading}
                  emptyLabel={t("coursesDetailLessonsEmptyDescription")}
                />
              </div>

              <CoursePurchaseFab
                visible={shouldShowPurchaseFab}
                label={t("coursesFloatingPurchaseCta")}
                loadingLabel={t("coursesFloatingPurchaseLoading")}
                isLoading={checkoutLoading}
                onClick={handleCheckout}
              />
            </div>
          )}
        </div>
      </div>
      <VideoPlaybackConsentModal
        open={modalVisible}
        onAccept={handleAccept}
        onDecline={handleDecline}
        recording={recording}
      />
      <Footer />
    </>
  );
}
