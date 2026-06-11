import React, { useCallback, useEffect, useMemo, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import LocalPasswordGate from "../../../components/Dashboard/LocalPasswordGate";

const DASHBOARD_SECRET = "Cristina1994!";

const MODEL_FILTERS = [
  { key: "all", label: "Toți" },
  { key: "complete", label: "Complet" },
  { key: "missing_name", label: "Lipsește nume" },
  { key: "missing_city", label: "Lipsește oraș" },
  { key: "legacy", label: "Legacy" },
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

function UserTokensScreen() {
  const router = useRouter();
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("");
  const [modelFilter, setModelFilter] = useState("all");
  const [disabledOnly, setDisabledOnly] = useState(false);
  const [cities, setCities] = useState([]);
  const [stats, setStats] = useState(null);
  const [nextCursor, setNextCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [scanTruncated, setScanTruncated] = useState(false);
  const [scannedCount, setScannedCount] = useState(0);

  const buildQuery = useCallback(
    (cursor) => {
      const params = new URLSearchParams();
      params.set("limit", "50");
      params.set("stats", "1");
      if (cursor) params.set("cursor", cursor);
      if (search.trim()) params.set("search", search.trim());
      if (city.trim()) params.set("city", city.trim());
      if (modelFilter !== "all") params.set("modelFilter", modelFilter);
      if (disabledOnly) params.set("disabledOnly", "1");
      return params.toString();
    },
    [search, city, modelFilter, disabledOnly]
  );

  const load = useCallback(
    async ({ append = false, cursor = null } = {}) => {
      if (append) setLoadingMore(true);
      else {
        setLoading(true);
        setError("");
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
    [buildQuery]
  );

  useEffect(() => {
    load();
  }, [load]);

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

  const thCls =
    "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 whitespace-nowrap";
  const tdCls = "px-4 py-3 text-sm text-slate-800 whitespace-nowrap";

  return (
    <div className="min-h-screen bg-gray-50">
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
          Inspectează documentele din colecția <code className="text-xs">userTokens</code>. Filtrează
          după oraș și nume (<code className="text-xs">displayName</code>) sau găsește înregistrări legacy
          fără model nou complet.
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

        <div className="mb-4 flex flex-wrap items-center gap-3">
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
              className="w-72 rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-4 text-sm text-slate-800 shadow-sm outline-none placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
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

          <label className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm">
            <input
              type="checkbox"
              checked={disabledOnly}
              onChange={(e) => setDisabledOnly(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300"
            />
            Doar dezactivate
          </label>

          <button
            type="button"
            onClick={() => load()}
            disabled={loading}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:opacity-50"
          >
            Aplică filtre
          </button>

          <div className="flex flex-wrap gap-2">
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

        {scanTruncated ? (
          <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Filtrul a scanat maxim {scannedCount} documente; rezultatele pot fi incomplete. Rafinează
            căutarea sau folosește paginarea.
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
