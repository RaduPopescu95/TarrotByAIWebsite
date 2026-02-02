import React, { useEffect, useMemo, useState } from "react";
import { Timestamp } from "firebase/firestore";
import type { VideoCreateInput, VideoDoc, VideoLocales, VideoPlatform } from "../types/video";
import { validateVideoInput, type VideoValidationErrors } from "../utils/videoValidation";
import { listVideoCategories } from "../services/videos.service";
import { LANGUAGE_LABELS } from "../../../../data/constants";
import { gTranslateFetch } from "../../../../utils/apiUtils";

type Props = {
  initialValue?: VideoDoc | null;
  onCancel: () => void;
  onSubmit: (data: VideoCreateInput) => Promise<void> | void;
};

const platformOptions: Array<{ value: VideoPlatform; label: string }> = [
  { value: "youtube", label: "YouTube" },
  { value: "vimeo", label: "Vimeo" },
];

export default function VideoForm({ initialValue, onCancel, onSubmit }: Props) {
  const isEditing = !!initialValue;
  const [form, setForm] = useState<VideoCreateInput>({
    title: "",
    description: "",
    platform: "youtube",
    videoUrl: "",
    category: "",
    order: undefined,
    isPublished: false,
    isPremium: false,
    publishAt: null,
  });
  const [errors, setErrors] = useState<VideoValidationErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [existingCategories, setExistingCategories] = useState<string[]>([]);
  const [locales, setLocales] = useState<VideoLocales | undefined>(initialValue?.locales);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translateMessage, setTranslateMessage] = useState("");
  const [showTranslateConfirm, setShowTranslateConfirm] = useState(false);
  const uiLocked = submitting || isTranslating;
  const [publishAtInput, setPublishAtInput] = useState("");

  const formatDateTimeLocal = (date: Date) => {
    const pad = (value: number) => String(value).padStart(2, "0");
    const yyyy = date.getFullYear();
    const mm = pad(date.getMonth() + 1);
    const dd = pad(date.getDate());
    const hh = pad(date.getHours());
    const min = pad(date.getMinutes());
    return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
  };

  // Load existing categories
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const categories = await listVideoCategories();
        const names = categories
          .map((item) => item.name)
          .filter((name) => name.trim().length > 0);
        const uniqueNames = Array.from(new Set(names)).sort((a, b) => a.localeCompare(b));
        setExistingCategories(uniqueNames);
      } catch (error) {
        console.error("Failed to load categories:", error);
      }
    };
    loadCategories();
  }, []);

  useEffect(() => {
    if (!initialValue?.category) return;
    const category = initialValue.category.trim();
    if (!category) return;
    const exists = existingCategories.some((item) => item.toLowerCase() === category.toLowerCase());
    if (exists) return;
    setExistingCategories((prev) => [...prev, category].sort((a, b) => a.localeCompare(b)));
  }, [initialValue, existingCategories]);

  useEffect(() => {
    if (initialValue) {
      setForm({
        title: initialValue.title || "",
        description: initialValue.description || "",
        platform: initialValue.platform,
        videoUrl: initialValue.videoUrl || "",
        category: initialValue.category || "",
        order: initialValue.order,
        isPublished: initialValue.isPublished,
        isPremium: initialValue.isPremium ?? false,
        publishAt: initialValue.publishAt ?? null,
      });
      setErrors({});
      setLocales(initialValue.locales);
      setTranslateMessage("");
      if (initialValue.publishAt) {
        setPublishAtInput(formatDateTimeLocal(initialValue.publishAt.toDate()));
      } else {
        setPublishAtInput("");
      }
    }
  }, [initialValue]);

  useEffect(() => {
    if (initialValue) return;
    const now = new Date();
    setPublishAtInput(formatDateTimeLocal(now));
    setForm((prev) => ({ ...prev, publishAt: Timestamp.fromDate(now) }));
  }, [initialValue]);

  const titleText = useMemo(
    () => (isEditing ? "Editează videoclip" : "Adaugă videoclip"),
    [isEditing]
  );

  const handleChange = (key: keyof VideoCreateInput, value: string | number | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handlePublishAtChange = (value: string) => {
    setPublishAtInput(value);
    if (!value) {
      setForm((prev) => ({ ...prev, publishAt: null }));
      return;
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return;
    }
    setForm((prev) => ({ ...prev, publishAt: Timestamp.fromDate(parsed) }));
  };

  const generateLocales = async (): Promise<VideoLocales | undefined> => {
    if (!form.title?.trim()) {
      setTranslateMessage("Completează titlul înainte de localizare.");
      return undefined;
    }
    setIsTranslating(true);
    setTranslateMessage("");
    try {
      const result: VideoLocales = {};
      const languageKeys = Object.keys(LANGUAGE_LABELS);
      const baseTitle = form.title.trim();
      const baseDescription = form.description?.trim() || "";
      for (const lang of languageKeys) {
        if (lang === "ro") {
          result[lang] = { title: baseTitle, description: baseDescription || undefined };
          continue;
        }
        const [titleTranslated, descriptionTranslated] = await Promise.all([
          gTranslateFetch(baseTitle, lang),
          baseDescription ? gTranslateFetch(baseDescription, lang) : Promise.resolve(""),
        ]);
        result[lang] = {
          title: titleTranslated || baseTitle,
          description: descriptionTranslated ? descriptionTranslated : undefined,
        };
      }
      setLocales(result);
      setTranslateMessage("Localizarea s-a terminat. Poți continua.");
      return result;
    } catch (_) {
      setTranslateMessage("Localizarea a eșuat. Încearcă din nou.");
      return undefined;
    } finally {
      setIsTranslating(false);
    }
  };

  const handleTranslate = async () => {
    await generateLocales();
  };

  const submitForm = async (localesToSubmit?: VideoLocales) => {
    setSubmitting(true);
    try {
      console.log("[VideoForm] Submitting payload", {
        ...form,
        locales: localesToSubmit ? Object.keys(localesToSubmit) : [],
      });
      await onSubmit({
        ...form,
        title: form.title.trim(),
        description: form.description?.trim() || "",
        videoUrl: form.videoUrl.trim(),
        category: form.category?.trim() || "",
        locales: localesToSubmit,
      });
      console.log("[VideoForm] Submit resolved");
    } catch (error) {
      console.error("[VideoForm] Submit failed", error);
      throw error;
    } finally {
      setSubmitting(false);
    }
  };

  const confirmTranslateAndSubmit = async () => {
    setShowTranslateConfirm(false);
    const generatedLocales = await generateLocales();
    if (!generatedLocales) return;
    await submitForm(generatedLocales);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("[VideoForm] Submit clicked", {
      isEditing,
      form,
      publishAtInput,
      localesKeys: locales ? Object.keys(locales) : [],
    });
    const validation = validateVideoInput(form);
    setErrors(validation);
    if (Object.keys(validation).length > 0) {
      console.warn("[VideoForm] Validation failed", validation);
      return;
    }
    const needsLocales = !locales || Object.keys(locales).length === 0;
    if (needsLocales) {
      console.log("[VideoForm] No locales, showing confirm dialog");
      setShowTranslateConfirm(true);
      return;
    }
    await submitForm(locales);
  };


  return (
    <form onSubmit={handleSubmit}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">{titleText}</h2>
          <p className="mt-2 text-sm text-gray-600">
            Completează câmpurile obligatorii și salvează. Videoclipurile nepublicate nu apar în aplicație.
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          disabled={uiLocked}
          className="text-sm font-medium text-gray-600 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:text-gray-600"
        >
          Anulează
        </button>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-0">
            {/* Coloana 1 - Stânga */}
            <div className="space-y-5 lg:pr-8 lg:border-r lg:border-gray-200">
              <div>
                <label className="text-sm font-medium text-gray-700">Titlu *</label>
                <input
                  value={form.title}
                  onChange={(e) => handleChange("title", e.target.value)}
                  disabled={uiLocked}
                  className={`mt-1.5 w-full rounded-lg border bg-white px-4 py-2.5 text-sm text-gray-900 shadow-sm transition-colors focus:outline-none focus:ring-2 ${
                    errors.title
                      ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                      : "border-gray-300 focus:border-blue-500 focus:ring-blue-500/20"
                  } disabled:bg-gray-50 disabled:text-gray-500 disabled:opacity-70`}
                  placeholder="Titlul videoclipului"
                />
                {errors.title && <p className="mt-1.5 text-xs text-red-600">{errors.title}</p>}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Platformă *</label>
                <select
                  value={form.platform}
                  onChange={(e) => handleChange("platform", e.target.value as VideoPlatform)}
                  disabled={uiLocked}
                  className={`mt-1.5 w-full rounded-lg border bg-white px-4 py-2.5 text-sm text-gray-900 shadow-sm transition-colors focus:outline-none focus:ring-2 ${
                    errors.platform
                      ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                      : "border-gray-300 focus:border-blue-500 focus:ring-blue-500/20"
                  } disabled:bg-gray-50 disabled:text-gray-500 disabled:opacity-70`}
                >
                  {platformOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {errors.platform && <p className="mt-1.5 text-xs text-red-600">{errors.platform}</p>}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Video URL *</label>
                <input
                  value={form.videoUrl}
                  onChange={(e) => handleChange("videoUrl", e.target.value)}
                  disabled={uiLocked}
                  className={`mt-1.5 w-full rounded-lg border bg-white px-4 py-2.5 text-sm text-gray-900 shadow-sm transition-colors focus:outline-none focus:ring-2 ${
                    errors.videoUrl
                      ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                      : "border-gray-300 focus:border-blue-500 focus:ring-blue-500/20"
                  } disabled:bg-gray-50 disabled:text-gray-500 disabled:opacity-70`}
                  placeholder="https://..."
                />
                {errors.videoUrl && <p className="mt-1.5 text-xs text-red-600">{errors.videoUrl}</p>}
                <p className="mt-1.5 text-xs text-gray-500">
                  Pentru YouTube poți folosi link-ul standard sau short link; pentru Vimeo folosește link-ul complet.
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Categorie</label>
                <select
                  value={form.category}
                  onChange={(e) => handleChange("category", e.target.value)}
                  disabled={uiLocked}
                  className="mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-gray-50 disabled:text-gray-500 disabled:opacity-70"
                >
                  <option value="">Selectează categorie</option>
                  {existingCategories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                <p className="mt-1.5 text-xs text-gray-500">
                  Adaugă categorii noi din tab-ul Categorii
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Publică la</label>
                <input
                  type="datetime-local"
                  value={publishAtInput}
                  onChange={(e) => handlePublishAtChange(e.target.value)}
                  disabled={uiLocked}
                  className="mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-gray-50 disabled:text-gray-500 disabled:opacity-70"
                />
                <p className="mt-1.5 text-xs text-gray-500">
                  Data/ora (UTC) când videoclipul devine vizibil în aplicație.
                </p>
              </div>
            </div>

            {/* Coloana 2 - Dreapta */}
            <div className="space-y-5 lg:pl-8">
              <div>
                <label className="text-sm font-medium text-gray-700">Descriere</label>
                <textarea
                  value={form.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  disabled={uiLocked}
                  className="mt-1.5 min-h-[400px] w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-y disabled:bg-gray-50 disabled:text-gray-500 disabled:opacity-70"
                  placeholder="Scurtă descriere..."
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Localizare</label>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleTranslate}
                    disabled={uiLocked}
                    className="rounded-lg border border-blue-600 bg-white px-4 py-2 text-sm font-semibold text-blue-600 transition-all hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isTranslating ? (
                      <span className="inline-flex items-center gap-2">
                        <span className="inline-flex h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                        Se localizează...
                      </span>
                    ) : (
                      "Generează localizări"
                    )}
                  </button>
                  {isTranslating && (
                    <span className="inline-flex items-center gap-2 text-sm text-gray-600">
                      <span className="inline-flex h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                      Se traduc textele...va rugam asteptati...
                    </span>
                  )}
                  {translateMessage && (
                    <p
                      className={`text-sm ${
                        translateMessage.includes("eșuat") ? "text-red-600" : "text-emerald-600"
                      }`}
                    >
                      {translateMessage}
                    </p>
                  )}
                </div>
                <p className="mt-1.5 text-xs text-gray-500">
                  Traducerea folosește titlul și descrierea curente; localizările vor fi salvate la
                  salvarea videoclipului.
                </p>
              </div>
            </div>
          </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-gray-200 pt-7">
        <div className="flex flex-wrap items-center gap-4">
          <label className="group flex cursor-pointer items-center gap-3 rounded-lg border-2 border-gray-300 bg-white px-5 py-3 shadow-sm transition-all hover:border-blue-400 hover:bg-blue-50 has-[:checked]:border-emerald-500 has-[:checked]:bg-emerald-50">
            <input
              type="checkbox"
              checked={!!form.isPublished}
              onChange={(e) => handleChange("isPublished", e.target.checked)}
              disabled={uiLocked}
              className="h-5 w-5 rounded border-gray-300 text-emerald-600 shadow-sm transition-all focus:ring-2 focus:ring-emerald-500/30 focus:ring-offset-0"
            />
            <span className="text-sm font-semibold text-gray-700 transition-colors group-hover:text-blue-700 group-has-[:checked]:text-emerald-700">
              Publicat în aplicație
            </span>
          </label>
          <label className="group flex cursor-pointer items-center gap-3 rounded-lg border-2 border-gray-300 bg-white px-5 py-3 shadow-sm transition-all hover:border-amber-400 hover:bg-amber-50 has-[:checked]:border-amber-500 has-[:checked]:bg-amber-50">
            <input
              type="checkbox"
              checked={!!form.isPremium}
              onChange={(e) => handleChange("isPremium", e.target.checked)}
              disabled={uiLocked}
              className="h-5 w-5 rounded border-gray-300 text-amber-600 shadow-sm transition-all focus:ring-2 focus:ring-amber-500/30 focus:ring-offset-0"
            />
            <span className="text-sm font-semibold text-gray-700 transition-colors group-hover:text-amber-700 group-has-[:checked]:text-amber-700">
              Doar utilizatori premium
            </span>
          </label>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={uiLocked}
            className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50 hover:shadow disabled:cursor-not-allowed disabled:opacity-60"
          >
            Renunță
          </button>
          <button
            type="submit"
            disabled={uiLocked}
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-500 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isTranslating ? (
              <span className="inline-flex items-center gap-2">
                <span className="inline-flex h-4 w-4 animate-spin rounded-full border-2 border-white/90 border-t-transparent" />
                Se localizează...
              </span>
            ) : submitting ? (
              <span className="inline-flex items-center gap-2">
                <span className="inline-flex h-4 w-4 animate-spin rounded-full border-2 border-white/90 border-t-transparent" />
                Se salvează...
              </span>
            ) : isEditing ? (
              "Salvează"
            ) : (
              "Creează"
            )}
          </button>
        </div>
      </div>

      {showTranslateConfirm && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center bg-gray-900/60 px-4">
          <div
            className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-lg font-semibold text-gray-900">
              Traducerile nu au fost create
            </div>
            <p className="mt-2 text-sm text-gray-600">
              Vrei să generezi și localizările înainte de salvare?
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowTranslateConfirm(false)}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50 hover:shadow"
              >
                Anulează
              </button>
              <button
                type="button"
                onClick={confirmTranslateAndSubmit}
                disabled={isTranslating || submitting}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-500 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
              >
                Adaugă și localizează
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
