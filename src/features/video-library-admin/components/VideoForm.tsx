import React, { useEffect, useMemo, useState } from "react";
import { Timestamp } from "firebase/firestore";
import type { VideoCreateInput, VideoDoc, VideoLocales, VideoPlatform } from "../types/video";
import { validateVideoInput, type VideoValidationErrors } from "../utils/videoValidation";
import { listVideoCategories } from "../services/videos.service";
import { LANGUAGE_LABELS } from "../../../../data/constants";
import { gTranslateFetch } from "../../../../utils/apiUtils";
import { deriveRootVideoUrlFromLocales, hasAnyLocalizedVideoUrl } from "../../../../lib/videoLibraryPublic";
import { SITE_LOCALES } from "../utils/siteLocales";
import { mergeLocalesWithVideoUrls, siteLocalesRootPreferredOrder } from "../utils/localeVideoMerge";

type Props = {
  initialValue?: VideoDoc | null;
  onCancel: () => void;
  onSubmit: (data: VideoCreateInput) => Promise<void> | void;
};

const ROOT_PREF = siteLocalesRootPreferredOrder(SITE_LOCALES);

function buildInitialLocaleVideoUrls(video: VideoDoc | null | undefined): Record<string, string> {
  const next: Record<string, string> = Object.fromEntries(SITE_LOCALES.map((lc) => [lc, ""]));
  if (!video) return next;
  for (const lc of SITE_LOCALES) {
    const u = video.locales?.[lc]?.videoUrl?.trim();
    if (u) next[lc] = u;
  }
  const root = video.videoUrl?.trim();
  if (root && !hasAnyLocalizedVideoUrl(video)) {
    next.ro = root;
  }
  return next;
}

const platformOptions: Array<{ value: VideoPlatform; label: string }> = [
  { value: "youtube", label: "YouTube" },
  { value: "vimeo", label: "Vimeo" },
  { value: "bunny", label: "Bunny Stream" },
];

export default function VideoForm({ initialValue, onCancel, onSubmit }: Props) {
  const isEditing = !!initialValue;
  const [form, setForm] = useState<VideoCreateInput>({
    title: "",
    description: "",
    platform: "youtube",
    category: "",
    thumbnailUrl: "",
    order: undefined,
    isPublished: false,
    isPremium: true,
    publishAt: null,
  });
  const [localeVideoUrls, setLocaleVideoUrls] = useState<Record<string, string>>(() =>
    buildInitialLocaleVideoUrls(null)
  );
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
        category: initialValue.category || "",
        thumbnailUrl: typeof initialValue.thumbnailUrl === "string" ? initialValue.thumbnailUrl : "",
        order: initialValue.order,
        isPublished: initialValue.isPublished,
        isPremium: initialValue.isPremium === true,
        publishAt: initialValue.publishAt ?? null,
      });
      setLocaleVideoUrls(buildInitialLocaleVideoUrls(initialValue));
      setErrors({});
      setLocales(initialValue.locales);
      setTranslateMessage("");
      if (initialValue.publishAt) {
        setPublishAtInput(formatDateTimeLocal(initialValue.publishAt.toDate()));
      } else {
        setPublishAtInput("");
      }
    } else {
      setForm({
        title: "",
        description: "",
        platform: "youtube",
        category: "",
        thumbnailUrl: "",
        order: undefined,
        isPublished: false,
        isPremium: true,
        publishAt: null,
      });
      setLocaleVideoUrls(buildInitialLocaleVideoUrls(null));
      setLocales(undefined);
      setErrors({});
      setTranslateMessage("");
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
      const baseTitle = form.title.trim();
      const baseDescription = form.description?.trim() || "";
      for (const lang of SITE_LOCALES) {
        const keepVideo = localeVideoUrls[lang]?.trim() || locales?.[lang]?.videoUrl?.trim();
        if (lang === "ro") {
          result[lang] = {
            title: baseTitle,
            description: baseDescription || undefined,
            ...(keepVideo ? { videoUrl: keepVideo } : {}),
          };
          continue;
        }
        const [titleTranslated, descriptionTranslated] = await Promise.all([
          gTranslateFetch(baseTitle, lang),
          baseDescription ? gTranslateFetch(baseDescription, lang) : Promise.resolve(""),
        ]);
        result[lang] = {
          title: titleTranslated || baseTitle,
          description: descriptionTranslated ? descriptionTranslated : undefined,
          ...(keepVideo ? { videoUrl: keepVideo } : {}),
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

  const buildMergedLocales = (localesDraft?: VideoLocales) =>
    mergeLocalesWithVideoUrls(localesDraft, localeVideoUrls, SITE_LOCALES, form.title.trim());

  const submitForm = async (localesToSubmit?: VideoLocales) => {
    setSubmitting(true);
    try {
      const mergedLocales = buildMergedLocales(localesToSubmit);
      const denormUrl = deriveRootVideoUrlFromLocales(mergedLocales, ROOT_PREF);

      console.log("[VideoForm] Submitting payload", {
        ...form,
        locales: Object.keys(mergedLocales),
      });
      await onSubmit({
        ...form,
        title: form.title.trim(),
        description: form.description?.trim() || "",
        videoUrl: denormUrl || "",
        category: form.category?.trim() || "",
        thumbnailUrl:
          form.platform === "bunny" ? (typeof form.thumbnailUrl === "string" ? form.thumbnailUrl.trim() : "") : "",
        locales: mergedLocales,
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

  /** Same title/description for every site locale — no ML translate; merges per-locale video URLs. */
  const saveSkipTranslateLocales = async () => {
    setShowTranslateConfirm(false);
    const t = form.title.trim();
    const d = form.description?.trim() || "";
    const baseBare: VideoLocales = {};
    for (const lc of SITE_LOCALES) {
      baseBare[lc] = {
        title: t,
        ...(d ? { description: d } : {}),
      };
    }
    const mergedLocales = mergeLocalesWithVideoUrls(baseBare, localeVideoUrls, SITE_LOCALES, form.title.trim());
    const denormUrl = deriveRootVideoUrlFromLocales(mergedLocales, ROOT_PREF);
    const validation = validateVideoInput({
      ...form,
      videoUrl: denormUrl || "",
      locales: mergedLocales,
      thumbnailUrl:
        form.platform === "bunny" ? (typeof form.thumbnailUrl === "string" ? form.thumbnailUrl.trim() : "") : "",
    });
    setErrors(validation);
    if (Object.keys(validation).length > 0) return;
    setLocales(baseBare);
    await submitForm(baseBare);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("[VideoForm] Submit clicked", {
      isEditing,
      form,
      publishAtInput,
      localesKeys: locales ? Object.keys(locales) : [],
    });
    const mergedLocales = buildMergedLocales(locales);
    const denormUrl = deriveRootVideoUrlFromLocales(mergedLocales, ROOT_PREF);
    const validation = validateVideoInput({
      ...form,
      videoUrl: denormUrl || "",
      locales: mergedLocales,
      thumbnailUrl:
        form.platform === "bunny" ? (typeof form.thumbnailUrl === "string" ? form.thumbnailUrl.trim() : "") : "",
    });
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


  /** Caps locale URL list (~2–3 rows); inline avoids layout ignoring Tailwind max-h in nested flex/grid. */
  const localeListMaxPx = 288;

  return (
    <form onSubmit={handleSubmit} className="flex min-h-0 w-full flex-1 flex-col overflow-hidden">
      <div className="flex shrink-0 flex-wrap items-start justify-between gap-4">
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

      <div className="mt-6 grid min-h-0 flex-1 grid-cols-1 gap-8 lg:grid-cols-2 lg:grid-rows-[minmax(0,1fr)] lg:gap-0 lg:overflow-hidden">
        {/* Coloana stânga — câmpuri generale */}
        <div className="min-h-0 space-y-5 overflow-y-auto lg:h-full lg:pr-8 lg:border-r lg:border-gray-200">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-x-6">
            <div className="min-w-0">
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

            <div className="min-w-0">
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

            <div className="min-w-0">
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
              <p className="mt-1.5 text-xs text-gray-500">Adaugă categorii noi din tab-ul Categorii</p>
            </div>

            <div className="min-w-0">
              <label className="text-sm font-medium text-gray-700">Publică la</label>
              <input
                type="datetime-local"
                value={publishAtInput}
                onChange={(e) => handlePublishAtChange(e.target.value)}
                disabled={uiLocked}
                className="mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-gray-50 disabled:text-gray-500 disabled:opacity-70"
              />
              <p className="mt-1.5 text-xs text-gray-500">
                Data/ora locală din browser (fusul tău orar) când videoclipul devine vizibil în aplicație.
              </p>
            </div>
          </div>

          {form.platform === "bunny" ? (
            <div className="rounded-xl border border-violet-200 bg-violet-50/60 px-4 py-3 shadow-sm">
              <label className="text-sm font-medium text-gray-800">
                Thumbnail Bunny <span className="font-normal text-gray-600">(opțional, același pentru toate limbile)</span>
              </label>
              <input
                type="url"
                value={typeof form.thumbnailUrl === "string" ? form.thumbnailUrl : ""}
                onChange={(e) => handleChange("thumbnailUrl", e.target.value)}
                disabled={uiLocked}
                className={`mt-1.5 w-full rounded-lg border bg-white px-4 py-2.5 text-sm text-gray-900 shadow-sm transition-colors focus:outline-none focus:ring-2 ${
                  errors.thumbnailUrl
                    ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                    : "border-violet-200 focus:border-violet-500 focus:ring-violet-500/20"
                } disabled:bg-gray-50 disabled:text-gray-500 disabled:opacity-70`}
                placeholder="https://vz-….b-cdn.net/uuid-video/thumbnail.jpg"
                autoComplete="off"
              />
              {errors.thumbnailUrl ? (
                <p className="mt-1.5 text-xs text-red-600">{errors.thumbnailUrl}</p>
              ) : (
                <p className="mt-1.5 text-xs text-violet-900/80">
                  Din Bunny Stream → video and assets url → thumbnail url → copiază URL-ul imaginii thumbnail pentru videoclip (nu depinde de
                  limbă).
                </p>
              )}
            </div>
          ) : null}

          <div>
            <label className="text-sm font-medium text-gray-700">Descriere</label>
            <textarea
              value={form.description}
              onChange={(e) => handleChange("description", e.target.value)}
              disabled={uiLocked}
              className="mt-1.5 min-h-[200px] max-h-[280px] w-full resize-y overflow-y-auto rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-gray-50 disabled:text-gray-500 disabled:opacity-70"
              placeholder="Scurtă descriere..."
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <label className="group flex min-w-0 cursor-pointer items-center gap-2 rounded-md border border-gray-300 bg-white px-2 py-1.5 shadow-sm transition-colors hover:border-blue-400 hover:bg-blue-50 has-[:checked]:border-emerald-500 has-[:checked]:bg-emerald-50">
              <input
                type="checkbox"
                checked={!!form.isPublished}
                onChange={(e) => handleChange("isPublished", e.target.checked)}
                disabled={uiLocked}
                className="h-4 w-4 shrink-0 rounded border-gray-300 text-emerald-600 shadow-sm transition-all focus:ring-2 focus:ring-emerald-500/30 focus:ring-offset-0"
              />
              <span className="min-w-0 text-xs font-medium leading-snug text-gray-700 transition-colors group-hover:text-blue-800 group-has-[:checked]:text-emerald-800">
                Publicat în aplicație
              </span>
            </label>
            <label className="group flex min-w-0 cursor-pointer items-center gap-2 rounded-md border border-gray-300 bg-white px-2 py-1.5 shadow-sm transition-colors hover:border-amber-400 hover:bg-amber-50 has-[:checked]:border-amber-500 has-[:checked]:bg-amber-50">
              <input
                type="checkbox"
                checked={!!form.isPremium}
                onChange={(e) => handleChange("isPremium", e.target.checked)}
                disabled={uiLocked}
                className="h-4 w-4 shrink-0 rounded border-gray-300 text-amber-600 shadow-sm transition-all focus:ring-2 focus:ring-amber-500/30 focus:ring-offset-0"
              />
              <span className="min-w-0 text-xs font-medium leading-snug text-gray-700 transition-colors group-hover:text-amber-800 group-has-[:checked]:text-amber-900">
                Necesită abonament site
              </span>
            </label>
          </div>
          {errors.isPublished ? <p className="mt-1.5 text-xs text-red-600">{errors.isPublished}</p> : null}

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
              Traducerea folosește titlul și descrierea curente; localizările vor fi salvate la salvarea
              videoclipului.
            </p>
          </div>
        </div>

        {/* Coloana dreapta — linkuri video pe limbă (doar această zonă scroll pe verticală, înălțime fixă) */}
        <div className="flex min-h-0 flex-col lg:pl-8">
          <div className="shrink-0">
            <label className="text-sm font-medium text-gray-700">Link video pe limbă (site) *</label>
            {errors.localizedVideo && (
              <p className="mt-2 text-xs font-medium text-red-600">{errors.localizedVideo}</p>
            )}
          </div>
          <div
            className="mt-3 space-y-3 overflow-y-auto overscroll-contain rounded-lg border border-gray-200 bg-gray-50/80 p-3 lg:mt-2"
            style={{ maxHeight: localeListMaxPx }}
          >
            {SITE_LOCALES.map((lc) => {
              const lbl =
                (LANGUAGE_LABELS as Record<string, { denumire?: string }>)?.[lc]?.denumire ??
                lc.toUpperCase();
              const rowErr = errors.localeVideos?.[lc];
              return (
                <div key={lc} className="rounded-md border border-gray-200 bg-white p-3 shadow-sm">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <label className="text-xs font-semibold uppercase tracking-wide text-gray-700">
                      {lbl}{" "}
                      <span className="font-mono text-[10px] font-normal normal-case text-gray-500">
                        ({lc})
                      </span>
                    </label>
                    <span
                      className={`text-[10px] font-medium ${localeVideoUrls[lc]?.trim() ? "text-emerald-600" : "text-gray-400"}`}
                    >
                      {localeVideoUrls[lc]?.trim() ? "link setat" : "opțional · lipsește"}
                    </span>
                  </div>
                  <input
                    value={localeVideoUrls[lc] ?? ""}
                    onChange={(e) =>
                      setLocaleVideoUrls((prev) => ({
                        ...prev,
                        [lc]: e.target.value,
                      }))
                    }
                    disabled={uiLocked}
                    className={`mt-2 w-full rounded-md border px-3 py-2 text-xs text-gray-900 shadow-inner focus:outline-none focus:ring-2 ${
                      rowErr
                        ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                        : "border-gray-300 focus:border-blue-500 focus:ring-blue-500/25"
                    } disabled:bg-gray-50 disabled:text-gray-500`}
                    placeholder={`URL sau id clip — ${lc}`}
                    autoComplete="off"
                  />
                  {rowErr ? <p className="mt-1.5 text-[11px] text-red-600">{rowErr}</p> : null}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-8 flex shrink-0 flex-wrap items-center justify-end gap-4 border-t border-gray-200 pt-7">
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
              Vrei să generezi traducerile automate pentru titlu și descriere în limba curentă a site‑ului înainte
              de salvare? Poți și salva același text RO peste tot, fără traducere automată (poți regenera după).
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowTranslateConfirm(false)}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50 hover:shadow"
              >
                Anulează
              </button>
              <button
                type="button"
                onClick={() => void saveSkipTranslateLocales()}
                disabled={isTranslating || submitting}
                className="rounded-lg border border-gray-400 bg-gray-50 px-4 py-2 text-sm font-semibold text-gray-800 shadow-sm transition-all hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Aceeași text RO pentru toate limbile
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
