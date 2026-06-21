import React, { useEffect, useMemo, useRef, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import LocalPasswordGate from "../../../components/Dashboard/LocalPasswordGate";
import CourseSheet from "../../../components/Courses/CourseSheet";
import BundleForm from "../../../components/Courses/BundleForm";
import CategorySheet from "../../../components/Courses/CategorySheet";
import CoursesOverview from "../../../components/Courses/CoursesOverview";
import CoursesTable from "../../../components/Courses/CoursesTable";
import EmptyState from "../../../components/Courses/EmptyState";
import {
  createAdminCourse,
  deleteAdminCourse,
  fetchAdminCourse,
  fetchAdminCourses,
  fetchCourseCategories,
  updateAdminCourse,
  createCourseCategory,
  updateCourseCategory,
  deleteCourseCategory,
  fetchAdminCourseBundles,
  createAdminCourseBundle,
  updateAdminCourseBundle,
  deleteAdminCourseBundle,
} from "../../../utils/coursesApi";
import { Button } from "../../../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import { Input } from "../../../components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "../../../components/ui/tabs";
import { Separator } from "../../../components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../../components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../../../components/ui/dialog";
import {
  Search,
  Plus,
  ChevronRight,
  X,
  MoreHorizontal,
  Edit2,
  Trash2,
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";

function extractVimeoId(url) {
  if (!url || typeof url !== "string") return null;
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.includes("vimeo.com")) return null;
    const parts = parsed.pathname.split("/").filter(Boolean);
    const last = parts[parts.length - 1] || "";
    return /^\d+$/.test(last) ? last : null;
  } catch (_) {
    return null;
  }
}

function resolveCourseVimeoId(course) {
  if (!course || typeof course !== "object") return null;
  const rawId =
    typeof course.vimeoId === "string" && course.vimeoId.trim().length > 0
      ? course.vimeoId.trim()
      : null;
  if (rawId) return rawId;
  return extractVimeoId(course.vimeoUrl);
}

const SUBTITLE_TRANSLATION_LANGUAGES = [
  { code: "ro", label: "Romanian", nativeLabel: "Română" },
  { code: "es", label: "Spanish", nativeLabel: "Español" },
  { code: "fr", label: "French", nativeLabel: "Français" },
  { code: "de", label: "German", nativeLabel: "Deutsch" },
  { code: "it", label: "Italian", nativeLabel: "Italiano" },
  { code: "pt", label: "Portuguese", nativeLabel: "Português" },
  { code: "pl", label: "Polish", nativeLabel: "Polski" },
  { code: "cs", label: "Czech", nativeLabel: "Čeština" },
  { code: "el", label: "Greek", nativeLabel: "Ελληνικά" },
];
const DEFAULT_SUBTITLE_TRANSLATION_LANGUAGE_CODES = SUBTITLE_TRANSLATION_LANGUAGES.map(
  (language) => language.code
);

export default function CoursesDashboardPage() {
  const { loading: authLoading } = useAuth();

  // Courses state
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters & pagination
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  // Sheet state (add/edit course)
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [saving, setSaving] = useState(false);
  const [editingCourseLoading, setEditingCourseLoading] = useState(false);
  const [sheetError, setSheetError] = useState("");

  // Categories state
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categoryError, setCategoryError] = useState("");
  const [categorySheetOpen, setCategorySheetOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categorySaving, setCategorySaving] = useState(false);
  const [categorySheetError, setCategorySheetError] = useState("");

  // Tab state
  const [viewTab, setViewTab] = useState("courses");
  const [bundles, setBundles] = useState([]);
  const [bundlesLoading, setBundlesLoading] = useState(true);
  const [bundleDialogOpen, setBundleDialogOpen] = useState(false);
  const [editingBundle, setEditingBundle] = useState(null);
  const [bundleSaving, setBundleSaving] = useState(false);
  const [bundleError, setBundleError] = useState("");

  // Subtitles tab state
  const [subtitleFile, setSubtitleFile] = useState(null);
  const [subtitleLoading, setSubtitleLoading] = useState(false);
  const [subtitleError, setSubtitleError] = useState("");
  const [subtitlePreview, setSubtitlePreview] = useState("");
  const [subtitleDownloadUrl, setSubtitleDownloadUrl] = useState("");
  const [subtitleLanguage, setSubtitleLanguage] = useState("ro");
  const [subtitleDownloadName, setSubtitleDownloadName] = useState("subtitrare.ro.srt");

  // Subtitle translations tab state (EN SRT -> 9 languages)
  const [subtitleTranslationFile, setSubtitleTranslationFile] = useState(null);
  const [subtitleTranslationLoading, setSubtitleTranslationLoading] = useState(false);
  const [subtitleTranslationError, setSubtitleTranslationError] = useState("");
  const [subtitleTranslationResult, setSubtitleTranslationResult] = useState("");
  const [subtitleTranslationDownloadUrl, setSubtitleTranslationDownloadUrl] = useState("");
  const [subtitleTranslationDownloadName, setSubtitleTranslationDownloadName] = useState(
    "subtitrari.multilang.srt.zip"
  );
  const [selectedSubtitleTranslationLanguages, setSelectedSubtitleTranslationLanguages] = useState(
    DEFAULT_SUBTITLE_TRANSLATION_LANGUAGE_CODES
  );
  const [subtitleTranslationProgress, setSubtitleTranslationProgress] = useState(0);
  const [subtitleTranslationStageText, setSubtitleTranslationStageText] = useState("");
  const [subtitleTranslationProgressVisible, setSubtitleTranslationProgressVisible] = useState(false);
  const [subtitleTranslationStartedAt, setSubtitleTranslationStartedAt] = useState(null);

  const subtitleTranslationProgressIntervalRef = useRef(null);
  const subtitleTranslationProgressHideTimeoutRef = useRef(null);

  // Delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState(null);
  const [videoDialogOpen, setVideoDialogOpen] = useState(false);
  const [courseToPreview, setCourseToPreview] = useState(null);

  const clearSubtitleTranslationTimers = () => {
    if (subtitleTranslationProgressIntervalRef.current) {
      clearInterval(subtitleTranslationProgressIntervalRef.current);
      subtitleTranslationProgressIntervalRef.current = null;
    }

    if (subtitleTranslationProgressHideTimeoutRef.current) {
      clearTimeout(subtitleTranslationProgressHideTimeoutRef.current);
      subtitleTranslationProgressHideTimeoutRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      clearSubtitleTranslationTimers();
      if (subtitleDownloadUrl) {
        URL.revokeObjectURL(subtitleDownloadUrl);
      }
      if (subtitleTranslationDownloadUrl) {
        URL.revokeObjectURL(subtitleTranslationDownloadUrl);
      }
    };
  }, [subtitleDownloadUrl, subtitleTranslationDownloadUrl]);

  // Load courses
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        console.info("[courses] loading courses");
        const items = await fetchAdminCourses();
        console.info("[courses] loaded courses", { count: items.length });
        if (mounted) setCourses(items);
      } catch (err) {
        console.error("[courses] failed to load courses", err);
        if (mounted) setError(err.message || "Nu am putut încărca cursurile.");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const refreshBundles = async () => {
    setBundlesLoading(true);
    setBundleError("");
    try {
      setBundles(await fetchAdminCourseBundles());
    } catch (err) {
      setBundleError(err.message || "Nu am putut încărca trilogiile.");
    } finally {
      setBundlesLoading(false);
    }
  };

  useEffect(() => {
    void refreshBundles();
  }, []);

  // Load categories
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setCategoriesLoading(true);
      setCategoryError("");
      try {
        console.info("[categories] loading categories");
        const items = await fetchCourseCategories();
        console.info("[categories] loaded categories", { count: items.length });
        if (mounted) setCategories(items);
      } catch (err) {
        console.error("[categories] failed to load categories", err);
        if (mounted) setCategoryError(err.message || "Nu am putut încărca categoriile.");
      } finally {
        if (mounted) setCategoriesLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  // Derived data
  const categoryMap = useMemo(() => {
    return categories.reduce((acc, category) => {
      acc[category.id] = category.name;
      return acc;
    }, {});
  }, [categories]);

  const filtered = useMemo(() => {
    const lower = search.trim().toLowerCase();
    return courses.filter((course) => {
      const matchesSearch = !lower || course.title.toLowerCase().includes(lower);
      const matchesStatus = status === "all" || course.status === status;
      return matchesSearch && matchesStatus;
    });
  }, [courses, search, status]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const stats = useMemo(() => {
    const total = courses.length;
    const published = courses.filter((c) => c.status === "published").length;
    const draft = courses.filter((c) => c.status === "draft").length;
    const scheduled = courses.filter((c) => c.status === "scheduled").length;
    const archived = courses.filter((c) => c.status === "archived").length;
    return { total, published, draft, scheduled, archived };
  }, [courses]);

  // Handlers
  const openCreateSheet = () => {
    setEditingCourse(null);
    setSheetError("");
    setSheetOpen(true);
  };

  const openEditSheet = async (course) => {
    setEditingCourse(course);
    setSheetError("");
    setSheetOpen(true);
    setEditingCourseLoading(true);
    try {
      const fullCourse = await fetchAdminCourse(course.id);
      setEditingCourse(fullCourse);
    } catch (err) {
      console.error("[courses] load_edit_course_fail", {
        courseId: course?.id || null,
        message: err?.message || "unknown_error",
      });
      setSheetError(err.message || "Nu am putut incarca continutul complet al cursului.");
    } finally {
      setEditingCourseLoading(false);
    }
  };

  const closeSheet = () => {
    if (saving || editingCourseLoading) return;
    setSheetOpen(false);
    setEditingCourse(null);
    setSheetError("");
    setEditingCourseLoading(false);
  };

  const handleSaveCourse = async (payload) => {
    setSaving(true);
    setSheetError("");
    try {
      if (editingCourse) {
        await updateAdminCourse(editingCourse.id, payload);
      } else {
        await createAdminCourse(payload);
      }
      const items = await fetchAdminCourses();
      setCourses(items);
      setSheetOpen(false);
      setEditingCourse(null);
    } catch (err) {
      console.error("[courses] save_fail", {
        courseId: editingCourse?.id || null,
        message: err?.message || "unknown_error",
      });
      setSheetError(err.message || "Nu am putut salva cursul.");
    } finally {
      setSaving(false);
      setEditingCourseLoading(false);
    }
  };

  const openDeleteDialog = (course) => {
    setCourseToDelete(course);
    setDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setCourseToDelete(null);
    setDeleteDialogOpen(false);
  };

  const confirmDelete = async () => {
    if (!courseToDelete) return;
    try {
      await deleteAdminCourse(courseToDelete.id);
      const items = await fetchAdminCourses();
      setCourses(items);
      closeDeleteDialog();
    } catch (err) {
      console.error("[courses] delete_fail", {
        courseId: courseToDelete?.id || null,
        message: err?.message || "unknown_error",
      });
      setError(err.message || "Ștergerea a eșuat.");
    }
  };

  const openVideoDialog = (course) => {
    const vimeoId = resolveCourseVimeoId(course);
    console.info("[courses] test_video_open", {
      courseId: course?.id || null,
      hasVimeoId: Boolean(vimeoId),
    });
    setCourseToPreview(course || null);
    setVideoDialogOpen(true);
  };

  const closeVideoDialog = () => {
    setVideoDialogOpen(false);
    setCourseToPreview(null);
  };

  const handleTogglePublish = async (course) => {
    try {
      const purchaseCount = Number(course.purchaseCount || 0);
      const nextStatus =
        course.status === "published"
          ? purchaseCount > 0
            ? "archived"
            : "draft"
          : "published";
      await updateAdminCourse(course.id, { status: nextStatus });
      const items = await fetchAdminCourses();
      setCourses(items);
    } catch (err) {
      console.error("[courses] toggle_publish_fail", {
        courseId: course?.id || null,
        message: err?.message || "unknown_error",
      });
      setError(err.message || "Nu am putut actualiza statusul.");
    }
  };

  const handleDuplicate = async (course) => {
    try {
      await createAdminCourse({
        title: `${course.title} (copie)`,
        description: course.description || "",
        vimeoUrl: course.vimeoUrl || "",
        vimeoId: course.vimeoId || null,
        categoryIds: Array.isArray(course.categoryIds) ? course.categoryIds : [],
        price: course.price || 0,
        currency: course.currency || "RON",
        status: "draft",
        featuredOnHome: false,
        sitePremiumAccess: course.sitePremiumAccess === true,
        scheduledAt: null,
        thumbnailUrl: null,
        curriculumLessons: Array.isArray(course.curriculumLessons)
          ? course.curriculumLessons.map((lesson, index) => ({
              id: lesson?.id || `lesson-${index + 1}`,
              title: lesson?.title || "",
              durationMinutes:
                typeof lesson?.durationMinutes === "number" ? lesson.durationMinutes : null,
              summary: lesson?.summary || "",
              isCompleted: lesson?.isCompleted === true,
              order: typeof lesson?.order === "number" ? lesson.order : index,
            }))
          : [],
        notesContent: typeof course.notesContent === "string" ? course.notesContent : "",
        contactContent: typeof course.contactContent === "string" ? course.contactContent : "",
        locales: course.locales || undefined,
      });
      const items = await fetchAdminCourses();
      setCourses(items);
    } catch (err) {
      console.error("[courses] duplicate_fail", {
        courseId: course?.id || null,
        message: err?.message || "unknown_error",
      });
      setError(err.message || "Nu am putut duplica cursul.");
    }
  };

  const openCreateBundle = () => {
    setEditingBundle(null);
    setBundleError("");
    setBundleDialogOpen(true);
  };

  const openEditBundle = (bundle) => {
    setEditingBundle(bundle);
    setBundleError("");
    setBundleDialogOpen(true);
  };

  const handleSaveBundle = async (payload) => {
    setBundleSaving(true);
    setBundleError("");
    try {
      if (editingBundle) {
        await updateAdminCourseBundle(editingBundle.id, payload);
      } else {
        await createAdminCourseBundle(payload);
      }
      await refreshBundles();
      setBundleDialogOpen(false);
      setEditingBundle(null);
    } catch (err) {
      setBundleError(err.message || "Nu am putut salva trilogia.");
    } finally {
      setBundleSaving(false);
    }
  };

  const handleDeleteBundle = async (bundle) => {
    if (!window.confirm(`Ștergi sau arhivezi trilogia "${bundle.title}"?`)) return;
    setBundleError("");
    try {
      await deleteAdminCourseBundle(bundle.id);
      await refreshBundles();
    } catch (err) {
      setBundleError(err.message || "Nu am putut elimina trilogia.");
    }
  };

  const resetFilters = () => {
    setSearch("");
    setStatus("all");
    setPage(1);
  };

  const handleSubtitleFileChange = (event) => {
    const nextFile = event.target.files?.[0] || null;
    setSubtitleFile(nextFile);
    setSubtitleError("");
    setSubtitlePreview("");

    if (subtitleDownloadUrl) {
      URL.revokeObjectURL(subtitleDownloadUrl);
      setSubtitleDownloadUrl("");
    }
  };

  const handleSubtitleLanguageChange = (event) => {
    const nextLanguage = event.target.value === "en" ? "en" : "ro";
    setSubtitleLanguage(nextLanguage);
    setSubtitleError("");
    setSubtitlePreview("");

    if (subtitleDownloadUrl) {
      URL.revokeObjectURL(subtitleDownloadUrl);
      setSubtitleDownloadUrl("");
    }

    setSubtitleDownloadName(`subtitrare.${nextLanguage}.srt`);
  };

  const handleGenerateSubtitles = async (event) => {
    event.preventDefault();
    if (!subtitleFile) {
      setSubtitleError("Selectează un fișier video/audio.");
      return;
    }

    setSubtitleLoading(true);
    setSubtitleError("");
    setSubtitlePreview("");

    try {
      const formData = new FormData();
      formData.append("video", subtitleFile);
      formData.append("language", subtitleLanguage);
      formData.append(
        "mode",
        subtitleLanguage === "en" ? "translate-to-en" : "transcribe"
      );

      const response = await fetch("/api/transcribe-ro-srt", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        let message = "Generarea subtitrării a eșuat.";
        const rawError = await response.text();
        try {
          const parsed = JSON.parse(rawError);
          message = parsed?.error || rawError || message;
        } catch (_) {
          message = rawError || message;
        }
        throw new Error(message);
      }

      const outputBlob = await response.blob();
      const contentDisposition = response.headers.get("content-disposition");
      const matchedFilename = contentDisposition?.match(/filename="([^"]+)"/i);
      const suggestedFilename = matchedFilename?.[1] || `subtitrare.${subtitleLanguage}.srt`;

      if (subtitleDownloadUrl) {
        URL.revokeObjectURL(subtitleDownloadUrl);
      }
      const nextUrl = URL.createObjectURL(outputBlob);
      setSubtitleDownloadUrl(nextUrl);
      setSubtitleDownloadName(suggestedFilename);

      const srtText = await outputBlob.text();
      setSubtitlePreview(srtText.slice(0, 3000));
    } catch (err) {
      setSubtitleError(err.message || "Eroare neașteptată.");
    } finally {
      setSubtitleLoading(false);
    }
  };

  const handleSubtitleTranslationFileChange = (event) => {
    const nextFile = event.target.files?.[0] || null;
    setSubtitleTranslationFile(nextFile);
    setSubtitleTranslationError("");
    setSubtitleTranslationResult("");
    setSubtitleTranslationProgress(0);
    setSubtitleTranslationStageText("");
    setSubtitleTranslationProgressVisible(false);
    setSubtitleTranslationStartedAt(null);
    clearSubtitleTranslationTimers();

    if (subtitleTranslationDownloadUrl) {
      URL.revokeObjectURL(subtitleTranslationDownloadUrl);
      setSubtitleTranslationDownloadUrl("");
    }
  };

  const handleSelectAllSubtitleTranslationLanguages = () => {
    setSelectedSubtitleTranslationLanguages(DEFAULT_SUBTITLE_TRANSLATION_LANGUAGE_CODES);
    setSubtitleTranslationError("");
    setSubtitleTranslationResult("");
  };

  const handleResetSubtitleTranslationLanguages = () => {
    setSelectedSubtitleTranslationLanguages([]);
    setSubtitleTranslationError("");
    setSubtitleTranslationResult("");
  };

  const handleToggleSubtitleTranslationLanguage = (languageCode) => {
    setSelectedSubtitleTranslationLanguages((currentSelection) => {
      if (currentSelection.includes(languageCode)) {
        return currentSelection.filter((code) => code !== languageCode);
      }
      return [...currentSelection, languageCode];
    });
    setSubtitleTranslationError("");
    setSubtitleTranslationResult("");
  };

  const handleGenerateSubtitleTranslations = async (event) => {
    event.preventDefault();
    if (!subtitleTranslationFile) {
      setSubtitleTranslationError("Selectează un fișier SRT în engleză.");
      return;
    }
    if (!selectedSubtitleTranslationLanguages.length) {
      setSubtitleTranslationError("Selectează cel puțin o limbă.");
      return;
    }

    setSubtitleTranslationLoading(true);
    setSubtitleTranslationError("");
    setSubtitleTranslationResult("");
    setSubtitleTranslationProgressVisible(true);
    setSubtitleTranslationProgress(5);

    clearSubtitleTranslationTimers();

    const selectedLanguageCodes = [...selectedSubtitleTranslationLanguages];
    const startedAtMs = Date.now();
    setSubtitleTranslationStartedAt(startedAtMs);

    const selectedLanguagePreview = selectedLanguageCodes
      .slice(0, 3)
      .map((code) => code.toUpperCase())
      .join(", ");
    const selectedLanguageSummary =
      selectedLanguageCodes.length > 3
        ? `${selectedLanguagePreview}, +${selectedLanguageCodes.length - 3}`
        : selectedLanguagePreview;

    setSubtitleTranslationStageText(`Se traduc: ${selectedLanguageSummary}`);

    const estimatedDurationMs = Math.max(24000, selectedLanguageCodes.length * 11000);
    subtitleTranslationProgressIntervalRef.current = setInterval(() => {
      const elapsedMs = Date.now() - startedAtMs;
      const progressRatio = Math.min(elapsedMs / estimatedDurationMs, 1);
      const nextProgress = Math.min(92, Math.round(5 + progressRatio * 87));

      setSubtitleTranslationProgress((currentProgress) =>
        nextProgress > currentProgress ? nextProgress : currentProgress
      );

      if (progressRatio < 0.15) {
        setSubtitleTranslationStageText("Se pregătește traducerea...");
      } else if (progressRatio < 0.8) {
        setSubtitleTranslationStageText(`Se traduc: ${selectedLanguageSummary}`);
      } else {
        setSubtitleTranslationStageText("Se pregătește arhiva ZIP...");
      }
    }, 400);

    try {
      const formData = new FormData();
      formData.append("file", subtitleTranslationFile);
      formData.append("mode", "translate-srt-multi");
      formData.append(
        "targetLanguages",
        JSON.stringify(selectedLanguageCodes)
      );

      const response = await fetch("/api/transcribe-ro-srt", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        let message = "Traducerea subtitrării a eșuat.";
        const rawError = await response.text();
        try {
          const parsed = JSON.parse(rawError);
          message = parsed?.error || rawError || message;
        } catch (_) {
          message = rawError || message;
        }
        throw new Error(message);
      }

      const outputBlob = await response.blob();
      const contentDisposition = response.headers.get("content-disposition");
      const matchedFilename = contentDisposition?.match(/filename="([^"]+)"/i);
      const suggestedFilename = matchedFilename?.[1] || "subtitrari.multilang.srt.zip";

      if (subtitleTranslationDownloadUrl) {
        URL.revokeObjectURL(subtitleTranslationDownloadUrl);
      }

      const nextUrl = URL.createObjectURL(outputBlob);
      setSubtitleTranslationDownloadUrl(nextUrl);
      setSubtitleTranslationDownloadName(suggestedFilename);
      clearSubtitleTranslationTimers();
      setSubtitleTranslationProgress(100);
      setSubtitleTranslationStageText(
        `Finalizat în ${((Date.now() - startedAtMs) / 1000).toFixed(1)}s`
      );
      setSubtitleTranslationResult(
        `Arhiva ZIP este pregătită. Conține subtitrarea tradusă în ${selectedLanguageCodes.length} ${
          selectedLanguageCodes.length === 1 ? "limbă" : "limbi"
        }.`
      );
      subtitleTranslationProgressHideTimeoutRef.current = setTimeout(() => {
        setSubtitleTranslationProgressVisible(false);
        setSubtitleTranslationProgress(0);
        setSubtitleTranslationStageText("");
        setSubtitleTranslationStartedAt(null);
        subtitleTranslationProgressHideTimeoutRef.current = null;
      }, 2800);
    } catch (err) {
      clearSubtitleTranslationTimers();
      setSubtitleTranslationProgressVisible(false);
      setSubtitleTranslationProgress(0);
      setSubtitleTranslationStageText("");
      setSubtitleTranslationStartedAt(null);
      setSubtitleTranslationError(err.message || "Eroare neașteptată.");
    } finally {
      setSubtitleTranslationLoading(false);
    }
  };

  // Category handlers
  const refreshCategories = async () => {
    setCategoriesLoading(true);
    setCategoryError("");
    try {
      const items = await fetchCourseCategories();
      setCategories(items);
    } catch (err) {
      console.error("[categories] refresh_fail", {
        message: err?.message || "unknown_error",
      });
      setCategoryError(err.message || "Nu am putut încărca categoriile.");
    } finally {
      setCategoriesLoading(false);
    }
  };

  const openCreateCategorySheet = () => {
    setEditingCategory(null);
    setCategorySheetError("");
    setCategorySheetOpen(true);
  };

  const openEditCategorySheet = (category) => {
    setEditingCategory(category);
    setCategorySheetError("");
    setCategorySheetOpen(true);
  };

  const handleSaveCategory = async (payload) => {
    setCategorySaving(true);
    setCategorySheetError("");
    try {
      if (editingCategory) {
        await updateCourseCategory(editingCategory.id, payload);
      } else {
        await createCourseCategory(payload);
      }
      await refreshCategories();
      setCategorySheetOpen(false);
      setEditingCategory(null);
    } catch (err) {
      console.error("[categories] save_fail", {
        categoryId: editingCategory?.id || null,
        message: err?.message || "unknown_error",
      });
      setCategorySheetError(err.message || "Nu am putut salva categoria.");
    } finally {
      setCategorySaving(false);
    }
  };

  const handleDeleteCategory = async (category) => {
    const confirmed = window.confirm(`Ștergi categoria "${category.name}"?`);
    if (!confirmed) return;
    setCategoryError("");
    try {
      await deleteCourseCategory(category.id);
      await refreshCategories();
    } catch (err) {
      console.error("[categories] delete_fail", {
        categoryId: category?.id || null,
        message: err?.message || "unknown_error",
      });
      const message =
        err.message || "Nu am putut șterge categoria.";
      setCategoryError(message);
    }
  };

  // Utility functions
  const formatPrice = (price) =>
    new Intl.NumberFormat("ro-RO", { maximumFractionDigits: 0 }).format(price);

  const formatUpdated = (iso) => {
    const date =
      typeof iso === "string"
        ? new Date(iso)
        : iso?.toDate
          ? iso.toDate()
          : iso?.seconds
            ? new Date(iso.seconds * 1000)
            : new Date();
    const diffMs = Date.now() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) return "astăzi";
    if (diffDays === 1) return "acum 1 zi";
    if (diffDays < 7) return `acum ${diffDays} zile`;
    return date.toLocaleDateString("ro-RO", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatScheduled = (value) => {
    if (!value) return "—";
    const date =
      typeof value === "string"
        ? new Date(value)
        : value?.toDate
          ? value.toDate()
          : value?.seconds
            ? new Date(value.seconds * 1000)
            : value instanceof Date
              ? value
              : null;
    if (!date || Number.isNaN(date.getTime())) return "—";
    return date.toLocaleString("ro-RO", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <>
      <Head>
        <title>Cursuri video - Dashboard</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <LocalPasswordGate redirectTo="/dashboard/login">
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
          {/* Header */}
          <div className="border-b border-gray-200 bg-white/80 backdrop-blur-sm">
            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
              {/* Breadcrumb */}
              <div className="mb-3 flex items-center gap-2 text-sm text-gray-600">
                <Link
                  href="/dashboard"
                  className="hover:text-gray-900 transition-colors"
                >
                  Dashboard
                </Link>
                <ChevronRight className="h-4 w-4" />
                <span className="font-medium text-gray-900">Cursuri video</span>
              </div>

              {/* Title & Actions */}
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Cursuri video</h1>
                  <p className="mt-1 text-sm text-gray-600">
                    Administrează conținutul și accesul utilizatorilor.
                  </p>
                </div>
                <Button onClick={openCreateSheet} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Adaugă curs
                </Button>
              </div>

              {/* Tabs */}
              <div className="mt-6">
                <Tabs value={viewTab} onValueChange={setViewTab}>
                  <TabsList>
                    <TabsTrigger value="courses">Cursuri</TabsTrigger>
                    <TabsTrigger value="bundles">Trilogii</TabsTrigger>
                    <TabsTrigger value="categories">Categorii</TabsTrigger>
                    {/* <TabsTrigger value="subtitles">Subtitrări SRT</TabsTrigger> */}
                    <TabsTrigger value="subtitle-translations">Traduceri SRT</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            {viewTab === "courses" ? (
              <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
                {/* Main Column */}
                <div className="space-y-6">
                  <Card className="shadow-sm">
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">Lista cursuri</CardTitle>
                          <CardDescription>
                            Filtrează, sortează și gestionează cursurile.
                          </CardDescription>
                        </div>
                        {filtered.length > 0 && (
                          <Badge variant="secondary" className="text-sm">
                            {filtered.length} {filtered.length === 1 ? "rezultat" : "rezultate"}
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Toolbar */}
                      <div className="flex flex-wrap items-center gap-4">
                        <div className="relative flex-1 min-w-[240px]">
                          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                          <Input
                            value={search}
                            onChange={(e) => {
                              setSearch(e.target.value);
                              setPage(1);
                            }}
                            placeholder="Caută după titlu..."
                            className="pl-9 pr-9"
                          />
                          {search && (
                            <button
                              onClick={() => {
                                setSearch("");
                                setPage(1);
                              }}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                        <Tabs
                          value={status}
                          onValueChange={(value) => {
                            setStatus(value);
                            setPage(1);
                          }}
                        >
                          <TabsList>
                            <TabsTrigger value="all">Toate</TabsTrigger>
                            <TabsTrigger value="published">Publicate</TabsTrigger>
                            <TabsTrigger value="draft">Ciorne</TabsTrigger>
                            <TabsTrigger value="scheduled">Programate</TabsTrigger>
                            <TabsTrigger value="archived">Arhivate</TabsTrigger>
                          </TabsList>
                        </Tabs>
                      </div>

                      <Separator />

                      {/* Content */}
                      {authLoading || loading ? (
                        <div className="flex items-center justify-center py-12">
                          <div className="flex items-center gap-3 text-sm text-gray-600">
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
                            Se încarcă...
                          </div>
                        </div>
                      ) : courses.length === 0 ? (
                        <EmptyState type="noCourses" onAction={openCreateSheet} />
                      ) : filtered.length === 0 ? (
                        <EmptyState type="noResults" onAction={resetFilters} />
                      ) : (
                        <>
                          <CoursesTable
                            courses={paged}
                            categoryMap={categoryMap}
                            onEdit={openEditSheet}
                            onTogglePublish={handleTogglePublish}
                            onDuplicate={handleDuplicate}
                            onTestVideo={openVideoDialog}
                            onDelete={openDeleteDialog}
                            formatPrice={formatPrice}
                            formatUpdated={formatUpdated}
                            formatScheduled={formatScheduled}
                          />

                          <Separator />

                          {/* Pagination */}
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">
                              Pagina {page} din {totalPages} • {filtered.length} total
                            </span>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1}
                              >
                                Înapoi
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                              >
                                Înainte
                              </Button>
                            </div>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Sidebar */}
                <div className="lg:sticky lg:top-6 lg:self-start">
                  <CoursesOverview stats={stats} />
                </div>
              </div>
            ) : viewTab === "bundles" ? (
              <Card className="shadow-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <CardTitle className="text-lg">Trilogii de mini-cursuri</CardTitle>
                      <CardDescription>
                        Fiecare ofertă conține exact 3 cursuri și are un preț unic.
                      </CardDescription>
                    </div>
                    <Button onClick={openCreateBundle} className="gap-2">
                      <Plus className="h-4 w-4" />
                      Adaugă trilogie
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {bundleError ? (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      {bundleError}
                    </div>
                  ) : null}
                  {bundlesLoading ? (
                    <div className="py-10 text-center text-sm text-gray-600">Se încarcă...</div>
                  ) : bundles.length === 0 ? (
                    <div className="rounded-lg border border-dashed p-8 text-center text-sm text-gray-600">
                      Nu există trilogii configurate.
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Titlu</TableHead>
                          <TableHead>Cursuri</TableHead>
                          <TableHead>Preț</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Achiziții</TableHead>
                          <TableHead className="text-right">Acțiuni</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {bundles.map((bundle) => (
                          <TableRow key={bundle.id}>
                            <TableCell className="font-medium">{bundle.title}</TableCell>
                            <TableCell>
                              <div className="max-w-xs text-xs text-gray-600">
                                {(bundle.courses || []).map((course) => course.title).join(" • ")}
                              </div>
                            </TableCell>
                            <TableCell>
                              {formatPrice(bundle.price)} {bundle.currency}
                            </TableCell>
                            <TableCell>
                              <Badge variant={bundle.status === "published" ? "default" : "secondary"}>
                                {bundle.status}
                              </Badge>
                            </TableCell>
                            <TableCell>{bundle.purchaseCount || 0}</TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => openEditBundle(bundle)}>
                                    <Edit2 className="mr-2 h-4 w-4" />
                                    Editează
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-red-600"
                                    onClick={() => handleDeleteBundle(bundle)}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    {Number(bundle.purchaseCount || 0) > 0 ? "Arhivează" : "Șterge"}
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            ) : viewTab === "categories" ? (
              // Categories Tab
              <Card className="shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">Categorii de cursuri</CardTitle>
                  <CardDescription>
                    Gestionează categoriile pentru o organizare mai bună.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Add Category */}
                  <div className="flex flex-wrap items-center gap-3">
                    <Button onClick={openCreateCategorySheet} className="gap-2">
                      <Plus className="h-4 w-4" />
                      Adaugă categorie
                    </Button>
                  </div>

                  {categoryError && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      {categoryError}
                    </div>
                  )}

                  <Separator />

                  {/* Categories List */}
                  {categoriesLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
                        Se încarcă...
                      </div>
                    </div>
                  ) : categories.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50/50 p-8 text-center">
                      <p className="text-sm text-gray-600">
                        Nu există categorii încă. Adaugă prima categorie mai sus.
                      </p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nume</TableHead>
                          <TableHead className="w-[120px] text-right">Acțiuni</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {categories.map((category) => (
                          <TableRow key={category.id} className="group">
                            <TableCell>
                              <span className="font-medium text-gray-900">
                                {category.name}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-gray-700 opacity-70 hover:opacity-100"
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => openEditCategorySheet(category)}
                                  >
                                    <Edit2 className="mr-2 h-4 w-4" />
                                    Editează
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-red-600 focus:text-red-600"
                                    onClick={() => handleDeleteCategory(category)}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Șterge
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            ) : viewTab === "subtitles" ? (
              // Subtitles Tab (media -> SRT)
              <Card className="shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">
                    Generator subtitrări SRT ({subtitleLanguage.toUpperCase()})
                  </CardTitle>
                  <CardDescription>
                    Încarcă un fișier video/audio, iar OpenAI îți generează subtitrare în{" "}
                    {subtitleLanguage === "en" ? "engleză" : "română"}.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <form onSubmit={handleGenerateSubtitles} className="space-y-4">
                    <div className="space-y-2">
                      <label
                        htmlFor="subtitle-language"
                        className="text-sm font-medium text-gray-700"
                      >
                        Limba subtitrării
                      </label>
                      <select
                        id="subtitle-language"
                        value={subtitleLanguage}
                        onChange={handleSubtitleLanguageChange}
                        className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
                      >
                        <option value="ro">Română (RO)</option>
                        <option value="en">English (EN)</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="subtitle-upload"
                        className="text-sm font-medium text-gray-700"
                      >
                        Fișier video/audio
                      </label>
                      <input
                        id="subtitle-upload"
                        type="file"
                        accept="video/*,audio/*"
                        onChange={handleSubtitleFileChange}
                        className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
                      />
                      <p className="text-xs text-gray-500">
                        {subtitleFile
                          ? `${subtitleFile.name} • ${(subtitleFile.size / (1024 * 1024)).toFixed(
                              2
                            )} MB`
                          : "Nu ai selectat încă un fișier."}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <Button type="submit" disabled={subtitleLoading}>
                        {subtitleLoading ? "Se generează..." : "Generează subtitrarea"}
                      </Button>
                      {subtitleDownloadUrl && (
                        <Button asChild variant="outline">
                          <a href={subtitleDownloadUrl} download={subtitleDownloadName}>
                            Descarcă SRT
                          </a>
                        </Button>
                      )}
                    </div>
                  </form>

                  {subtitleError && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      {subtitleError}
                    </div>
                  )}

                  {subtitlePreview && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-700">
                          Preview subtitrare (primele 3000 caractere)
                        </p>
                        <pre className="max-h-80 overflow-auto rounded-lg border border-gray-200 bg-gray-50 p-4 text-xs text-gray-700">
                          {subtitlePreview}
                        </pre>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            ) : (
              // Subtitle translations tab (EN SRT -> multi-language ZIP)
              <Card className="shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">Traduceri subtitrări SRT (EN -&gt; 9 limbi)</CardTitle>
                  <CardDescription>
                    Încarcă un fișier SRT în engleză și primești automat o arhivă ZIP cu
                    subtitrarea tradusă în RO, ES, FR, DE, IT, PT, PL, CS și EL.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <form onSubmit={handleGenerateSubtitleTranslations} className="space-y-4">
                    <div className="space-y-2">
                      <label
                        htmlFor="subtitle-translation-upload"
                        className="text-sm font-medium text-gray-700"
                      >
                        Fișier SRT în engleză
                      </label>
                      <input
                        id="subtitle-translation-upload"
                        type="file"
                        accept=".srt,text/plain,application/x-subrip"
                        onChange={handleSubtitleTranslationFileChange}
                        className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
                      />
                      <p className="text-xs text-gray-500">
                        {subtitleTranslationFile
                          ? `${subtitleTranslationFile.name} • ${(
                              subtitleTranslationFile.size /
                              (1024 * 1024)
                            ).toFixed(2)} MB`
                          : "Nu ai selectat încă un fișier SRT."}
                      </p>
                    </div>

                    <div className="space-y-3 rounded-xl border border-gray-200 bg-gray-50/80 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-medium text-gray-800">Limbi țintă</p>
                        <div className="flex flex-wrap items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleSelectAllSubtitleTranslationLanguages}
                            disabled={subtitleTranslationLoading}
                          >
                            Selectează toate
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleResetSubtitleTranslationLanguages}
                            disabled={subtitleTranslationLoading}
                          >
                            Resetează
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {SUBTITLE_TRANSLATION_LANGUAGES.map((language) => {
                          const isChecked = selectedSubtitleTranslationLanguages.includes(language.code);
                          return (
                            <label
                              key={language.code}
                              className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 text-sm transition ${
                                isChecked
                                  ? "border-indigo-300 bg-indigo-50 text-indigo-900"
                                  : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                              }`}
                            >
                              <input
                                type="checkbox"
                                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                checked={isChecked}
                                disabled={subtitleTranslationLoading}
                                onChange={() => handleToggleSubtitleTranslationLanguage(language.code)}
                              />
                              <span className="leading-tight">
                                <span className="font-medium">
                                  {language.code.toUpperCase()} — {language.nativeLabel}
                                </span>
                                <span className="block text-xs text-gray-500">{language.label}</span>
                              </span>
                            </label>
                          );
                        })}
                      </div>

                      <p className="text-xs text-gray-500">
                        Selectate: {selectedSubtitleTranslationLanguages.length}/
                        {SUBTITLE_TRANSLATION_LANGUAGES.length}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <Button type="submit" disabled={subtitleTranslationLoading}>
                        {subtitleTranslationLoading
                          ? "Se traduc subtitrările..."
                          : `Tradu în ${selectedSubtitleTranslationLanguages.length} ${
                              selectedSubtitleTranslationLanguages.length === 1 ? "limbă" : "limbi"
                            }`}
                      </Button>
                      {subtitleTranslationDownloadUrl && (
                        <Button asChild variant="outline">
                          <a
                            href={subtitleTranslationDownloadUrl}
                            download={subtitleTranslationDownloadName}
                          >
                            Descarcă ZIP
                          </a>
                        </Button>
                      )}
                    </div>

                    {subtitleTranslationProgressVisible && (
                      <div className="space-y-2 pt-1">
                        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-500 ease-out"
                            style={{ width: `${subtitleTranslationProgress}%` }}
                          />
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-gray-600">
                          <span>{subtitleTranslationStageText || "Se procesează..."}</span>
                          <span className="font-medium">
                            {subtitleTranslationProgress}%{" "}
                            {subtitleTranslationLoading && subtitleTranslationStartedAt
                              ? `• ${Math.max(
                                  0,
                                  Math.floor((Date.now() - subtitleTranslationStartedAt) / 1000)
                                )}s`
                              : ""}
                          </span>
                        </div>
                      </div>
                    )}
                  </form>

                  {subtitleTranslationError && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      {subtitleTranslationError}
                    </div>
                  )}

                  {subtitleTranslationResult && (
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                      {subtitleTranslationResult}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Course Sheet (Add/Edit) */}
        <CourseSheet
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          editingCourse={editingCourse}
          onSubmit={handleSaveCourse}
          loading={saving || editingCourseLoading}
          error={sheetError}
          categories={categories}
        />

        <CategorySheet
          open={categorySheetOpen}
          onOpenChange={setCategorySheetOpen}
          editingCategory={editingCategory}
          onSubmit={handleSaveCategory}
          loading={categorySaving}
          error={categorySheetError}
        />

        <Dialog open={bundleDialogOpen} onOpenChange={setBundleDialogOpen}>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
            <DialogHeader>
              <DialogTitle>
                {editingBundle ? "Editează trilogia" : "Adaugă trilogie"}
              </DialogTitle>
              <DialogDescription>
                Selectează exact trei cursuri existente și setează prețul ofertei.
              </DialogDescription>
            </DialogHeader>
            <BundleForm
              initialValue={editingBundle}
              courses={courses}
              loading={bundleSaving}
              onSubmit={handleSaveBundle}
              onCancel={() => setBundleDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>

        {/* Delete / Archive Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {Number(courseToDelete?.purchaseCount || 0) > 0
                  ? "Confirmare arhivare"
                  : "Confirmare ștergere"}
              </DialogTitle>
              <DialogDescription>
                {Number(courseToDelete?.purchaseCount || 0) > 0 ? (
                  <>
                    <span className="font-semibold text-gray-900">
                      {Number(courseToDelete.purchaseCount)} clienți
                    </span>{" "}
                    au cumpărat cursul{" "}
                    <span className="font-semibold text-gray-900">
                      &quot;{courseToDelete?.title}&quot;
                    </span>
                    . Cursul va dispărea din magazin, dar rămâne accesibil cumpărătorilor în
                    Cursurile mele.
                  </>
                ) : (
                  <>
                    Ești sigur că vrei să ștergi cursul{" "}
                    <span className="font-semibold text-gray-900">
                      &quot;{courseToDelete?.title}&quot;
                    </span>
                    ? Această acțiune nu poate fi anulată.
                  </>
                )}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={closeDeleteDialog}>
                Anulează
              </Button>
              <Button variant="destructive" onClick={confirmDelete}>
                {Number(courseToDelete?.purchaseCount || 0) > 0
                  ? "Arhivează"
                  : "Șterge cursul"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={videoDialogOpen}
          onOpenChange={(nextOpen) => {
            if (!nextOpen) {
              closeVideoDialog();
              return;
            }
            setVideoDialogOpen(true);
          }}
        >
          <DialogContent className="sm:max-w-3xl">
            <DialogHeader>
              <DialogTitle>Test video</DialogTitle>
              <DialogDescription>
                Verifică playerul Vimeo pentru cursul{" "}
                <span className="font-semibold text-gray-900">"{courseToPreview?.title}"</span>.
              </DialogDescription>
            </DialogHeader>

            {resolveCourseVimeoId(courseToPreview) ? (
              <div className="overflow-hidden rounded-xl border border-gray-200">
                <div className="relative w-full pt-[56.25%]">
                  <iframe
                    title={`Test video ${courseToPreview?.title || ""}`}
                    src={`https://player.vimeo.com/video/${resolveCourseVimeoId(
                      courseToPreview
                    )}?title=0&byline=0&portrait=0`}
                    className="absolute inset-0 h-full w-full"
                    allow="autoplay; fullscreen; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                Cursul nu are un video Vimeo valid pentru test.
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={closeVideoDialog}>
                Închide
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </LocalPasswordGate>
    </>
  );
}
