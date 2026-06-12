import React, { useCallback, useEffect, useMemo, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import LocalPasswordGate from "../../../components/Dashboard/LocalPasswordGate";

const DASHBOARD_SECRET = "Cristina1994!";
const DELETE_CONFIRM_TEXT = "STERGE TOKENS";

const MODEL_FILTERS = [
  { key: "all", label: "Toți" },
  { key: "complete", label: "Complet" },
  { key: "missing_name", label: "Lipsește nume" },
  { key: "missing_city", label: "Lipsește oraș" },
  { key: "legacy", label: "Legacy" },
];

const BULK_DELETE_MODES = [
  {
    key: "delete_all_except_selected",
    label: "Șterge tot în afară de selecție",
    description: "Bifezi tokenurile pe care le păstrezi, toate celelalte rezultate filtrate vor fi șterse.",
  },
  {
    key: "delete_selected",
    label: "Șterge doar selecția",
    description: "Șterge doar tokenurile bifate care încă se potrivesc filtrelor curente.",
  },
];

function StatCard({ label, value, sub, color }) {
  return (
    <div className={`rounded-2xl border bg-white p-5 shadow-sm ${color || "border-slate-200"}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-3xl font-bold text-slate-900">{value}</p>
      {sub ? <p className="mt-1 text-xs text-slate-500">{sub}</p> : null}
    </div>
  );
}

function ModelBadge({ modelClass }) {
  const styles = {
    complete: "bg-emerald-100 text-emerald-800",
    missing_name: "bg-amber-100 text-amber-900",
    missing_city: "bg-sky-100 text-sky-900",
    legacy: "bg-slate-200 text-slate-800",
  };
  const labels = {
    complete: "Complet",
    missing_name: "Lipsește nume",
    missing_city: "Lipsește oraș",
    legacy: "Legacy",
  };
  const cls = styles[modelClass] || styles.legacy;
  const label = labels[modelClass] || "—";
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${cls}`}>
      {label}
    </span>
  );
}

function formatDate(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("ro-RO", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function normalizeCsvInput(value) {
  return value
    .split(/[\n,;]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function ConfirmDeleteDialog({
  open,
  confirmText,
  setConfirmText,
  deleting,
  preview,
  modeLabel,
  onCancel,
  onConfirm,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
      <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <h2 className="text-lg font-bold text-slate-900">Confirmă ștergerea tokenurilor</h2>
        <p className="mt-2 text-sm text-slate-600">
          Mod: <span className="font-semibold text-slate-900">{modeLabel}</span>
        </p>
        <p className="mt-2 text-sm text-slate-600">
          {preview?.mode === "delete_all_except_selected" ? (
            <>
              Vor fi șterse <span className="font-semibold text-red-700">{preview?.deleteCount || 0}</span>{" "}
              tokenuri din{" "}
              <span className="font-semibold text-slate-900">{preview?.collectionCount || 0}</span>{" "}
              tokenuri scanate în colecție. Excepții păstrate:{" "}
              <span className="font-semibold text-slate-900">{preview?.excludedCount || 0}</span>.
            </>
          ) : (
            <>
              Vor fi șterse <span className="font-semibold text-red-700">{preview?.deleteCount || 0}</span>{" "}
              tokenuri din{" "}
              <span className="font-semibold text-slate-900">{preview?.matchedCount || 0}</span>{" "}
              rezultate filtrate. Excepții păstrate:{" "}
              <span className="font-semibold text-slate-900">{preview?.excludedCount || 0}</span>.
            </>
          )}
        </p>
        {preview?.invalidSelectedCount > 0 ? (
          <p className="mt-2 text-sm text-amber-700">
            {preview.invalidSelectedCount} ID-uri selectate nu mai există în colecție și nu vor fi păstrate.
          </p>
        ) : null}
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Ștergerea este definitivă. Tastează <code className="font-semibold">{DELETE_CONFIRM_TEXT}</code>{" "}
          pentru confirmare.
        </div>
        <input
          type="text"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder={DELETE_CONFIRM_TEXT}
          className="mt-4 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
        />
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={deleting}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
          >
            Anulează
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting || confirmText.trim() !== DELETE_CONFIRM_TEXT}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 disabled:opacity-50"
          >
            {deleting ? "Se șterge…" : "Șterge tokenurile"}
          </button>
        </div>
      </div>
    </div>
  );
}

function UserTokensScreen() {
  const router = useRouter();
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("");
  const [cityIn, setCityIn] = useState("");
  const [cityNotIn, setCityNotIn] = useState("");
  const [modelFilter, setModelFilter] = useState("all");
  const [disabledOnly, setDisabledOnly] = useState(false);
  const [missingName, setMissingName] = useState(false);
  const [missingCity, setMissingCity] = useState(false);
  const [cities, setCities] = useState([]);
  const [stats, setStats] = useState(null);
  const [nextCursor, setNextCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [scanTruncated, setScanTruncated] = useState(false);
  const [scannedCount, setScannedCount] = useState(0);
  const [selectionMode, setSelectionMode] = useState("delete_all_except_selected");
  const [selectedIds, setSelectedIds] = useState([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [bulkPreview, setBulkPreview] = useState(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const filters = useMemo(
    () => ({
      search: search.trim(),
      city: city.trim(),
      cityIn: normalizeCsvInput(cityIn),
      cityNotIn: normalizeCsvInput(cityNotIn),
      modelFilter,
      disabledOnly,
      missingName,
      missingCity,
    }),
    [city, cityIn, cityNotIn, disabledOnly, missingCity, missingName, modelFilter, search]
  );

  const buildQuery = useCallback(
    (cursor) => {
      const params = new URLSearchParams();
      params.set("limit", "50");
      params.set("stats", "1");
      if (cursor) params.set("cursor", cursor);
      if (filters.search) params.set("search", filters.search);
      if (filters.city) params.set("city", filters.city);
      if (filters.cityIn.length > 0) params.set("cityIn", filters.cityIn.join(","));
      if (filters.cityNotIn.length > 0) params.set("cityNotIn", filters.cityNotIn.join(","));
      if (filters.modelFilter !== "all") params.set("modelFilter", filters.modelFilter);
      if (filters.disabledOnly) params.set("disabledOnly", "1");
      if (filters.missingName) params.set("missingName", "1");
      if (filters.missingCity) params.set("missingCity", "1");
      return params.toString();
    },
    [filters]
  );

  const resetSelectionState = useCallback(() => {
    setSelectedIds([]);
    setBulkPreview(null);
    setConfirmDialogOpen(false);
    setConfirmText("");
  }, []);

  const load = useCallback(
    async ({ append = false, cursor = null } = {}) => {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setError("");
        setSuccessMessage("");
        resetSelectionState();
      }
      try {
        const res = await fetch(`/api/dashboard/user-tokens?${buildQuery(cursor)}`, {
          headers: { "x-dashboard-token": DASHBOARD_SECRET },
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || "load_failed");
        setTokens((prev) =>
          append ? [...prev, ...(Array.isArray(data.tokens) ? data.tokens : [])] : data.tokens || []
        );
        setStats(data.stats || null);
        setCities(Array.isArray(data.cities) ? data.cities : []);
        setNextCursor(data.nextCursor || null);
        setHasMore(Boolean(data.hasMore));
        setScanTruncated(Boolean(data.scanTruncated));
        setScannedCount(typeof data.scannedCount === "number" ? data.scannedCount : 0);
      } catch (e) {
        setError(e?.message || "Eroare la încărcare");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [buildQuery, resetSelectionState]
  );

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setBulkPreview(null);
    setConfirmDialogOpen(false);
    setConfirmText("");
  }, [filters, selectedIds, selectionMode]);

  const displayStats = useMemo(() => {
    if (stats) return stats;
    return {
      scanned: tokens.length,
      complete: tokens.filter((t) => t.modelClass === "complete").length,
      missingName: tokens.filter((t) => !t.displayName).length,
      missingCity: tokens.filter((t) => !t.city).length,
      legacy: tokens.filter((t) => t.modelClass !== "complete").length,
      disabled: tokens.filter((t) => t.disabled).length,
    };
  }, [stats, tokens]);

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const allCurrentPageSelected = tokens.length > 0 && tokens.every((token) => selectedSet.has(token.id));
  const selectedCount = selectedIds.length;
  const activeMode = BULK_DELETE_MODES.find((mode) => mode.key === selectionMode) || BULK_DELETE_MODES[0];
  const previewPrimaryLabel =
    selectionMode === "delete_all_except_selected" ? "Tokenuri în colecție" : "Rezultate preview";
  const thCls =
    "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 whitespace-nowrap";
  const tdCls = "px-4 py-3 text-sm text-slate-800 whitespace-nowrap";

  const toggleRowSelection = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((existingId) => existingId !== id) : [...prev, id]
    );
  };

  const toggleSelectCurrentPage = () => {
    setSelectedIds((prev) => {
      if (allCurrentPageSelected) {
        return prev.filter((id) => !tokens.some((token) => token.id === id));
      }

      const next = new Set(prev);
      tokens.forEach((token) => next.add(token.id));
      return [...next];
    });
  };

  const buildBulkPayload = useCallback(
    () => ({
      mode: selectionMode,
      filters,
      selectedIds,
      excludedIds: selectionMode === "delete_all_except_selected" ? selectedIds : [],
    }),
    [filters, selectedIds, selectionMode]
  );

  const handlePreview = async () => {
    setPreviewLoading(true);
    setError("");
    setSuccessMessage("");
    try {
      const res = await fetch("/api/dashboard/user-tokens", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-dashboard-token": DASHBOARD_SECRET,
        },
        body: JSON.stringify({
          action: "previewDelete",
          ...buildBulkPayload(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "preview_failed");
      setBulkPreview(data);
    } catch (e) {
      setError(e?.message || "Nu am putut calcula preview-ul.");
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    setError("");
    setSuccessMessage("");
    try {
      const res = await fetch("/api/dashboard/user-tokens", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "x-dashboard-token": DASHBOARD_SECRET,
        },
        body: JSON.stringify({
          action: "bulkDelete",
          ...buildBulkPayload(),
          previewScanTruncated: Boolean(bulkPreview?.scanTruncated),
          confirmText,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "delete_failed");
      const deletedCount = data.deletedCount || 0;
      resetSelectionState();
      await load();
      setSuccessMessage(`Au fost șterse ${deletedCount} tokenuri.`);
    } catch (e) {
      setError(e?.message || "Nu am putut șterge tokenurile.");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <ConfirmDeleteDialog
        open={confirmDialogOpen}
        confirmText={confirmText}
        setConfirmText={setConfirmText}
        deleting={deleteLoading}
        preview={bulkPreview}
        modeLabel={activeMode.label}
        onCancel={() => {
          if (!deleteLoading) {
            setConfirmDialogOpen(false);
            setConfirmText("");
          }
        }}
        onConfirm={handleDelete}
      />

      <div className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap items-center gap-4">
          <button
            onClick={() => router.push("/dashboard")}
            className="group flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:border-gray-400 hover:shadow"
          >
            <svg
              className="h-4 w-4 transition-transform group-hover:-translate-x-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Dashboard
          </button>
          <div className="flex items-center gap-3">
            <div className="h-8 w-px bg-gray-300" />
            <h1 className="text-xl font-bold text-gray-900">Tokenuri push (userTokens)</h1>
          </div>
          <button
            onClick={() => load()}
            disabled={loading}
            className="ml-auto flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
          >
            <svg
              className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Reîncarcă
          </button>
        </div>

        <p className="mb-6 text-sm text-slate-600">
          Filtrezi colecția <code className="text-xs">userTokens</code>, alegi tokenurile care trebuie
          păstrate sau șterse, apoi rulezi preview înainte de bulk delete.
        </p>

        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <StatCard
            label="Scanate (request)"
            value={displayStats.scanned ?? scannedCount}
            sub={`${tokens.length} afișate`}
            color="border-slate-200"
          />
          <StatCard
            label="Model complet"
            value={displayStats.complete ?? 0}
            sub="nume + oraș"
            color="border-emerald-200"
          />
          <StatCard
            label="Lipsește nume"
            value={displayStats.missingName ?? 0}
            color="border-amber-200"
          />
          <StatCard
            label="Lipsește oraș"
            value={displayStats.missingCity ?? 0}
            color="border-sky-200"
          />
          <StatCard
            label="Legacy"
            value={displayStats.legacy ?? 0}
            sub="înainte de model nou"
            color="border-slate-300"
          />
        </div>

        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
            <div className="relative">
              <svg
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Caută nume, email, uid, doc id..."
                className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-4 text-sm text-slate-800 shadow-sm outline-none placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm outline-none focus:border-indigo-400"
            >
              <option value="">Toate orașele</option>
              {cities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <input
              type="text"
              value={cityIn}
              onChange={(e) => setCityIn(e.target.value)}
              placeholder="Include doar orașele: București, Cluj"
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm outline-none placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />

            <input
              type="text"
              value={cityNotIn}
              onChange={(e) => setCityNotIn(e.target.value)}
              placeholder="Exclude orașele: Iași, Brașov"
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm outline-none placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />

            <label className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm">
              <input
                type="checkbox"
                checked={disabledOnly}
                onChange={(e) => setDisabledOnly(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300"
              />
              Doar dezactivate
            </label>

            <label className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm">
              <input
                type="checkbox"
                checked={missingName}
                onChange={(e) => setMissingName(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300"
              />
              Doar fără nume
            </label>

            <label className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm">
              <input
                type="checkbox"
                checked={missingCity}
                onChange={(e) => setMissingCity(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300"
              />
              Doar fără oraș
            </label>

            <div className="xl:col-span-2 flex flex-wrap gap-2">
              {MODEL_FILTERS.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setModelFilter(f.key)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                    modelFilter === f.key
                      ? "bg-indigo-600 text-white"
                      : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => load()}
              disabled={loading}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:opacity-50"
            >
              Aplică filtre
            </button>
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setCity("");
                setCityIn("");
                setCityNotIn("");
                setModelFilter("all");
                setDisabledOnly(false);
                setMissingName(false);
                setMissingCity(false);
              }}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            >
              Resetează filtrele
            </button>
            <button
              type="button"
              onClick={resetSelectionState}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            >
              Resetează selecția
            </button>
          </div>
        </div>

        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Bulk delete</h2>
              <p className="mt-1 text-sm text-slate-600">{activeMode.description}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {BULK_DELETE_MODES.map((mode) => (
                <button
                  key={mode.key}
                  type="button"
                  onClick={() => setSelectionMode(mode.key)}
                  className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                    selectionMode === mode.key
                      ? "bg-red-600 text-white"
                      : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Selectate în UI</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{selectedCount}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {previewPrimaryLabel}
              </p>
              <p className="mt-1 text-2xl font-bold text-slate-900">
                {bulkPreview ? bulkPreview.collectionCount ?? bulkPreview.matchedCount : "—"}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Excepții păstrate</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">
                {bulkPreview ? bulkPreview.excludedCount : "—"}
              </p>
            </div>
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-red-600">Vor fi șterse</p>
              <p className="mt-1 text-2xl font-bold text-red-700">
                {bulkPreview ? bulkPreview.deleteCount : "—"}
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handlePreview}
              disabled={previewLoading || loading}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-50"
            >
              {previewLoading ? "Calculez preview…" : "Preview ștergere"}
            </button>
            <button
              type="button"
              onClick={() => {
                setConfirmDialogOpen(true);
                setConfirmText("");
              }}
              disabled={
                deleteLoading ||
                !bulkPreview ||
                bulkPreview.deleteCount <= 0 ||
                bulkPreview.scanTruncated === true
              }
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-500 disabled:opacity-50"
            >
              Confirmă ștergerea
            </button>
            {selectionMode === "delete_all_except_selected" ? (
              <p className="text-sm text-slate-600">
                În acest mod, filtrele te ajută să găsești tokenurile de păstrat, iar toate celelalte
                tokenuri din colecție devin candidate la ștergere.
              </p>
            ) : (
              <p className="text-sm text-slate-600">
                În acest mod, doar tokenurile bifate și încă potrivite filtrelor vor fi șterse.
              </p>
            )}
          </div>
        </div>

        {scanTruncated ? (
          <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Filtrul a scanat maxim {scannedCount} documente; rezultatele pot fi incomplete. Rafinează
            căutarea sau folosește paginarea.
          </div>
        ) : null}

        {bulkPreview?.scanTruncated ? (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            Preview-ul a atins limita de scanare ({bulkPreview.scannedCount}). Bulk delete este blocat până
            rafinezi filtrele.
          </div>
        ) : null}

        {bulkPreview?.invalidSelectedCount > 0 ? (
          <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {bulkPreview.invalidSelectedCount} ID-uri selectate nu mai există în colecție. Preview-ul și
            ștergerea folosesc doar tokenurile care încă există.
          </div>
        ) : null}

        {error ? (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-800">
            {error}
            <button
              onClick={() => load()}
              className="ml-3 rounded bg-red-700 px-3 py-1 text-xs text-white hover:bg-red-600"
            >
              Reîncearcă
            </button>
          </div>
        ) : null}

        {successMessage ? (
          <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800">
            {successMessage}
          </div>
        ) : null}

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-200" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            {tokens.length === 0 ? (
              <p className="py-12 text-center text-slate-500">Niciun token pentru filtrele selectate.</p>
            ) : (
              <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-slate-50">
                  <tr>
                    <th className={`${thCls} w-12`}>
                      <input
                        type="checkbox"
                        checked={allCurrentPageSelected}
                        onChange={toggleSelectCurrentPage}
                        className="h-4 w-4 rounded border-slate-300"
                        aria-label="Selectează pagina curentă"
                      />
                    </th>
                    <th className={thCls}>Nume</th>
                    <th className={thCls}>Oraș</th>
                    <th className={thCls}>Regiune</th>
                    <th className={thCls}>Țară</th>
                    <th className={thCls}>Email</th>
                    <th className={thCls}>UID</th>
                    <th className={thCls}>Limbă</th>
                    <th className={thCls}>iOS</th>
                    <th className={thCls}>Status</th>
                    <th className={thCls}>Model</th>
                    <th className={thCls}>Ultima activitate</th>
                    <th className={thCls}>Token</th>
                    <th className={thCls}>Doc ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tokens.map((t) => (
                    <tr key={t.id} className="transition hover:bg-slate-50">
                      <td className={tdCls}>
                        <input
                          type="checkbox"
                          checked={selectedSet.has(t.id)}
                          onChange={() => toggleRowSelection(t.id)}
                          className="h-4 w-4 rounded border-slate-300"
                          aria-label={`Selectează tokenul ${t.id}`}
                        />
                      </td>
                      <td className={tdCls}>{t.displayName || "—"}</td>
                      <td className={tdCls}>{t.city || "—"}</td>
                      <td className={tdCls}>{t.region || "—"}</td>
                      <td className={tdCls}>{t.country || "—"}</td>
                      <td className={tdCls}>
                        {t.email ? (
                          <a href={`mailto:${t.email}`} className="text-indigo-600 hover:underline">
                            {t.email}
                          </a>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className={tdCls}>
                        <span className="font-mono text-xs text-slate-600">{t.uid || "—"}</span>
                      </td>
                      <td className={tdCls}>{t.language || "—"}</td>
                      <td className={tdCls}>{t.isIos ? "Da" : "—"}</td>
                      <td className={tdCls}>
                        {t.disabled ? (
                          <span className="inline-flex rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-800">
                            Dezactivat
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                            Activ
                          </span>
                        )}
                      </td>
                      <td className={tdCls}>
                        <ModelBadge modelClass={t.modelClass} />
                      </td>
                      <td className={tdCls}>{formatDate(t.lastSeenAt)}</td>
                      <td className={tdCls}>
                        <span className="font-mono text-xs text-slate-500">{t.tokenPreview || "—"}</span>
                      </td>
                      <td className={tdCls}>
                        <span className="font-mono text-[10px] text-slate-400">{t.id}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {hasMore && !loading ? (
          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={() => load({ append: true, cursor: nextCursor })}
              disabled={loadingMore}
              className="rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
            >
              {loadingMore ? "Se încarcă…" : "Încarcă mai multe"}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function UserTokensPage() {
  return (
    <>
      <Head>
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <LocalPasswordGate redirectTo="/dashboard/login">
        <UserTokensScreen />
      </LocalPasswordGate>
    </>
  );
}
