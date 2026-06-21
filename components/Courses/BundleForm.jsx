import React, { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { SITE_LOCALES } from "../../lib/siteLocales";
import { gTranslateFetch } from "../../utils/apiUtils";

const initialForm = (value) => ({
  title: value?.title || "",
  description: value?.description || "",
  courseIds: Array.isArray(value?.courseIds) ? value.courseIds : [],
  price: value?.price ?? "",
  currency: value?.currency || "RON",
  status: value?.status || "draft",
  thumbnailUrl: value?.thumbnailUrl || "",
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
  const compositionLocked = Number(initialValue?.purchaseCount || 0) > 0;

  useEffect(() => {
    setForm(initialForm(initialValue));
    setError("");
  }, [initialValue]);

  const toggleCourse = (courseId) => {
    if (compositionLocked) return;
    setForm((current) => {
      const selected = current.courseIds.includes(courseId)
        ? current.courseIds.filter((id) => id !== courseId)
        : current.courseIds.length < 3
        ? [...current.courseIds, courseId]
        : current.courseIds;
      return { ...current, courseIds: selected };
    });
    setError("");
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
    if (form.courseIds.length !== 3) {
      setError("Selectează exact 3 cursuri.");
      return;
    }
    if (!Number.isFinite(price) || price <= 0) {
      setError("Prețul trebuie să fie mai mare ca 0.");
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
      thumbnailUrl: form.thumbnailUrl.trim() || null,
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

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-gray-900">Status</label>
          <select
            value={form.status}
            onChange={(event) =>
              setForm((current) => ({ ...current, status: event.target.value }))
            }
            className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            disabled={loading}
          >
            <option value="draft">Ciornă</option>
            <option value="published">Publicat</option>
            <option value="archived">Arhivat</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-900">Imagine</label>
          <Input
            value={form.thumbnailUrl}
            onChange={(event) =>
              setForm((current) => ({ ...current, thumbnailUrl: event.target.value }))
            }
            className="mt-2"
            placeholder="https://..."
            disabled={loading}
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between gap-3">
          <label className="text-sm font-medium text-gray-900">
            Cursuri selectate ({form.courseIds.length}/3)
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
          <Button type="submit" disabled={loading || translating}>
            {loading ? "Se salvează..." : "Salvează trilogia"}
          </Button>
        </div>
      </div>
    </form>
  );
}
