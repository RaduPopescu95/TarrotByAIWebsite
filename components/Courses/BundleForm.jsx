import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { SITE_LOCALES } from "../../lib/siteLocales";
import { gTranslateFetch } from "../../utils/apiUtils";
import { uploadBundleCover } from "../../utils/storageUtils";

const ALLOWED_COVER_FILE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_COVER_INPUT_SIZE_BYTES = 10 * 1024 * 1024;

const resolveInitialCoverSource = (value) => {
  if (!value) return "none";
  if (value.coverSource === "course" || value.coverSource === "custom" || value.coverSource === "none") {
    return value.coverSource;
  }
  if (typeof value.thumbnailUrl === "string" && value.thumbnailUrl.trim()) {
    return "custom";
  }
  return "none";
};

const initialForm = (value) => ({
  title: value?.title || "",
  description: value?.description || "",
  courseIds: Array.isArray(value?.courseIds) ? value.courseIds : [],
  price: value?.price ?? "",
  currency: value?.currency || "RON",
  status: value?.status || "draft",
  thumbnailUrl: value?.thumbnailUrl || "",
  coverSource: resolveInitialCoverSource(value),
  coverCourseId: typeof value?.coverCourseId === "string" ? value.coverCourseId : "",
  locales: value?.locales || {},
});

export default function BundleForm({
  initialValue,
  courses,
  loading,
  onSubmit,
  onCancel,
}) {
  const [form, setForm] = useState(() => initialForm(initialValue));
  const [error, setError] = useState("");
  const [translating, setTranslating] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const [coverWarning, setCoverWarning] = useState("");
  const fileInputRef = useRef(null);
  const compositionLocked = Number(initialValue?.purchaseCount || 0) > 0;

  useEffect(() => {
    setForm(initialForm(initialValue));
    setError("");
    setCoverWarning("");
  }, [initialValue]);

  const courseById = useMemo(() => {
    const map = new Map();
    (courses || []).forEach((course) => {
      if (course?.id) map.set(course.id, course);
    });
    return map;
  }, [courses]);

  const selectedCourses = useMemo(
    () =>
      form.courseIds
        .map((id) => courseById.get(id))
        .filter(Boolean),
    [form.courseIds, courseById]
  );

  useEffect(() => {
    if (form.coverSource !== "course") return;
    if (!form.coverCourseId) return;
    if (!form.courseIds.includes(form.coverCourseId)) {
      setForm((current) => ({
        ...current,
        coverSource: "none",
        coverCourseId: "",
      }));
      setCoverWarning(
        "Cursul folosit ca copertă a fost scos din trilogie, am revenit la 'fără copertă'."
      );
    }
  }, [form.courseIds, form.coverSource, form.coverCourseId]);

  const resolvedCoverPreviewUrl = (() => {
    if (form.coverSource === "course") {
      const linked = courseById.get(form.coverCourseId);
      return linked?.thumbnailUrl || "";
    }
    if (form.coverSource === "custom") {
      return form.thumbnailUrl || "";
    }
    return "";
  })();

  const toggleCourse = (courseId) => {
    if (compositionLocked) return;
    setForm((current) => {
      const selected = current.courseIds.includes(courseId)
        ? current.courseIds.filter((id) => id !== courseId)
        : [...current.courseIds, courseId];
      return { ...current, courseIds: selected };
    });
    setError("");
  };

  const handleCoverSourceChange = (nextSource) => {
    setCoverWarning("");
    setForm((current) => {
      if (nextSource === "none") {
        return { ...current, coverSource: "none", coverCourseId: "", thumbnailUrl: "" };
      }
      if (nextSource === "course") {
        return { ...current, coverSource: "course", thumbnailUrl: "" };
      }
      return { ...current, coverSource: "custom", coverCourseId: "" };
    });
  };

  const handleCoverFile = async (event) => {
    const file = event.target.files?.[0];
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (!file) return;
    setCoverWarning("");
    if (!ALLOWED_COVER_FILE_TYPES.includes(file.type)) {
      setCoverWarning("Format acceptat: JPG, PNG sau WebP.");
      return;
    }
    if (file.size > MAX_COVER_INPUT_SIZE_BYTES) {
      setCoverWarning("Imaginea este prea mare (max 10 MB înainte de comprimare).");
      return;
    }
    setCoverUploading(true);
    try {
      const result = await uploadBundleCover(file);
      const finalUri = result?.finalUri;
      if (!finalUri) throw new Error("Upload-ul nu a returnat un URL.");
      setForm((current) => ({
        ...current,
        coverSource: "custom",
        coverCourseId: "",
        thumbnailUrl: finalUri,
      }));
    } catch (uploadError) {
      console.error("[BundleForm] cover_upload_failed", uploadError);
      setCoverWarning(
        uploadError?.message || "Încărcarea copertei a eșuat. Încearcă din nou."
      );
    } finally {
      setCoverUploading(false);
    }
  };

  const translate = async () => {
    if (!form.title.trim() || !form.description.trim()) {
      setError("Completează titlul și descrierea înainte de traducere.");
      return;
    }
    setTranslating(true);
    setError("");
    try {
      const entries = await Promise.all(
        SITE_LOCALES.map(async (locale) => {
          if (locale === "ro") {
            return [
              locale,
              { title: form.title.trim(), description: form.description.trim() },
            ];
          }
          const [title, description] = await Promise.all([
            gTranslateFetch(form.title.trim(), locale),
            gTranslateFetch(form.description.trim(), locale),
          ]);
          return [
            locale,
            {
              title: title || form.title.trim(),
              description: description || form.description.trim(),
            },
          ];
        })
      );
      setForm((current) => ({ ...current, locales: Object.fromEntries(entries) }));
    } catch (translationError) {
      setError(translationError?.message || "Traducerea a eșuat.");
    } finally {
      setTranslating(false);
    }
  };

  const submit = (event) => {
    event.preventDefault();
    const price = Number(form.price);
    if (!form.title.trim() || !form.description.trim()) {
      setError("Titlul și descrierea sunt obligatorii.");
      return;
    }
    if (form.courseIds.length < 2) {
      setError("Selectează minim 2 cursuri.");
      return;
    }
    if (!Number.isFinite(price) || price <= 0) {
      setError("Prețul trebuie să fie mai mare ca 0.");
      return;
    }
    if (form.coverSource === "course") {
      if (!form.coverCourseId || !form.courseIds.includes(form.coverCourseId)) {
        setError("Alege cursul din care să fie folosită coperta.");
        return;
      }
    }
    if (form.coverSource === "custom" && !form.thumbnailUrl.trim()) {
      setError("Încarcă o imagine sau alege altă sursă pentru copertă.");
      return;
    }
    const locales =
      Object.keys(form.locales || {}).length > 0
        ? form.locales
        : {
            ro: {
              title: form.title.trim(),
              description: form.description.trim(),
            },
          };
    onSubmit({
      title: form.title.trim(),
      description: form.description.trim(),
      courseIds: form.courseIds,
      price,
      currency: form.currency,
      status: form.status,
      coverSource: form.coverSource,
      coverCourseId: form.coverSource === "course" ? form.coverCourseId : null,
      thumbnailUrl:
        form.coverSource === "custom" ? form.thumbnailUrl.trim() || null : null,
      locales,
    });
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div>
        <label className="text-sm font-medium text-gray-900">Titlu trilogie</label>
        <Input
          value={form.title}
          onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
          className="mt-2"
          disabled={loading}
        />
      </div>

      <div>
        <label className="text-sm font-medium text-gray-900">Descriere</label>
        <textarea
          value={form.description}
          onChange={(event) =>
            setForm((current) => ({ ...current, description: event.target.value }))
          }
          rows={4}
          className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          disabled={loading}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-gray-900">Preț bundle</label>
          <Input
            type="number"
            min="0.01"
            step="0.01"
            value={form.price}
            onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))}
            className="mt-2"
            disabled={loading}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-900">Monedă</label>
          <select
            value={form.currency}
            onChange={(event) =>
              setForm((current) => ({ ...current, currency: event.target.value }))
            }
            className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            disabled={loading}
          >
            <option value="RON">RON</option>
            <option value="EUR">EUR</option>
          </select>
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-gray-900">Status</label>
        <select
          value={form.status}
          onChange={(event) =>
            setForm((current) => ({ ...current, status: event.target.value }))
          }
          className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm sm:max-w-xs"
          disabled={loading}
        >
          <option value="draft">Ciornă</option>
          <option value="published">Publicat</option>
          <option value="archived">Arhivat</option>
        </select>
      </div>

      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Copertă trilogie</h3>
            <p className="mt-1 text-xs text-gray-600">
              Apare pe website, în aplicația mobilă și pe ecranul de cursuri cumpărate.
            </p>
          </div>
          {resolvedCoverPreviewUrl ? (
            <div className="hidden h-20 w-36 overflow-hidden rounded-lg border border-gray-200 bg-white sm:block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={resolvedCoverPreviewUrl}
                alt="Preview copertă"
                className="h-full w-full object-cover"
              />
            </div>
          ) : null}
        </div>

        <div className="mt-3 space-y-2">
          <label className="flex items-start gap-2 rounded-lg border border-gray-200 bg-white p-3 text-sm">
            <input
              type="radio"
              name="bundle-cover-source"
              value="none"
              checked={form.coverSource === "none"}
              onChange={() => handleCoverSourceChange("none")}
              disabled={loading || coverUploading}
              className="mt-1"
            />
            <span>
              <span className="font-medium text-gray-900">Fără copertă</span>
              <span className="block text-xs text-gray-600">
                Cardul afișează numărul de cursuri din trilogie.
              </span>
            </span>
          </label>

          <label className="flex items-start gap-2 rounded-lg border border-gray-200 bg-white p-3 text-sm">
            <input
              type="radio"
              name="bundle-cover-source"
              value="course"
              checked={form.coverSource === "course"}
              onChange={() => handleCoverSourceChange("course")}
              disabled={loading || coverUploading || selectedCourses.length === 0}
              className="mt-1"
            />
            <div className="flex-1">
              <span className="font-medium text-gray-900">
                Folosește thumbnail-ul unui curs din trilogie
              </span>
              <span className="block text-xs text-gray-600">
                Coperta urmărește live thumbnail-ul cursului. Dacă schimbi poza cursului
                mai târziu, trilogia se actualizează automat.
              </span>
              {form.coverSource === "course" ? (
                selectedCourses.length === 0 ? (
                  <p className="mt-2 text-xs text-amber-700">
                    Selectează întâi cursurile pentru această trilogie.
                  </p>
                ) : (
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    {selectedCourses.map((course) => {
                      const isActive = course.id === form.coverCourseId;
                      return (
                        <button
                          type="button"
                          key={course.id}
                          onClick={() =>
                            setForm((current) => ({
                              ...current,
                              coverCourseId: course.id,
                            }))
                          }
                          disabled={loading}
                          className={`flex items-center gap-2 rounded-lg border p-2 text-left text-xs ${
                            isActive
                              ? "border-indigo-500 ring-2 ring-indigo-200"
                              : "border-gray-200"
                          }`}
                        >
                          <div className="h-10 w-16 flex-shrink-0 overflow-hidden rounded bg-gray-100">
                            {course.thumbnailUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={course.thumbnailUrl}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-[10px] text-gray-400">
                                fără poză
                              </div>
                            )}
                          </div>
                          <span className="line-clamp-2 font-medium text-gray-800">
                            {course.title || course.id}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )
              ) : null}
            </div>
          </label>

          <label className="flex items-start gap-2 rounded-lg border border-gray-200 bg-white p-3 text-sm">
            <input
              type="radio"
              name="bundle-cover-source"
              value="custom"
              checked={form.coverSource === "custom"}
              onChange={() => handleCoverSourceChange("custom")}
              disabled={loading || coverUploading}
              className="mt-1"
            />
            <div className="flex-1">
              <span className="font-medium text-gray-900">
                Încarcă o copertă personalizată
              </span>
              <span className="block text-xs text-gray-600">
                Recomandat: <strong>1200×675 px</strong> sau mai mare, raport landscape
                16:9 (dreptunghi), format JPG, PNG sau WebP. Imaginea va fi comprimată
                automat la max ~400 KB și lățime 1600 px, ca să rămână clară pe orice
                ecran fără să crească costurile la Firebase Storage.
              </span>
              {form.coverSource === "custom" ? (
                <div className="mt-2 space-y-2">
                  <Input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleCoverFile}
                    disabled={loading || coverUploading}
                    ref={fileInputRef}
                  />
                  {coverUploading ? (
                    <p className="text-xs text-gray-600">
                      Se comprimă și se încarcă imaginea...
                    </p>
                  ) : null}
                  {form.thumbnailUrl ? (
                    <div className="flex items-center gap-3">
                      <div className="h-16 w-28 overflow-hidden rounded-lg border border-gray-200 bg-white">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={form.thumbnailUrl}
                          alt="Copertă încărcată"
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setForm((current) => ({ ...current, thumbnailUrl: "" }))
                        }
                        className="text-xs font-medium text-red-600 hover:underline"
                        disabled={loading || coverUploading}
                      >
                        Șterge coperta
                      </button>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          </label>
        </div>

        {coverWarning ? (
          <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            {coverWarning}
          </p>
        ) : null}
      </div>

      <div>
        <div className="flex items-center justify-between gap-3">
          <label className="text-sm font-medium text-gray-900">
            Cursuri selectate ({form.courseIds.length} selectate, minim 2)
          </label>
          {compositionLocked ? (
            <span className="text-xs font-medium text-amber-700">
              Componența este blocată după prima achiziție
            </span>
          ) : null}
        </div>
        <div className="mt-2 max-h-56 space-y-2 overflow-auto rounded-lg border p-3">
          {courses.map((course) => (
            <label
              key={course.id}
              className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 p-3"
            >
              <input
                type="checkbox"
                checked={form.courseIds.includes(course.id)}
                onChange={() => toggleCourse(course.id)}
                disabled={loading || compositionLocked}
              />
              <span className="text-sm font-medium text-gray-800">{course.title}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button type="button" variant="outline" onClick={translate} disabled={loading || translating}>
          {translating ? "Se traduc textele..." : "Tradu automat"}
        </Button>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
            Anulează
          </Button>
          <Button type="submit" disabled={loading || translating || coverUploading}>
            {loading ? "Se salvează..." : "Salvează trilogia"}
          </Button>
        </div>
      </div>
    </form>
  );
}
