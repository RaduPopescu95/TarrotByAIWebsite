import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { LANGUAGE_LABELS } from "../../data/constants";
import { SITE_LOCALES } from "../../lib/siteLocales";
import { gTranslateFetch } from "../../utils/apiUtils";

const DEFAULT_CURRENCY = "RON";

function isFreeCoursePrice(price) {
  if (price === "" || price === null || price === undefined) return false;
  const numeric = Number(price);
  return Number.isFinite(numeric) && numeric === 0;
}

const PLATFORM_OPTIONS = [
  { value: "youtube", label: "YouTube" },
  { value: "vimeo", label: "Vimeo" },
  { value: "bunny", label: "Bunny Stream" },
];

function normalizePlatform(value) {
  if (value === "youtube" || value === "vimeo" || value === "bunny") return value;
  return "vimeo";
}

function getVideoUrlLabel(platform) {
  if (platform === "bunny") return "URL Bunny Stream";
  if (platform === "youtube") return "Link YouTube";
  return "URL Vimeo";
}

function getVideoUrlPlaceholder(platform) {
  if (platform === "bunny") {
    return "https://iframe.mediadelivery.net/embed/{libraryId}/{videoId}";
  }
  if (platform === "youtube") {
    return "https://www.youtube.com/watch?v=...";
  }
  return "https://vimeo.com/123456789";
}

function resolveInitialVideoUrl(initialValue) {
  if (typeof initialValue?.videoUrl === "string" && initialValue.videoUrl.trim()) {
    return initialValue.videoUrl.trim();
  }
  if (typeof initialValue?.vimeoUrl === "string" && initialValue.vimeoUrl.trim()) {
    return initialValue.vimeoUrl.trim();
  }
  return "";
}

function resolveInitialLocaleVideoUrls(initialValue) {
  const fromInitial = initialValue?.localeVideoUrls || initialValue?.localeVimeoUrls;
  if (fromInitial && typeof fromInitial === "object" && !Array.isArray(fromInitial)) {
    return { ...fromInitial };
  }
  const roUrl = resolveInitialVideoUrl(initialValue);
  return roUrl ? { ro: roUrl } : {};
}

function resolveCategoryLabel(category) {
  if (!category || typeof category !== "object") return "";
  const locales = category.locales;
  if (locales && typeof locales.ro === "string" && locales.ro.trim()) {
    return locales.ro.trim();
  }
  return typeof category.name === "string" ? category.name.trim() : "";
}

function resolveDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === "string") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  if (value?.toDate) return value.toDate();
  if (value?.seconds) return new Date(value.seconds * 1000);
  return null;
}

function toDateTimeLocal(value) {
  const date = resolveDate(value);
  if (!date) return "";
  const pad = (num) => String(num).padStart(2, "0");
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function isValidUrl(value) {
  if (!value) return false;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch (_) {
    return false;
  }
}

function extractVimeoId(url) {
  if (!url) return null;
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

function createLessonId() {
  return `lesson-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function createEmptyLesson(order = 0) {
  return {
    id: createLessonId(),
    title: "",
    durationMinutes: "",
    summary: "",
    order,
  };
}

function normalizeLessonForForm(lesson, index) {
  if (!lesson || typeof lesson !== "object") {
    return createEmptyLesson(index);
  }

  return {
    id: typeof lesson.id === "string" && lesson.id.trim() ? lesson.id.trim() : createLessonId(),
    title: typeof lesson.title === "string" ? lesson.title : "",
    durationMinutes:
      typeof lesson.durationMinutes === "number" && Number.isInteger(lesson.durationMinutes)
        ? String(lesson.durationMinutes)
        : "",
    summary: typeof lesson.summary === "string" ? lesson.summary : "",
    order: typeof lesson.order === "number" ? lesson.order : index,
  };
}

function normalizeLessonsForForm(lessons) {
  if (!Array.isArray(lessons)) return [];
  return lessons
    .map((lesson, index) => normalizeLessonForForm(lesson, index))
    .sort((left, right) => {
      if (left.order === right.order) return 0;
      return left.order - right.order;
    })
    .map((lesson, index) => ({ ...lesson, order: index }));
}

function reorderLessons(lessons = []) {
  return lessons.map((lesson, index) => ({ ...lesson, order: index }));
}

function buildOptionalString(value) {
  const normalized = typeof value === "string" ? value.trim() : "";
  return normalized.length > 0 ? normalized : undefined;
}

const GENERAL_ERROR_FIELDS = [
  "title",
  "description",
  "vimeoUrl",
  "videoUrl",
  "platform",
  "price",
  "currency",
  "status",
  "scheduledAt",
];

function normalizeLessonIdForPayload(lesson, index) {
  if (typeof lesson?.id === "string" && lesson.id.trim()) return lesson.id.trim();
  return `lesson-${index + 1}`;
}

function buildLocalizedLessonMap(lessonLocales) {
  if (!Array.isArray(lessonLocales)) return new Map();
  const normalizedLessons = lessonLocales
    .map((lesson) => {
      if (!lesson || typeof lesson !== "object" || Array.isArray(lesson)) return null;
      const id = typeof lesson.id === "string" ? lesson.id.trim() : "";
      if (!id) return null;
      return {
        id,
        title: buildOptionalString(lesson.title),
        summary: buildOptionalString(lesson.summary),
      };
    })
    .filter(Boolean);
  return new Map(normalizedLessons.map((lesson) => [lesson.id, lesson]));
}

function mergeLocalizedLessonsForLanguage(entry, baseLessons) {
  const localizedLessonMap = buildLocalizedLessonMap(entry?.curriculumLessons);
  return baseLessons.map((lesson) => {
    const localizedLesson = localizedLessonMap.get(lesson.id);
    const title = localizedLesson?.title || lesson.title;
    const summary = localizedLesson?.summary || lesson.summary;
    return {
      id: lesson.id,
      title,
      ...(summary ? { summary } : {}),
    };
  });
}

export default function CourseForm({ initialValue, onSubmit, onCancel, loading, categories }) {
  const [activeTab, setActiveTab] = useState("general");
  const [form, setForm] = useState(() => ({
    title: initialValue?.title || "",
    description: initialValue?.description || "",
    platform: normalizePlatform(initialValue?.platform),
    vimeoUrl: resolveInitialVideoUrl(initialValue),
    thumbnailUrl: typeof initialValue?.thumbnailUrl === "string" ? initialValue.thumbnailUrl : "",
    price: initialValue?.price ?? "",
    currency: initialValue?.currency || DEFAULT_CURRENCY,
    status: initialValue?.status || "draft",
    scheduledAt: toDateTimeLocal(initialValue?.scheduledAt),
    categoryIds: Array.isArray(initialValue?.categoryIds) ? initialValue.categoryIds : [],
    featuredOnHome: initialValue?.featuredOnHome === true,
    notesContent: typeof initialValue?.notesContent === "string" ? initialValue.notesContent : "",
    contactContent:
      typeof initialValue?.contactContent === "string" ? initialValue.contactContent : "",
    curriculumLessons: normalizeLessonsForForm(initialValue?.curriculumLessons),
  }));
  const [errors, setErrors] = useState({});
  const [locales, setLocales] = useState(initialValue?.locales);
  const [localeVimeoUrls, setLocaleVimeoUrls] = useState(() => resolveInitialLocaleVideoUrls(initialValue));
  const [editingLocale, setEditingLocale] = useState(null);
  const [editLocaleDraft, setEditLocaleDraft] = useState({ title: "", description: "" });
  const [isTranslating, setIsTranslating] = useState(false);
  const [translateMessage, setTranslateMessage] = useState("");
  const [showTranslateConfirm, setShowTranslateConfirm] = useState(false);
  const priceBeforeFreeRef = useRef("");
  const uiLocked = loading || isTranslating;

  useEffect(() => {
    setForm({
      title: initialValue?.title || "",
      description: initialValue?.description || "",
      platform: normalizePlatform(initialValue?.platform),
      vimeoUrl: resolveInitialVideoUrl(initialValue),
      thumbnailUrl: typeof initialValue?.thumbnailUrl === "string" ? initialValue.thumbnailUrl : "",
      price: initialValue?.price ?? "",
      currency: initialValue?.currency || DEFAULT_CURRENCY,
      status: initialValue?.status || "draft",
      scheduledAt: toDateTimeLocal(initialValue?.scheduledAt),
      categoryIds: Array.isArray(initialValue?.categoryIds) ? initialValue.categoryIds : [],
      featuredOnHome: initialValue?.featuredOnHome === true,
      notesContent: typeof initialValue?.notesContent === "string" ? initialValue.notesContent : "",
      contactContent:
        typeof initialValue?.contactContent === "string" ? initialValue.contactContent : "",
      curriculumLessons: normalizeLessonsForForm(initialValue?.curriculumLessons),
    });
    setErrors({});
    setLocales(initialValue?.locales);
    setLocaleVimeoUrls(resolveInitialLocaleVideoUrls(initialValue));
    setEditingLocale(null);
    setEditLocaleDraft({ title: "", description: "" });
    setTranslateMessage("");
    setShowTranslateConfirm(false);
    setActiveTab("general");
  }, [initialValue]);

  const vimeoId = useMemo(
    () => (form.platform === "vimeo" ? extractVimeoId(form.vimeoUrl) : null),
    [form.platform, form.vimeoUrl]
  );
  const videoUrlLabel = getVideoUrlLabel(form.platform);
  const videoUrlPlaceholder = getVideoUrlPlaceholder(form.platform);

  const localesCompleteCount = useMemo(() => {
    if (!locales || typeof locales !== "object") return 0;
    return SITE_LOCALES.filter((lang) => {
      const entry = locales[lang];
      return entry && typeof entry.title === "string" && entry.title.trim().length > 0;
    }).length;
  }, [locales]);

  const handleChange = (field) => (event) => {
    const value = event.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
    if (field === "vimeoUrl") {
      setLocaleVimeoUrls((prev) => ({ ...prev, ro: value }));
    }
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const toggleCategoryId = (categoryId) => {
    setForm((prev) => {
      const isSelected = prev.categoryIds.includes(categoryId);
      return {
        ...prev,
        categoryIds: isSelected
          ? prev.categoryIds.filter((id) => id !== categoryId)
          : [...prev.categoryIds, categoryId],
      };
    });
  };

  const handleToggleFeatured = (event) => {
    setForm((prev) => ({ ...prev, featuredOnHome: event.target.checked }));
  };

  const handleToggleFreeCourse = (event) => {
    const checked = event.target.checked;
    setForm((prev) => {
      if (checked) {
        if (!isFreeCoursePrice(prev.price)) {
          priceBeforeFreeRef.current = prev.price;
        }
        return { ...prev, price: 0 };
      }
      if (isFreeCoursePrice(prev.price)) {
        return { ...prev, price: priceBeforeFreeRef.current || "" };
      }
      return prev;
    });
  };

  const updateLessonField = (index, field, value) => {
    setForm((prev) => ({
      ...prev,
      curriculumLessons: prev.curriculumLessons.map((lesson, lessonIndex) =>
        lessonIndex === index ? { ...lesson, [field]: value } : lesson
      ),
    }));
    if (errors.curriculumLessons) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.curriculumLessons;
        return next;
      });
    }
  };

  const addLesson = () => {
    setForm((prev) => ({
      ...prev,
      curriculumLessons: [...prev.curriculumLessons, createEmptyLesson(prev.curriculumLessons.length)],
    }));
  };

  const removeLesson = (index) => {
    setForm((prev) => ({
      ...prev,
      curriculumLessons: reorderLessons(prev.curriculumLessons.filter((_, lessonIndex) => lessonIndex !== index)),
    }));
  };

  const moveLesson = (index, direction) => {
    setForm((prev) => {
      const nextLessons = [...prev.curriculumLessons];
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= nextLessons.length) return prev;
      const temp = nextLessons[index];
      nextLessons[index] = nextLessons[targetIndex];
      nextLessons[targetIndex] = temp;
      return {
        ...prev,
        curriculumLessons: reorderLessons(nextLessons),
      };
    });
  };

  const validateForm = ({ generalOnly = false } = {}) => {
    const nextErrors = {};

    if (!form.title.trim()) nextErrors.title = "Titlul este obligatoriu.";
    if (!form.description.trim()) nextErrors.description = "Descrierea este obligatorie.";
    if (!form.vimeoUrl.trim()) {
      nextErrors.vimeoUrl = "Linkul video este obligatoriu.";
      nextErrors.videoUrl = "Linkul video este obligatoriu.";
    } else if (!isValidUrl(form.vimeoUrl)) {
      nextErrors.vimeoUrl = "URL invalid.";
      nextErrors.videoUrl = "URL invalid.";
    }

    const priceValue = Number(form.price);
    if (!Number.isFinite(priceValue) || priceValue < 0) {
      nextErrors.price = "Preț invalid. Folosește 0 pentru curs gratuit.";
    }

    if (!form.currency) nextErrors.currency = "Moneda este obligatorie.";
    if (!form.status) nextErrors.status = "Statusul este obligatoriu.";

    if (form.status === "scheduled") {
      if (!form.scheduledAt) {
        nextErrors.scheduledAt = "Data publicării este obligatorie.";
      } else if (Number.isNaN(new Date(form.scheduledAt).getTime())) {
        nextErrors.scheduledAt = "Data publicării este invalidă.";
      }
    }

    if (!generalOnly && Array.isArray(form.curriculumLessons)) {
      for (const lesson of form.curriculumLessons) {
        if (!lesson.title || !lesson.title.trim()) {
          nextErrors.curriculumLessons = "Fiecare lecție trebuie să aibă un titlu.";
          break;
        }

        if (lesson.durationMinutes !== "" && lesson.durationMinutes !== null) {
          const duration = Number(lesson.durationMinutes);
          if (!Number.isInteger(duration) || duration <= 0) {
            nextErrors.curriculumLessons =
              "Durata lecției trebuie să fie un număr întreg mai mare ca 0.";
            break;
          }
        }
      }
    }

    setErrors(nextErrors);
    return {
      isValid: Object.keys(nextErrors).length === 0,
      hasGeneralErrors: GENERAL_ERROR_FIELDS.some((field) => !!nextErrors[field]),
    };
  };

  const validateGeneralTab = () => validateForm({ generalOnly: true });
  const validateAll = () => validateForm({ generalOnly: false });

  const buildCurriculumLessonsPayload = () =>
    reorderLessons(form.curriculumLessons).map((lesson, index) => ({
      id: normalizeLessonIdForPayload(lesson, index),
      title: lesson.title.trim(),
      durationMinutes:
        lesson.durationMinutes === "" || lesson.durationMinutes === null
          ? null
          : Number(lesson.durationMinutes),
      summary: lesson.summary?.trim() || "",
      order: index,
    }));

  const buildSafeLocales = (localesToSubmit, baseFields, baseLessonLocales) => {
    const hasLocales =
      localesToSubmit &&
      typeof localesToSubmit === "object" &&
      !Array.isArray(localesToSubmit) &&
      Object.keys(localesToSubmit).length > 0;

    const inputLocales = hasLocales ? localesToSubmit : {};
    const localeKeys = SITE_LOCALES;

    return localeKeys.reduce((acc, lang) => {
      const localeEntry =
        inputLocales?.[lang] &&
        typeof inputLocales[lang] === "object" &&
        !Array.isArray(inputLocales[lang])
          ? inputLocales[lang]
          : {};

      const resolvedDescription = buildOptionalString(localeEntry.description) || baseFields.description;
      const resolvedNotes = buildOptionalString(localeEntry.notesContent) || baseFields.notesContent;
      const resolvedContact = buildOptionalString(localeEntry.contactContent) || baseFields.contactContent;
      const resolvedLessons = mergeLocalizedLessonsForLanguage(localeEntry, baseLessonLocales);

      acc[lang] = {
        title: buildOptionalString(localeEntry.title) || baseFields.title,
        ...(resolvedDescription ? { description: resolvedDescription } : {}),
        ...(resolvedNotes ? { notesContent: resolvedNotes } : {}),
        ...(resolvedContact ? { contactContent: resolvedContact } : {}),
        curriculumLessons: resolvedLessons,
      };
      return acc;
    }, {});
  };

  const generateLocales = async () => {
    const baseTitle = form.title?.trim();
    if (!baseTitle) {
      setTranslateMessage("Completează titlul înainte de localizare.");
      return undefined;
    }

    setIsTranslating(true);
    setTranslateMessage("");
    try {
      const result = {};
      const languageKeys = SITE_LOCALES;
      const baseDescription = form.description?.trim() || "";
      const baseNotes = form.notesContent?.trim() || "";
      const baseContact = form.contactContent?.trim() || "";
      const lessonPayload = buildCurriculumLessonsPayload();
      const baseLessonLocales = lessonPayload.map((lesson) => ({
        id: lesson.id,
        title: lesson.title,
        ...(lesson.summary ? { summary: lesson.summary } : {}),
      }));

      for (const lang of languageKeys) {
        if (lang === "ro") {
          result[lang] = {
            title: baseTitle,
            ...(baseDescription ? { description: baseDescription } : {}),
            ...(baseNotes ? { notesContent: baseNotes } : {}),
            ...(baseContact ? { contactContent: baseContact } : {}),
            curriculumLessons: baseLessonLocales,
          };
          continue;
        }

        const [titleTranslated, descriptionTranslated, notesTranslated, contactTranslated] =
          await Promise.all([
            gTranslateFetch(baseTitle, lang),
            baseDescription ? gTranslateFetch(baseDescription, lang) : Promise.resolve(""),
            baseNotes ? gTranslateFetch(baseNotes, lang) : Promise.resolve(""),
            baseContact ? gTranslateFetch(baseContact, lang) : Promise.resolve(""),
          ]);

        const translatedLessons = await Promise.all(
          baseLessonLocales.map(async (lesson) => {
            const [titleLessonTranslated, summaryLessonTranslated] = await Promise.all([
              lesson.title ? gTranslateFetch(lesson.title, lang) : Promise.resolve(""),
              lesson.summary ? gTranslateFetch(lesson.summary, lang) : Promise.resolve(""),
            ]);
            const resolvedTitle = titleLessonTranslated || lesson.title;
            const resolvedSummary = summaryLessonTranslated || lesson.summary;
            return {
              id: lesson.id,
              title: resolvedTitle,
              ...(resolvedSummary ? { summary: resolvedSummary } : {}),
            };
          })
        );

        result[lang] = {
          title: titleTranslated || baseTitle,
          ...(descriptionTranslated || baseDescription
            ? { description: descriptionTranslated || baseDescription }
            : {}),
          ...(notesTranslated || baseNotes ? { notesContent: notesTranslated || baseNotes } : {}),
          ...(contactTranslated || baseContact
            ? { contactContent: contactTranslated || baseContact }
            : {}),
          curriculumLessons: translatedLessons,
        };
      }

      setLocales(result);
      setTranslateMessage("Localizarea s-a terminat. Poți continua.");
      return result;
    } catch (error) {
      console.error("[courses.form] translate_fail", {
        message: error?.message || "unknown_error",
      });
      setTranslateMessage("Localizarea a eșuat. Încearcă din nou.");
      return undefined;
    } finally {
      setIsTranslating(false);
    }
  };

  const submitForm = (localesToSubmit) => {
    const title = form.title.trim();
    const description = form.description.trim();
    const notesContent = form.notesContent.trim();
    const contactContent = form.contactContent.trim();
    const curriculumLessons = buildCurriculumLessonsPayload();
    const baseLessonLocales = curriculumLessons.map((lesson) => ({
      id: lesson.id,
      title: lesson.title,
      ...(lesson.summary ? { summary: lesson.summary } : {}),
    }));
    const safeLocales = buildSafeLocales(
      localesToSubmit,
      {
        title,
        description,
        notesContent,
        contactContent,
      },
      baseLessonLocales
    );

    const payload = {
      title,
      description,
      platform: form.platform,
      videoUrl: form.vimeoUrl.trim(),
      vimeoUrl: form.vimeoUrl.trim(),
      vimeoId: vimeoId || null,
      categoryIds: form.categoryIds,
      price: Number(form.price),
      currency: form.currency,
      status: form.status,
      featuredOnHome: !!form.featuredOnHome,
      sitePremiumAccess: false,
      scheduledAt:
        form.status === "scheduled" && form.scheduledAt
          ? new Date(form.scheduledAt).toISOString()
          : null,
      thumbnailUrl:
        form.platform === "bunny" && form.thumbnailUrl.trim() ? form.thumbnailUrl.trim() : null,
      curriculumLessons,
      notesContent,
      contactContent,
      locales: safeLocales,
      localeVideoUrls: buildLocaleVimeoPayload(),
      localeVimeoUrls: buildLocaleVimeoPayload(),
    };

    onSubmit(payload);
  };

  const openLocaleEditor = (lang) => {
    const entry = locales?.[lang];
    setEditingLocale(lang);
    setEditLocaleDraft({
      title: typeof entry?.title === "string" ? entry.title : "",
      description: typeof entry?.description === "string" ? entry.description : "",
    });
  };

  const saveLocaleEditor = () => {
    if (!editingLocale) return;
    const lang = editingLocale;
    setLocales((prev) => {
      const base = prev && typeof prev === "object" && !Array.isArray(prev) ? { ...prev } : {};
      const existing = base[lang] && typeof base[lang] === "object" ? { ...base[lang] } : {};
      base[lang] = {
        ...existing,
        title: editLocaleDraft.title.trim() || existing.title || form.title.trim(),
        ...(editLocaleDraft.description.trim() || existing.description
          ? { description: editLocaleDraft.description.trim() || existing.description }
          : {}),
      };
      return base;
    });
    setEditingLocale(null);
    setEditLocaleDraft({ title: "", description: "" });
  };

  const handleLocaleVimeoUrlChange = (lang) => (event) => {
    const value = event.target.value;
    setLocaleVimeoUrls((prev) => ({ ...prev, [lang]: value }));
    if (lang === "ro") {
      setForm((prev) => ({ ...prev, vimeoUrl: value }));
    }
  };

  const buildLocaleVimeoPayload = () => {
    const payload = { ...localeVimeoUrls };
    const roUrl = form.vimeoUrl.trim();
    if (roUrl) payload.ro = roUrl;
    return Object.fromEntries(
      Object.entries(payload).filter(([, url]) => typeof url === "string" && url.trim().length > 0)
    );
  };

  const confirmTranslateAndSubmit = async () => {
    setShowTranslateConfirm(false);
    const generatedLocales = await generateLocales();
    if (!generatedLocales) return;
    submitForm(generatedLocales);
  };

  const handleContinueToContent = () => {
    const { isValid } = validateGeneralTab();
    if (!isValid) return;
    setActiveTab("content");
  };

  const handleOpenContentTab = () => {
    if (activeTab === "content") {
      setActiveTab("content");
      return;
    }
    handleContinueToContent();
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (activeTab === "general") {
      handleContinueToContent();
      return;
    }
    const { isValid, hasGeneralErrors } = validateAll();
    if (!isValid) {
      if (hasGeneralErrors) setActiveTab("general");
      return;
    }
    const hasLocales =
      locales && typeof locales === "object" && !Array.isArray(locales) && Object.keys(locales).length > 0;
    if (!hasLocales) {
      setShowTranslateConfirm(true);
      return;
    }
    submitForm(locales);
  };

  return (
    <form onSubmit={handleSubmit} className="relative space-y-6">
      <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1">
        <button
          type="button"
          onClick={() => setActiveTab("general")}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
            activeTab === "general"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          General
        </button>
        <button
          type="button"
          onClick={handleOpenContentTab}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
            activeTab === "content"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Conținut curs
        </button>
      </div>

      {activeTab === "general" && (
        <div className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-900">
              Titlu cursului <span className="text-red-500">*</span>
            </label>
            <Input
              id="title"
              value={form.title}
              onChange={handleChange("title")}
              className="mt-2"
              placeholder="Ex: Curs complet de Tarot pentru începători"
              disabled={loading}
            />
            {errors.title && <p className="mt-1.5 text-xs text-red-600">{errors.title}</p>}
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-900">
              Descriere <span className="text-red-500">*</span>
            </label>
            <textarea
              id="description"
              value={form.description}
              onChange={handleChange("description")}
              rows={4}
              className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
              placeholder="Descrie conținutul și beneficiile cursului..."
              disabled={loading}
            />
            {errors.description && (
              <p className="mt-1.5 text-xs text-red-600">{errors.description}</p>
            )}
          </div>

          <div>
            <label htmlFor="platform" className="block text-sm font-medium text-gray-900">
              Platformă video <span className="text-red-500">*</span>
            </label>
            <select
              id="platform"
              value={form.platform}
              onChange={handleChange("platform")}
              className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
              disabled={loading}
            >
              {PLATFORM_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="vimeoUrl" className="block text-sm font-medium text-gray-900">
              {videoUrlLabel} <span className="text-red-500">*</span>
            </label>
            <Input
              id="vimeoUrl"
              value={form.vimeoUrl}
              onChange={handleChange("vimeoUrl")}
              className="mt-2"
              placeholder={videoUrlPlaceholder}
              disabled={loading}
            />
            {form.platform === "vimeo" && vimeoId && (
              <div className="mt-1.5 flex items-center gap-1.5 text-xs text-emerald-600">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Vimeo ID detectat: {vimeoId}
              </div>
            )}
            {(errors.vimeoUrl || errors.videoUrl) && (
              <p className="mt-1.5 text-xs text-red-600">{errors.vimeoUrl || errors.videoUrl}</p>
            )}
          </div>

          {form.platform === "bunny" ? (
            <div>
              <label htmlFor="thumbnailUrl" className="block text-sm font-medium text-gray-900">
                Thumbnail Bunny{" "}
                <span className="font-normal text-gray-600">(opțional, același pentru toate limbile)</span>
              </label>
              <Input
                id="thumbnailUrl"
                value={form.thumbnailUrl}
                onChange={handleChange("thumbnailUrl")}
                className="mt-2"
                placeholder="https://vz-....b-cdn.net/.../thumbnail.jpg"
                disabled={loading}
              />
            </div>
          ) : null}

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Categorii</label>
            {Array.isArray(categories) && categories.length > 0 ? (
              <>
                <div className="rounded-lg border border-gray-200 bg-gray-50 overflow-hidden">
                  <div className="max-h-56 overflow-y-auto overscroll-contain p-2 space-y-1">
                    {[...categories]
                      .sort((a, b) =>
                        resolveCategoryLabel(a).localeCompare(resolveCategoryLabel(b), "ro", {
                          sensitivity: "base",
                        })
                      )
                      .map((category) => {
                        const checked = form.categoryIds.includes(category.id);
                        return (
                          <label
                            key={category.id}
                            className={`flex cursor-pointer items-start gap-3 rounded-md px-2 py-2 transition-colors ${
                              checked ? "bg-white ring-1 ring-indigo-100" : "hover:bg-white/80"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleCategoryId(category.id)}
                              disabled={uiLocked}
                              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 disabled:opacity-50"
                            />
                            <span className="text-sm text-gray-900">{resolveCategoryLabel(category)}</span>
                          </label>
                        );
                      })}
                  </div>
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  {form.categoryIds.length === 0
                    ? "Nicio categorie selectată — bifează una sau mai multe."
                    : `${form.categoryIds.length} ${
                        form.categoryIds.length === 1 ? "categorie selectată" : "categorii selectate"
                      }.`}
                </p>
              </>
            ) : (
              <p className="text-xs text-gray-500">
                Nu există categorii disponibile. Creează categorii în tabul "Categorii".
              </p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-900">
                Preț <span className="text-red-500">*</span>
              </label>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={handleChange("price")}
                className="mt-2"
                placeholder="99.00"
                disabled={loading}
              />
              {errors.price && <p className="mt-1.5 text-xs text-red-600">{errors.price}</p>}
              <p className="mt-1.5 text-xs text-gray-500">0 = curs gratuit, video complet fără plată.</p>
            </div>
            <div>
              <label htmlFor="currency" className="block text-sm font-medium text-gray-900">
                Monedă <span className="text-red-500">*</span>
              </label>
              <select
                id="currency"
                value={form.currency}
                onChange={handleChange("currency")}
                className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                disabled={loading}
              >
                <option value="RON">RON (Lei)</option>
                <option value="EUR">EUR (Euro)</option>
              </select>
              {errors.currency && <p className="mt-1.5 text-xs text-red-600">{errors.currency}</p>}
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={isFreeCoursePrice(form.price)}
                onChange={handleToggleFreeCourse}
                disabled={uiLocked}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 disabled:opacity-50"
              />
              <span className="block">
                <span className="text-sm font-medium text-gray-900">Curs gratuit</span>
                <span className="mt-1 block text-xs text-gray-500">
                  Bifează pentru preț 0: oricine poate urmări video complet fără cont (dacă cursul e
                  public).
                </span>
              </span>
            </label>
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-900">
              Status <span className="text-red-500">*</span>
            </label>
            <select
              id="status"
              value={form.status}
              onChange={handleChange("status")}
              className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
              disabled={loading}
            >
              <option value="draft">Ciornă (Draft)</option>
              <option value="published">Publicat</option>
              <option value="scheduled">Programat</option>
              <option value="archived">Arhivat (retras din magazin)</option>
            </select>
            {errors.status && <p className="mt-1.5 text-xs text-red-600">{errors.status}</p>}
            <p className="mt-1.5 text-xs text-gray-500">
              {form.status === "draft" && "Cursul nu va fi vizibil utilizatorilor."}
              {form.status === "published" && "Cursul va fi disponibil public pentru achiziție."}
              {form.status === "scheduled" && "Cursul va fi publicat la o dată programată."}
              {form.status === "archived" &&
                "Cursul nu apare în magazin, dar cumpărătorii existenți îl păstrează în Cursurile mele."}
            </p>
          </div>

          <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={!!form.featuredOnHome}
                onChange={handleToggleFeatured}
                disabled={uiLocked}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 disabled:opacity-50"
              />
              <span className="block">
                <span className="text-sm font-medium text-gray-900">Curs evidențiat pe homepage</span>
                <span className="mt-1 block text-xs text-gray-500">
                  Dacă este activ, cursul apare în secțiunea de cursuri evidențiate când este public
                  vizibil.
                </span>
              </span>
            </label>
          </div>

          {form.status === "scheduled" && (
            <div>
              <label htmlFor="scheduledAt" className="block text-sm font-medium text-gray-900">
                Programare publicare <span className="text-red-500">*</span>
              </label>
              <Input
                id="scheduledAt"
                type="datetime-local"
                value={form.scheduledAt}
                onChange={handleChange("scheduledAt")}
                className="mt-2"
                disabled={loading}
              />
              {errors.scheduledAt && (
                <p className="mt-1.5 text-xs text-red-600">{errors.scheduledAt}</p>
              )}
              <p className="mt-1.5 text-xs text-gray-500">
                Cursul va fi vizibil utilizatorilor după această dată și oră.
              </p>
            </div>
          )}

        </div>
      )}

      {activeTab === "content" && (
        <div className="space-y-6">
          <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
            <h3 className="text-sm font-semibold text-gray-900">Conținut taburi</h3>
            <p className="mt-1 text-xs text-gray-500">
              Aceste texte apar în taburile publice Note și Contact pe pagina cursului.
            </p>
          </div>

          <div>
            <label htmlFor="notesContent" className="block text-sm font-medium text-gray-900">
              Note (tab public)
            </label>
            <textarea
              id="notesContent"
              value={form.notesContent}
              onChange={handleChange("notesContent")}
              rows={4}
              className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
              placeholder="Conținut pentru tabul Note..."
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="contactContent" className="block text-sm font-medium text-gray-900">
              Contact (tab public)
            </label>
            <textarea
              id="contactContent"
              value={form.contactContent}
              onChange={handleChange("contactContent")}
              rows={4}
              className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
              placeholder="Conținut pentru tabul Contact..."
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900">Localizare</label>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <Button type="button" variant="outline" onClick={generateLocales} disabled={uiLocked}>
                {isTranslating ? "Se localizează..." : "Generează localizări"}
              </Button>
              {isTranslating && (
                <span className="inline-flex items-center gap-2 text-xs text-gray-500">
                  <span className="inline-flex h-3.5 w-3.5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                  Se traduc textele...va rugam asteptati...
                </span>
              )}
              {translateMessage && (
                <span
                  className={`text-xs ${
                    translateMessage.includes("eșuat") ? "text-red-600" : "text-emerald-600"
                  }`}
                >
                  {translateMessage}
                </span>
              )}
            </div>
            <p className="mt-1.5 text-xs text-gray-500">
              Localizarea folosește titlul, descrierea, notele, contactul și lecțiile curriculum. Dacă
              nu localizezi, se salvează cu fallback RO.
            </p>
            {locales && typeof locales === "object" && Object.keys(locales).length > 0 && (
              <p className="mt-1 text-xs font-medium text-gray-700">
                {localesCompleteCount}/{SITE_LOCALES.length} limbi cu titlu localizat
              </p>
            )}
          </div>

          {locales && typeof locales === "object" && Object.keys(locales).length > 0 ? (
            <div className="overflow-hidden rounded-xl border border-gray-200">
              <div className="border-b border-gray-200 bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-700">
                Localizări generate (titlu / descriere)
              </div>
              <div className="max-h-[min(30vh,280px)] overflow-y-auto overscroll-contain">
                <table className="min-w-full text-left text-sm">
                  <thead className="sticky top-0 z-[1] bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-700">
                    <tr>
                      <th className="px-4 py-2.5">Limbă</th>
                      <th className="px-4 py-2.5">Titlu</th>
                      <th className="px-4 py-2.5">Descriere</th>
                      <th className="px-4 py-2.5">Status</th>
                      <th className="px-4 py-2.5" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {SITE_LOCALES.map((lang) => {
                      const langInfo = LANGUAGE_LABELS?.[lang];
                      const langLabel =
                        typeof langInfo?.denumire === "string" && langInfo.denumire.trim()
                          ? langInfo.denumire
                          : lang;
                      const entry = locales?.[lang];
                      const titleVal = typeof entry?.title === "string" ? entry.title.trim() : "";
                      const descVal =
                        typeof entry?.description === "string" ? entry.description.trim() : "";
                      const isMissing = !titleVal;
                      return (
                        <tr key={lang}>
                          <td className="px-4 py-2.5 font-medium text-gray-900">
                            {langLabel}{" "}
                            <span className="text-xs font-normal text-gray-500">({lang})</span>
                          </td>
                          <td className="max-w-[12rem] truncate px-4 py-2.5 text-gray-700" title={titleVal}>
                            {isMissing ? <span className="text-gray-400">—</span> : titleVal}
                          </td>
                          <td
                            className="max-w-[14rem] truncate px-4 py-2.5 text-gray-700"
                            title={descVal}
                          >
                            {!descVal ? <span className="text-gray-400">—</span> : descVal}
                          </td>
                          <td className="px-4 py-2.5">
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${
                                isMissing
                                  ? "bg-amber-50 text-amber-700 ring-amber-600/20"
                                  : "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
                              }`}
                            >
                              {isMissing ? "Lipsește" : "OK"}
                            </span>
                          </td>
                          <td className="px-4 py-2.5">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => openLocaleEditor(lang)}
                              disabled={uiLocked}
                            >
                              Editează
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}

          <div>
            <label className="block text-sm font-medium text-gray-900">Link video per limbă</label>
            <p className="mt-1 text-xs text-gray-500">
              RO este obligatoriu (sau folosește URL-ul principal). Celelalte limbi sunt opționale;
              dacă lipsesc, se folosește fallback RO. Platformă selectată: {videoUrlLabel}.
            </p>
            <div className="mt-3 max-h-[min(40vh,320px)] space-y-3 overflow-y-auto rounded-lg border border-gray-200 bg-gray-50/80 p-3">
              {SITE_LOCALES.map((lang) => {
                const langLabel = LANGUAGE_LABELS?.[lang]?.denumire || lang.toUpperCase();
                const urlValue = lang === "ro" ? form.vimeoUrl : localeVimeoUrls[lang] || "";
                const hasUrl = Boolean(urlValue?.trim());
                return (
                  <div key={`vimeo-${lang}`}>
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <span className="text-xs font-medium text-gray-700">
                        {langLabel}{" "}
                        <span className="font-normal text-gray-500">({lang})</span>
                        {lang === "ro" ? (
                          <span className="ml-1 text-red-500">*</span>
                        ) : null}
                      </span>
                      <span
                        className={`text-xs font-medium ${hasUrl ? "text-emerald-600" : "text-gray-400"}`}
                      >
                        {hasUrl ? "link setat" : "opțional · lipsește"}
                      </span>
                    </div>
                    <Input
                      value={urlValue}
                      onChange={
                        lang === "ro" ? handleChange("vimeoUrl") : handleLocaleVimeoUrlChange(lang)
                      }
                      placeholder={videoUrlPlaceholder}
                      disabled={uiLocked}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Lecții curriculum</h3>
                <p className="mt-1 text-xs text-gray-500">
                  Administrezi lista de lecții afișată în sidebar pe pagina publică a cursului.
                </p>
              </div>
              <Button type="button" variant="outline" onClick={addLesson} disabled={uiLocked}>
                Adaugă lecție
              </Button>
            </div>

            {errors.curriculumLessons && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                {errors.curriculumLessons}
              </div>
            )}

            {form.curriculumLessons.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-5 text-sm text-gray-600">
                Nu există lecții încă. Apasă "Adaugă lecție" pentru a începe.
              </div>
            ) : (
              <div className="space-y-3">
                {form.curriculumLessons.map((lesson, index) => (
                  <div key={lesson.id} className="rounded-lg border border-gray-200 bg-white p-4">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-gray-900">Lecția {index + 1}</p>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => moveLesson(index, -1)}
                          disabled={uiLocked || index === 0}
                        >
                          Sus
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => moveLesson(index, 1)}
                          disabled={uiLocked || index === form.curriculumLessons.length - 1}
                        >
                          Jos
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeLesson(index)}
                          disabled={uiLocked}
                        >
                          Șterge
                        </Button>
                      </div>
                    </div>

                    <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_10rem]">
                      <div>
                        <label className="block text-xs font-medium text-gray-700">Titlu lecție</label>
                        <Input
                          value={lesson.title}
                          onChange={(event) => updateLessonField(index, "title", event.target.value)}
                          className="mt-1"
                          placeholder="Ex: Introducere"
                          disabled={uiLocked}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700">Durată (min)</label>
                        <Input
                          type="number"
                          min="1"
                          value={lesson.durationMinutes}
                          onChange={(event) =>
                            updateLessonField(index, "durationMinutes", event.target.value)
                          }
                          className="mt-1"
                          placeholder="12"
                          disabled={uiLocked}
                        />
                      </div>
                    </div>

                    <div className="mt-3">
                      <label className="block text-xs font-medium text-gray-700">Sumar lecție</label>
                      <textarea
                        value={lesson.summary}
                        onChange={(event) => updateLessonField(index, "summary", event.target.value)}
                        rows={3}
                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                        placeholder="Descriere scurtă pentru lecție..."
                        disabled={uiLocked}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
        <Button type="button" variant="outline" onClick={onCancel} disabled={uiLocked}>
          Anulează
        </Button>
        <Button
          type={activeTab === "general" ? "button" : "submit"}
          onClick={
            activeTab === "general"
              ? (event) => {
                  event.preventDefault();
                  handleContinueToContent();
                }
              : undefined
          }
          disabled={uiLocked}
        >
          {loading
            ? "Se salvează..."
            : activeTab === "general"
            ? "Continuă"
            : initialValue
            ? "Actualizează cursul"
            : "Creează cursul"}
        </Button>
      </div>

      <Dialog open={Boolean(editingLocale)} onOpenChange={(open) => !open && setEditingLocale(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Editează localizarea ({editingLocale})
            </DialogTitle>
            <DialogDescription>
              Corectează manual titlul și descrierea pentru această limbă.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="block text-sm font-medium text-gray-900">Titlu</label>
              <Input
                value={editLocaleDraft.title}
                onChange={(event) =>
                  setEditLocaleDraft((prev) => ({ ...prev, title: event.target.value }))
                }
                className="mt-2"
                disabled={uiLocked}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900">Descriere</label>
              <textarea
                value={editLocaleDraft.description}
                onChange={(event) =>
                  setEditLocaleDraft((prev) => ({ ...prev, description: event.target.value }))
                }
                rows={4}
                className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                disabled={uiLocked}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditingLocale(null)}
              disabled={uiLocked}
            >
              Anulează
            </Button>
            <Button type="button" onClick={saveLocaleEditor} disabled={uiLocked}>
              Salvează
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showTranslateConfirm} onOpenChange={setShowTranslateConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Localizările nu au fost generate</DialogTitle>
            <DialogDescription>
              Vrei să generezi localizările acum și să finalizezi salvarea cursului?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowTranslateConfirm(false)}
              disabled={uiLocked}
            >
              Editează
            </Button>
            <Button type="button" onClick={confirmTranslateAndSubmit} disabled={uiLocked}>
              {isTranslating ? "Se localizează..." : "Localizează și finalizează"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </form>
  );
}
