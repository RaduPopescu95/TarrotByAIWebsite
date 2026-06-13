import React, { useCallback, useEffect, useMemo, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import LocalPasswordGate from "../../../components/Dashboard/LocalPasswordGate";

const DASHBOARD_SECRET = "Cristina1994!";
const DEFAULT_SAMPLE_LIMIT = 25;

function formatDateTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("ro-RO");
}

function formatInteger(value) {
  return new Intl.NumberFormat("ro-RO", { maximumFractionDigits: 0 }).format(Number(value) || 0);
}

function formatDecimal(value, digits = 1) {
  return new Intl.NumberFormat("ro-RO", { maximumFractionDigits: digits }).format(Number(value) || 0);
}

function formatBytes(bytes) {
  const value = Number(bytes) || 0;
  if (value < 1024) return `${formatInteger(value)} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let size = value / 1024;
  let index = 0;
  while (size >= 1024 && index < units.length - 1) {
    size /= 1024;
    index += 1;
  }
  return `${formatDecimal(size, size >= 100 ? 0 : 2)} ${units[index]}`;
}

function formatPercent(value) {
  return `${formatDecimal((Number(value) || 0) * 100, 1)}%`;
}

function StatCard({ label, value, sub, accent = "border-slate-200" }) {
  return (
    <div className={`rounded-2xl border bg-white p-5 shadow-sm ${accent}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
      {sub ? <p className="mt-1 text-xs text-slate-500">{sub}</p> : null}
    </div>
  );
}

function LoadingRows() {
  return (
    <div className="space-y-3 p-6">
      {[1, 2, 3].map((item) => (
        <div key={item} className="h-10 animate-pulse rounded-lg bg-slate-200" />
      ))}
    </div>
  );
}

function EmptyState({ title, detail }) {
  return (
    <div className="px-6 py-12 text-center">
      <p className="font-semibold text-slate-900">{title}</p>
      <p className="mt-2 text-sm text-slate-500">{detail}</p>
    </div>
  );
}

function CollectionsPanel({ refreshSignal }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState({ collections: [], summary: null, meta: null });
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("estimatedBytes");
  const [sampleLimit, setSampleLimit] = useState(DEFAULT_SAMPLE_LIMIT);

  const queryString = useMemo(() => {
    const params = new URLSearchParams({ sampleLimit: String(sampleLimit), sortBy });
    if (search) params.set("search", search);
    return params.toString();
  }, [sampleLimit, search, sortBy]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/dashboard/analytics?${queryString}`, {
        headers: { "x-dashboard-token": DASHBOARD_SECRET },
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "load_failed");
      setData({
        collections: Array.isArray(payload.collections) ? payload.collections : [],
        summary: payload.summary || null,
        meta: payload.meta || null,
      });
    } catch (loadError) {
      setError(loadError?.message || "Eroare la încărcare");
    } finally {
      setLoading(false);
    }
  }, [queryString]);

  useEffect(() => {
    load();
  }, [load, refreshSignal]);

  const summary = data.summary;
  return (
    <>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          setSearch(searchInput.trim());
        }}
        className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <div className="grid gap-4 lg:grid-cols-4">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Caută colecție</span>
            <input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Users, courses..." className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm" />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Sortare</span>
            <select value={sortBy} onChange={(event) => setSortBy(event.target.value)} className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm">
              <option value="estimatedBytes">Estimare mărime</option>
              <option value="documentCount">Număr documente</option>
              <option value="name">Nume</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Sample docs</span>
            <select value={sampleLimit} onChange={(event) => setSampleLimit(Number(event.target.value))} className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm">
              {[10, 25, 50, 100].map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </label>
          <div className="flex items-end">
            <button type="submit" className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white">Aplică</button>
          </div>
        </div>
      </form>

      {error ? <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div> : null}
      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Colecții root" value={loading ? "…" : formatInteger(summary?.collectionCount)} sub="Enumerare live" accent="border-sky-200" />
        <StatCard label="Documente totale" value={loading ? "…" : formatInteger(summary?.totalDocumentCount)} sub="Count exact" accent="border-emerald-200" />
        <StatCard label="Estimare totală" value={loading ? "…" : formatBytes(summary?.totalEstimatedBytes)} sub={`Sample ${sampleLimit}/colecție`} accent="border-amber-200" />
        <StatCard label="Cea mai mare" value={loading ? "…" : summary?.largestCollectionName || "—"} sub={formatBytes(summary?.largestEstimatedBytes)} accent="border-violet-200" />
      </div>

      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-sm">
        Count-ul este exact. Mărimea este estimată din payload-ul eșantionat și nu reprezintă storage bytes facturați. Ultima actualizare: <strong>{formatDateTime(data.meta?.generatedAt)}</strong>.
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          {loading ? <LoadingRows /> : data.collections.length === 0 ? <EmptyState title="Nicio colecție găsită" detail="Schimbă filtrul sau reîncarcă datele." /> : (
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50"><tr>{["Colecție", "Documente", "Sample", "Medie doc", "Estimare", "% total"].map((label) => <th key={label} className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">{label}</th>)}</tr></thead>
              <tbody className="divide-y divide-slate-100">
                {data.collections.map((row) => (
                  <tr key={row.name}>
                    <td className="px-4 py-3 font-semibold text-slate-900">{row.name}</td>
                    <td className="px-4 py-3 text-sm">{formatInteger(row.documentCount)}</td>
                    <td className="px-4 py-3 text-sm">{formatInteger(row.sampledCount)}</td>
                    <td className="px-4 py-3 text-sm">{formatBytes(row.averageDocBytes)}</td>
                    <td className="px-4 py-3 text-sm font-semibold">{row.estimatedSizeLabel}</td>
                    <td className="px-4 py-3 text-sm">{formatPercent(row.shareOfEstimatedTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}

function ReadsPanel({ refreshSignal }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);
  const [days, setDays] = useState(7);
  const [source, setSource] = useState("all");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const queryString = useMemo(() => {
    const params = new URLSearchParams({ days: String(days), source });
    if (search) params.set("search", search);
    return params.toString();
  }, [days, source, search]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/dashboard/analytics/reads?${queryString}`, {
        headers: { "x-dashboard-token": DASHBOARD_SECRET },
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "load_failed");
      setData(payload);
    } catch (loadError) {
      setError(loadError?.message || "Eroare la încărcare");
    } finally {
      setLoading(false);
    }
  }, [queryString]);

  useEffect(() => {
    load();
  }, [load, refreshSignal]);

  const summary = data?.summary || {};
  const trend = data?.trend || [];
  const maxTrend = Math.max(1, ...trend.map((row) => Math.max(row.nextProjectedReads, row.expoEstimatedReads)));

  return (
    <>
      <form onSubmit={(event) => { event.preventDefault(); setSearch(searchInput.trim()); }} className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-4">
          <label><span className="mb-2 block text-sm font-semibold text-slate-700">Perioadă</span><select value={days} onChange={(event) => setDays(Number(event.target.value))} className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm">{[1, 7, 14, 30].map((value) => <option key={value} value={value}>{value} zile</option>)}</select></label>
          <label><span className="mb-2 block text-sm font-semibold text-slate-700">Sursă</span><select value={source} onChange={(event) => setSource(event.target.value)} className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"><option value="all">Next + Expo</option><option value="next">Next.js</option><option value="expo">Expo</option></select></label>
          <label><span className="mb-2 block text-sm font-semibold text-slate-700">Caută</span><input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="rută, query, ecran..." className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm" /></label>
          <div className="flex items-end"><button type="submit" className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white">Aplică</button></div>
        </div>
      </form>

      {error ? <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div> : null}
      {data?.meta?.truncated ? <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">Rezultatul a atins limita de {formatInteger(data.meta.documentLimit)} documente agregate. Micșorează perioada sau filtrează sursa.</div> : null}

      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Next observat" value={loading ? "…" : formatInteger(summary.nextObservedReads)} sub={`${formatInteger(summary.nextSampledRequests)} request-uri sample`} accent="border-sky-200" />
        <StatCard label="Next proiectat" value={loading ? "…" : formatInteger(summary.nextProjectedReads)} sub="Extrapolare sampling 10%" accent="border-violet-200" />
        <StatCard label="Expo estimate" value={loading ? "…" : formatInteger(summary.expoEstimatedReads)} sub={`${formatInteger(summary.expoLogicalReadCalls)} apeluri logice`} accent="border-emerald-200" />
        <StatCard label="Realtime Expo" value={loading ? "…" : formatInteger(summary.realtimeSnapshots)} sub={`${formatInteger(summary.realtimeSubscriptions)} subscriptions`} accent="border-amber-200" />
      </div>

      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-slate-900">Trend zilnic</h2>
        {loading ? <LoadingRows /> : trend.length === 0 ? <EmptyState title="Nu există încă date" detail="Telemetria apare după request-uri eșantionate și flush-uri Expo." /> : (
          <div className="mt-4 space-y-4">
            {trend.map((row) => (
              <div key={row.date} className="grid gap-2 sm:grid-cols-[100px_1fr_110px] sm:items-center">
                <span className="text-sm font-medium text-slate-700">{row.date}</span>
                <div className="space-y-1">
                  <div className="h-2 rounded bg-violet-100"><div className="h-2 rounded bg-violet-500" style={{ width: `${Math.max(1, (row.nextProjectedReads / maxTrend) * 100)}%` }} /></div>
                  <div className="h-2 rounded bg-emerald-100"><div className="h-2 rounded bg-emerald-500" style={{ width: `${Math.max(1, (row.expoEstimatedReads / maxTrend) * 100)}%` }} /></div>
                </div>
                <span className="text-right text-xs text-slate-500">N {formatInteger(row.nextProjectedReads)} · E {formatInteger(row.expoEstimatedReads)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-slate-900">Recomandări</h2>
        {(data?.recommendations || []).length === 0 ? <p className="mt-3 text-sm text-slate-500">Nu există încă suficiente date pentru recomandări.</p> : (
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            {data.recommendations.map((item, index) => (
              <div key={`${item.type}-${item.target}-${index}`} className={`rounded-xl border p-4 ${item.severity === "high" ? "border-red-200 bg-red-50" : "border-amber-200 bg-amber-50"}`}>
                <div className="flex items-center justify-between gap-3"><strong className="text-sm text-slate-900">{item.target}</strong><span className="rounded-full bg-white px-2 py-1 text-xs font-semibold uppercase text-slate-600">{item.source}</span></div>
                <p className="mt-2 text-sm text-slate-700">{item.message}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <ReadTable title="Rute Next.js" loading={loading} rows={data?.next?.routes || []} columns={[
        ["Rută", (row) => row.route], ["Requests sample", (row) => formatInteger(row.observedRequests)], ["Reads proiectate", (row) => formatInteger(row.projectedEstimatedReads)], ["Durată medie", (row) => `${formatDecimal(row.averageRequestDurationMs)} ms`], ["Cache public", (row) => formatPercent(row.publicCacheRate)],
      ]} />
      <ReadTable title="Query-uri Next.js" loading={loading} rows={data?.next?.queries || []} columns={[
        ["Rută / query", (row) => <><strong>{row.route}</strong><div className="text-xs text-slate-500">{row.queryName}</div></>], ["Reads proiectate", (row) => formatInteger(row.projectedEstimatedReads)], ["Reads/request", (row) => formatDecimal(row.readsPerRequest)], ["Query/request", (row) => formatDecimal(row.queriesPerRequest)], ["Cache hit", (row) => formatPercent(row.cacheHitRate)], ["Încredere", (row) => row.confidence],
      ]} />
      <ReadTable title="Ecrane și colecții Expo" loading={loading} rows={data?.expo?.rows || []} columns={[
        ["Ecran / colecție", (row) => <><strong>{row.screenName}</strong><div className="text-xs text-slate-500">{row.collectionPathPattern}</div></>], ["Reads estimate", (row) => formatInteger(row.estimatedServerDocReads)], ["Apeluri", (row) => formatInteger(row.logicalReadCalls)], ["Cache hit", (row) => formatPercent(row.cacheHitRate)], ["Realtime", (row) => formatInteger(row.realtimeSnapshots || row.realtimeSubscriptions)],
      ]} />

      <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-sm">
        Valorile sunt estimări de document reads, nu factura exactă. Nu includ precis index-entry reads sau citirile suplimentare din reguli. Next.js este proiectat de la sampling 10%; Expo include numai utilizatorii activați în allowlist. Ultima actualizare: <strong>{formatDateTime(data?.meta?.generatedAt)}</strong>.
      </div>
    </>
  );
}

function ReadTable({ title, loading, rows, columns }) {
  return (
    <div className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-5 py-4"><h2 className="font-semibold text-slate-900">{title}</h2></div>
      <div className="overflow-x-auto">
        {loading ? <LoadingRows /> : rows.length === 0 ? <EmptyState title="Fără date" detail="Nu există agregate pentru filtrul selectat." /> : (
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50"><tr>{columns.map(([label]) => <th key={label} className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">{label}</th>)}</tr></thead>
            <tbody className="divide-y divide-slate-100">{rows.slice(0, 100).map((row, index) => <tr key={`${title}-${index}`}>{columns.map(([label, render]) => <td key={label} className="px-4 py-3 text-sm text-slate-700">{render(row)}</td>)}</tr>)}</tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function AnalyticsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("collections");
  const [refreshSignal, setRefreshSignal] = useState(0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push("/dashboard")} className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm">← Dashboard</button>
            <div><h1 className="text-xl font-bold text-gray-900">Firestore Analytics</h1><p className="text-sm text-slate-500">Dimensiunea datelor și cost drivers pentru document reads.</p></div>
          </div>
          <button type="button" onClick={() => setRefreshSignal((value) => value + 1)} className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm">Refresh</button>
        </div>

        <div className="mb-6 inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
          {[['collections', 'Collections'], ['reads', 'Reads']].map(([value, label]) => (
            <button key={value} type="button" onClick={() => setActiveTab(value)} className={`rounded-lg px-5 py-2 text-sm font-semibold ${activeTab === value ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"}`}>{label}</button>
          ))}
        </div>

        {activeTab === "collections" ? <CollectionsPanel refreshSignal={refreshSignal} /> : <ReadsPanel refreshSignal={refreshSignal} />}
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  return (
    <>
      <Head><meta name="robots" content="noindex,nofollow" /></Head>
      <LocalPasswordGate redirectTo="/dashboard/login"><AnalyticsScreen /></LocalPasswordGate>
    </>
  );
}
