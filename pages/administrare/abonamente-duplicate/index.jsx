import React, { useCallback, useEffect, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import LocalPasswordGate from "../../../components/Dashboard/LocalPasswordGate";

const STATUS_LABEL = {
  active: "Activ",
  trialing: "Trial",
  past_due: "Restanțier",
};

const STATUS_COLOR = {
  active: "bg-emerald-100 text-emerald-800",
  trialing: "bg-sky-100 text-sky-800",
  past_due: "bg-amber-100 text-amber-900",
};

function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        STATUS_COLOR[status] || "bg-slate-100 text-slate-700"
      }`}
    >
      {STATUS_LABEL[status] || status || "—"}
    </span>
  );
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("ro-RO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatDateTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("ro-RO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatMoney(amount, currency) {
  if (typeof amount !== "number" || !currency) return "—";
  try {
    return new Intl.NumberFormat("ro-RO", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  } catch {
    return `${(amount / 100).toFixed(2)} ${currency.toUpperCase()}`;
  }
}

function formatBillingInterval(interval, intervalCount) {
  if (!interval) return "";
  const count = intervalCount || 1;
  const labels = {
    day: count === 1 ? "zi" : "zile",
    week: count === 1 ? "săptămână" : "săptămâni",
    month: count === 1 ? "lună" : "luni",
    year: count === 1 ? "an" : "ani",
  };
  return count === 1
    ? `/ ${labels[interval] || interval}`
    : `/ ${count} ${labels[interval] || interval}`;
}

function StatCard({ label, value, description, color = "border-slate-200" }) {
  return (
    <div className={`rounded-2xl border bg-white p-5 shadow-sm ${color}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-3xl font-bold text-slate-900">{value}</p>
      {description ? <p className="mt-1 text-xs text-slate-500">{description}</p> : null}
    </div>
  );
}

function DuplicateGroup({ group }) {
  const fullName = [group.firstName, group.lastName].filter(Boolean).join(" ");
  return (
    <article className="overflow-hidden rounded-2xl border border-amber-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3 bg-amber-50/70 px-5 py-4">
        <div className="min-w-0">
          <h2 className="font-semibold text-slate-900">
            {fullName || group.email || "Utilizator fără nume"}
          </h2>
          {group.email ? (
            <a href={`mailto:${group.email}`} className="text-sm text-indigo-700 hover:underline">
              {group.email}
            </a>
          ) : null}
          <p className="mt-1 break-all font-mono text-[11px] text-slate-500">
            UID: {group.uid}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-white px-2.5 py-1 font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200">
            {group.subscriptionCount} abonamente
          </span>
          <span className="rounded-full bg-rose-100 px-2.5 py-1 font-semibold text-rose-800">
            {group.extraSubscriptionCount} suplimentare
          </span>
        </div>
      </div>

      <div className="overflow-x-auto border-t border-amber-100">
        <table className="min-w-full divide-y divide-slate-100">
          <thead className="bg-slate-50">
            <tr>
              {["Abonament", "Customer", "Status", "Creat", "Perioada curentă", "Preț", "Anulare"].map((label) => (
                <th
                  key={label}
                  className="whitespace-nowrap px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500"
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {group.subscriptions.map((subscription) => (
              <tr key={subscription.id} className="text-sm text-slate-700 transition hover:bg-slate-50">
                <td className="whitespace-nowrap px-4 py-3">
                  <a
                    href={`https://dashboard.stripe.com/subscriptions/${subscription.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-mono text-xs font-semibold text-indigo-700 hover:underline"
                    title="Deschide abonamentul în Stripe"
                  >
                    {subscription.id}
                    <span aria-hidden="true">↗</span>
                  </a>
                  {subscription.resolvedBy === "stripe_customer" ? (
                    <p className="mt-1 text-[10px] text-slate-400">UID găsit prin Customer</p>
                  ) : null}
                </td>
                <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-slate-600">
                  {subscription.customerId || "—"}
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <StatusBadge status={subscription.status} />
                </td>
                <td className="whitespace-nowrap px-4 py-3">{formatDate(subscription.createdAt)}</td>
                <td className="whitespace-nowrap px-4 py-3">
                  {formatDate(subscription.currentPeriodStart)} – {formatDate(subscription.currentPeriodEnd)}
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <span className="font-medium text-slate-900">
                    {formatMoney(subscription.amount, subscription.currency)}
                  </span>{" "}
                  <span className="text-xs text-slate-500">
                    {formatBillingInterval(subscription.interval, subscription.intervalCount)}
                  </span>
                  {subscription.priceId ? (
                    <p
                      className="mt-1 font-mono text-[10px] text-slate-400"
                      title={subscription.productId || undefined}
                    >
                      {subscription.priceId}
                    </p>
                  ) : null}
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  {subscription.cancelAtPeriodEnd ? (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-900">
                      La finalul perioadei
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400">Nu</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </article>
  );
}

function DuplicateSubscriptionsScreen() {
  const router = useRouter();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/dashboard/subscription-duplicates", {
        cache: "no-store",
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.error || "Nu am putut verifica abonamentele Stripe.");
      }
      setReport(payload);
    } catch (loadError) {
      setError(loadError?.message || "Eroare la verificarea abonamentelor Stripe.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const groups = Array.isArray(report?.groups) ? report.groups : [];

  return (
    <div className="min-h-screen bg-slate-50">
      <Head>
        <title>Abonamente duplicate | Administrare</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>

      <main className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={() => router.push("/administrare")}
            className="group flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-400 hover:shadow"
          >
            <span className="transition-transform group-hover:-translate-x-0.5" aria-hidden="true">←</span>
            Administrare
          </button>
          <div className="h-8 w-px bg-slate-300" />
          <div>
            <h1 className="text-xl font-bold text-slate-900">Abonamente duplicate</h1>
            <p className="text-sm text-slate-500">Stripe Premium · grupare exactă după UID</p>
          </div>
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="ml-auto flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
          >
            <span className={loading ? "animate-spin" : ""} aria-hidden="true">↻</span>
            Reîncarcă
          </button>
        </div>

        <div className="mb-6 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
          <strong>Doar vizualizare.</strong> Această pagină nu anulează abonamente și nu modifică drepturile premium.
        </div>

        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            label="Utilizatori afectați"
            value={loading ? "…" : report?.totalUsers || 0}
            description="UID-uri cu minimum două abonamente"
            color={report?.totalUsers > 0 ? "border-amber-300" : "border-emerald-200"}
          />
          <StatCard
            label="Abonamente găsite"
            value={loading ? "…" : report?.totalSubscriptions || 0}
            description="Doar din grupurile duplicate"
          />
          <StatCard
            label="Abonamente suplimentare"
            value={loading ? "…" : report?.extraSubscriptions || 0}
            description="Peste limita de unul per UID"
            color={report?.extraSubscriptions > 0 ? "border-rose-300" : "border-emerald-200"}
          />
        </div>

        {loading ? (
          <div className="space-y-4" aria-label="Se verifică abonamentele Stripe">
            {[0, 1].map((item) => (
              <div key={item} className="h-36 animate-pulse rounded-2xl bg-slate-200" />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">
            <p>{error}</p>
            <button
              type="button"
              onClick={load}
              className="mt-3 rounded-lg bg-red-700 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-600"
            >
              Reîncearcă
            </button>
          </div>
        ) : groups.length === 0 ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-6 text-sm font-medium text-emerald-900">
            Nu au fost găsite abonamente duplicate pentru același utilizator.
          </div>
        ) : (
          <div className="space-y-5">
            {groups.map((group) => (
              <DuplicateGroup key={group.uid} group={group} />
            ))}
          </div>
        )}

        {!loading && !error && report?.unresolvedCount > 0 ? (
          <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {report.unresolvedCount} abonament(e) premium în curs nu au putut fi asociate fără ambiguitate unui UID și nu sunt incluse în lista certă.
          </div>
        ) : null}

        {!loading && !error && report?.generatedAt ? (
          <p className="mt-4 text-right text-xs text-slate-400">
            Verificare Stripe: {formatDateTime(report.generatedAt)}
          </p>
        ) : null}
      </main>
    </div>
  );
}

export default function DuplicateSubscriptionsPage() {
  return (
    <LocalPasswordGate redirectTo="/administrare/login">
      <DuplicateSubscriptionsScreen />
    </LocalPasswordGate>
  );
}
