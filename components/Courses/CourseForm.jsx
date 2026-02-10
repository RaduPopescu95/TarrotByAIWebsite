import React, { useEffect, useMemo, useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { CheckCircle2 } from "lucide-react";
import { LANGUAGE_LABELS } from "../../data/constants";
import { gTranslateFetch } from "../../utils/apiUtils";

const DEFAULT_CURRENCY = "RON";

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
    isCompleted: false,
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
    isCompleted: lesson.isCompleted === true,
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

export default function CourseForm({ initialValue, onSubmit, onCancel, loading, categories }) {
  const [activeTab, setActiveTab] = useState("general");
  const [form, setForm] = useState(() => ({
    title: initialValue?.title || "",
    description: initialValue?.description || "",
    vimeoUrl: initialValue?.vimeoUrl || "",
    price: initialValue?.price ?? "",
    currency: initialValue?.currency || DEFAULT_CURRENCY,
    status: initialValue?.status || "draft",
    scheduledAt: toDateTimeLocal(initialValue?.scheduledAt),
    thumbnailUrl: initialValue?.thumbnailUrl || "",
    categoryIds: Array.isArray(initialValue?.categoryIds) ? initialValue.categoryIds : [],
    featuredOnHome: initialValue?.featuredOnHome === true,
    notesContent: typeof initialValue?.notesContent === "string" ? initialValue.notesContent : "",
    contactContent:
      typeof initialValue?.contactContent === "string" ? initialValue.contactContent : "",
    curriculumLessons: normalizeLessonsForForm(initialValue?.curriculumLessons),
  }));
  const [errors, setErrors] = useState({});
  const [locales, setLocales] = useState(initialValue?.locales);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translateMessage, setTranslateMessage] = useState("");
  const uiLocked = loading || isTranslating;

  useEffect(() => {
    setForm({
      title: initialValue?.title || "",
      description: initialValue?.description || "",
      vimeoUrl: initialValue?.vimeoUrl || "",
      price: initialValue?.price ?? "",
      currency: initialValue?.currency || DEFAULT_CURRENCY,
      status: initialValue?.status || "draft",
      scheduledAt: toDateTimeLocal(initialValue?.scheduledAt),
      thumbnailUrl: initialValue?.thumbnailUrl || "",
      categoryIds: Array.isArray(initialValue?.categoryIds) ? initialValue.categoryIds : [],
      featuredOnHome: initialValue?.featuredOnHome === true,
      notesContent: typeof initialValue?.notesContent === "string" ? initialValue.notesContent : "",
      contactContent:
        typeof initialValue?.contactContent === "string" ? initialValue.contactContent : "",
      curriculumLessons: normalizeLessonsForForm(initialValue?.curriculumLessons),
    });
    setErrors({});
    setLocales(initialValue?.locales);
    setTranslateMessage("");
    setActiveTab("general");
  }, [initialValue]);

  const vimeoId = useMemo(() => extractVimeoId(form.vimeoUrl), [form.vimeoUrl]);

  const handleChange = (field) => (event) => {
    const value = event.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
    if (
      field === "title" ||
      field === "description" ||
      field === "notesContent" ||
      field === "contactContent"
    ) {
      setLocales(undefined);
      if (translateMessage) setTranslateMessage("");
    }
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleCategorySelect = (event) => {
    const selected = Array.from(event.target.selectedOptions, (option) => option.value);
    setForm((prev) => ({ ...prev, categoryIds: selected }));
  };

  const handleToggleFeatured = (event) => {
    setForm((prev) => ({ ...prev, featuredOnHome: event.target.checked }));
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

  const validate = () => {
    const nextErrors = {};

    if (!form.title.trim()) nextErrors.title = "Titlul este obligatoriu.";
    if (!form.description.trim()) nextErrors.description = "Descrierea este obligatorie.";
    if (!form.vimeoUrl.trim()) nextErrors.vimeoUrl = "Linkul Vimeo este obligatoriu.";
    if (form.vimeoUrl && !isValidUrl(form.vimeoUrl)) nextErrors.vimeoUrl = "URL invalid.";

    const priceValue = Number(form.price);
    if (!Number.isFinite(priceValue) || priceValue <= 0) {
      nextErrors.price = "Prețul trebuie să fie > 0.";
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

    if (form.thumbnailUrl && !isValidUrl(form.thumbnailUrl)) {
      nextErrors.thumbnailUrl = "URL invalid.";
    }

    if (Array.isArray(form.curriculumLessons)) {
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
    return Object.keys(nextErrors).length === 0;
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
      const languageKeys = Object.keys(LANGUAGE_LABELS);
      const baseDescription = form.description?.trim() || "";
      const baseNotes = form.notesContent?.trim() || "";
      const baseContact = form.contactContent?.trim() || "";

      for (const lang of languageKeys) {
        if (lang === "ro") {
          result[lang] = {
            title: baseTitle,
            ...(baseDescription ? { description: baseDescription } : {}),
            ...(baseNotes ? { notesContent: baseNotes } : {}),
            ...(baseContact ? { contactContent: baseContact } : {}),
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

        result[lang] = {
          title: titleTranslated || baseTitle,
          ...(descriptionTranslated ? { description: descriptionTranslated } : {}),
          ...(notesTranslated ? { notesContent: notesTranslated } : {}),
          ...(contactTranslated ? { contactContent: contactTranslated } : {}),
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

    const hasLocales =
      localesToSubmit &&
      typeof localesToSubmit === "object" &&
      !Array.isArray(localesToSubmit) &&
      Object.keys(localesToSubmit).length > 0;

    const safeLocales = hasLocales
      ? {
          ...localesToSubmit,
          ro: {
            ...(localesToSubmit.ro || {}),
            title: localesToSubmit?.ro?.title?.trim() || title,
            ...(buildOptionalString(localesToSubmit?.ro?.description) || description
              ? { description: buildOptionalString(localesToSubmit?.ro?.description) || description }
              : {}),
            ...(buildOptionalString(localesToSubmit?.ro?.notesContent) || notesContent
              ? {
                  notesContent:
                    buildOptionalString(localesToSubmit?.ro?.notesContent) || notesContent,
                }
              : {}),
            ...(buildOptionalString(localesToSubmit?.ro?.contactContent) || contactContent
              ? {
                  contactContent:
                    buildOptionalString(localesToSubmit?.ro?.contactContent) || contactContent,
                }
              : {}),
          },
        }
      : {
          ro: {
            title,
            ...(description ? { description } : {}),
            ...(notesContent ? { notesContent } : {}),
            ...(contactContent ? { contactContent } : {}),
          },
        };

    const payload = {
      title,
      description,
      vimeoUrl: form.vimeoUrl.trim(),
      vimeoId: vimeoId || null,
      categoryIds: form.categoryIds,
      price: Number(form.price),
      currency: form.currency,
      status: form.status,
      featuredOnHome: !!form.featuredOnHome,
      scheduledAt:
        form.status === "scheduled" && form.scheduledAt
          ? new Date(form.scheduledAt).toISOString()
          : null,
      thumbnailUrl: form.thumbnailUrl.trim() || null,
      curriculumLessons: reorderLessons(form.curriculumLessons).map((lesson, index) => ({
        id: lesson.id || createLessonId(),
        title: lesson.title.trim(),
        durationMinutes:
          lesson.durationMinutes === "" || lesson.durationMinutes === null
            ? null
            : Number(lesson.durationMinutes),
        summary: lesson.summary?.trim() || "",
        isCompleted: lesson.isCompleted === true,
        order: index,
      })),
      notesContent,
      contactContent,
      locales: safeLocales,
    };

    onSubmit(payload);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;
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
          onClick={() => setActiveTab("content")}
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
              Localizarea folosește titlul, descrierea, notele și contactul. Dacă nu localizezi, se
              salvează cu fallback RO.
            </p>
          </div>

          <div>
            <label htmlFor="vimeoUrl" className="block text-sm font-medium text-gray-900">
              URL Vimeo <span className="text-red-500">*</span>
            </label>
            <Input
              id="vimeoUrl"
              value={form.vimeoUrl}
              onChange={handleChange("vimeoUrl")}
              className="mt-2"
              placeholder="https://vimeo.com/123456789"
              disabled={loading}
            />
            {vimeoId && (
              <div className="mt-1.5 flex items-center gap-1.5 text-xs text-emerald-600">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Vimeo ID detectat: {vimeoId}
              </div>
            )}
            {errors.vimeoUrl && <p className="mt-1.5 text-xs text-red-600">{errors.vimeoUrl}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Categorii</label>
            {Array.isArray(categories) && categories.length > 0 ? (
              <div>
                <select
                  multiple
                  value={form.categoryIds}
                  onChange={handleCategorySelect}
                  className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                  disabled={loading}
                  size={Math.min(6, categories.length)}
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-xs text-gray-500">
                  Poți selecta mai multe categorii (Ctrl/Cmd + click).
                </p>
              </div>
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
            </select>
            {errors.status && <p className="mt-1.5 text-xs text-red-600">{errors.status}</p>}
            <p className="mt-1.5 text-xs text-gray-500">
              {form.status === "draft" && "Cursul nu va fi vizibil utilizatorilor."}
              {form.status === "published" && "Cursul va fi disponibil public pentru achiziție."}
              {form.status === "scheduled" && "Cursul va fi publicat la o dată programată."}
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

          <div>
            <label htmlFor="thumbnailUrl" className="block text-sm font-medium text-gray-900">
              URL imagine preview (opțional)
            </label>
            <Input
              id="thumbnailUrl"
              value={form.thumbnailUrl}
              onChange={handleChange("thumbnailUrl")}
              className="mt-2"
              placeholder="https://example.com/image.jpg"
              disabled={loading}
            />
            {errors.thumbnailUrl && (
              <p className="mt-1.5 text-xs text-red-600">{errors.thumbnailUrl}</p>
            )}
            <p className="mt-1.5 text-xs text-gray-500">
              Imaginea va fi afișată în lista publică de cursuri.
            </p>
          </div>
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

                    <label className="mt-3 inline-flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={lesson.isCompleted}
                        onChange={(event) =>
                          updateLessonField(index, "isCompleted", event.target.checked)
                        }
                        disabled={uiLocked}
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      Marcată ca finalizată (status icon în sidebar)
                    </label>
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
        <Button type="submit" disabled={uiLocked}>
          {loading ? "Se salvează..." : initialValue ? "Actualizează cursul" : "Creează cursul"}
        </Button>
      </div>
    </form>
  );
}
