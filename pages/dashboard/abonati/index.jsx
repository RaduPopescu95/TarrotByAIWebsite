import React, { useCallback, useEffect, useMemo, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import LocalPasswordGate from "../../../components/Dashboard/LocalPasswordGate";

const DASHBOARD_SECRET = "Cristina1994!";

const STATUS_LABEL = {
  active: "Activ",
  past_due: "Restanțier",
  canceled: "Anulat",
  unpaid: "Neplătit",
  expired: "Expirat",
  trialing: "Trial",
  "": "—",
};

const STATUS_COLOR = {
  active: "bg-emerald-100 text-emerald-800",
  past_due: "bg-amber-100 text-amber-800",
  canceled: "bg-slate-100 text-slate-600",
  unpaid: "bg-red-100 text-red-700",
  expired: "bg-slate-100 text-slate-500",
  trialing: "bg-sky-100 text-sky-800",
  "": "bg-slate-100 text-slate-500",
};

function Badge({ status }) {
  const cls = STATUS_COLOR[status] || "bg-slate-100 text-slate-600";
  const label = STATUS_LABEL[status] || status || "—";
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}>
      {label}
    </span>
  );
}

function PremiumDot({ active }) {
  return (
    <span
      title={active ? "Premium activ" : "Fără acces premium"}
      className={`inline-block h-2.5 w-2.5 rounded-full ${active ? "bg-emerald-500" : "bg-slate-300"}`}
    />
  );
}

function formatDate(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("ro-RO", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function StatCard({ label, value, sub, color }) {
  return (
    <div className={`rounded-2xl border bg-white p-5 shadow-sm ${color || "border-slate-200"}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-3xl font-bold text-slate-900">{value}</p>
      {sub ? <p className="mt-1 text-xs text-slate-500">{sub}</p> : null}
    </div>
  );
}

function RemoveSubscriberModal({ subscriber, activeRevokeAck, onAckChange, onClose, onConfirm, removing }) {
  if (!subscriber) return null;
  const isActive = subscriber.premium === true;
  const name = [subscriber.firstName, subscriber.lastName].filter(Boolean).join(" ") || subscriber.email || subscriber.uid;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="remove-sub-title">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-[1px]"
        onClick={() => !removing && onClose()}
        aria-label="Închide"
      />
      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
        <h2 id="remove-sub-title" className="text-lg font-semibold text-slate-900">
          Elimină din listă
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Sigur vrei să elimini acest utilizator din lista de abonați? Se vor șterge din profil câmpurile de abonament și datele de facturare salvate la checkout.
        </p>

        {isActive ? (
          <div className="mt-4 rounded-xl border-2 border-amber-300 bg-amber-50 px-4 py-3">
            <p className="text-sm font-semibold text-amber-900">Abonament activ sau cu acces premium</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-900/90">
              <li>Abonamentul Stripe va fi anulat imediat — clientul nu mai este taxat.</li>
              <li>Accesul premium pe site este revocat imediat după confirmare.</li>
              <li>Acțiunea nu poate fi anulată din acest panou; verifică înainte în Stripe dacă e nevoie.</li>
            </ul>
            <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-lg border border-amber-200 bg-white/80 px-3 py-2.5">
              <input
                type="checkbox"
                checked={activeRevokeAck}
                onChange={(e) => onAckChange(e.target.checked)}
                disabled={removing}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-amber-400 text-amber-700 focus:ring-amber-500"
              />
              <span className="text-sm font-medium text-amber-950">
                Înțeleg: anulez abonamentul în Stripe și revoc accesul premium pentru {name}.
              </span>
            </label>
          </div>
        ) : (
          <p className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
            Utilizator: <strong>{name}</strong>
            {subscriber.email ? (
              <>
                {" "}
                — <span className="text-slate-600">{subscriber.email}</span>
              </>
            ) : null}
          </p>
        )}

        <div className="mt-6 flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={removing}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
          >
            Anulează
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={removing || (isActive && !activeRevokeAck)}
            className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {removing ? "Se elimină…" : "Elimină definitiv"}
          </button>
        </div>
      </div>
    </div>
  );
}

function GrantPremiumModal({ subscriber, months, onMonthsChange, note, onNoteChange, onClose, onConfirm, submitting }) {
  if (!subscriber) return null;
  const name = [subscriber.firstName, subscriber.lastName].filter(Boolean).join(" ") || subscriber.email || subscriber.uid;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="grant-premium-title">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-[1px]"
        onClick={() => !submitting && onClose()}
        aria-label="Închide"
      />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
        <h2 id="grant-premium-title" className="text-lg font-semibold text-slate-900">
          Acordă acces premium
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          Profilul <strong className="text-slate-800">{name}</strong>
          {subscriber.email ? (
            <>
              {" "}
              <span className="text-slate-500">({subscriber.email})</span>
            </>
          ) : null}{" "}
          va fi actualizat în baza de date cu acces premium. Confirmi?
        </p>
        <label className="mt-4 block">
          <span className="mb-1.5 block text-xs font-medium text-slate-600">Durată</span>
          <select
            value={months}
            onChange={(e) => onMonthsChange(Number(e.target.value))}
            disabled={submitting}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none focus:border-indigo-400 disabled:opacity-60"
          >
            <option value={0}>Nelimitat</option>
            {[1, 2, 3, 6, 12].map((m) => (
              <option key={m} value={m}>
                {m} {m === 1 ? "lună" : "luni"}
              </option>
            ))}
          </select>
        </label>
        <label className="mt-4 block">
          <span className="mb-1.5 block text-xs font-medium text-slate-600">Notă internă (opțional)</span>
          <input
            type="text"
            value={note}
            onChange={(e) => onNoteChange(e.target.value)}
            placeholder="ex. Cadou / test"
            disabled={submitting}
            maxLength={500}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none focus:border-indigo-400 disabled:opacity-60"
          />
        </label>
        <div className="mt-6 flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
          >
            Anulează
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={submitting}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:opacity-50"
          >
            {submitting ? "Se salvează…" : "Confirmă"}
          </button>
        </div>
      </div>
    </div>
  );
}

function SubscribersScreen() {
  const router = useRouter();
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortField, setSortField] = useState("updatedAt");
  const [sortDir, setSortDir] = useState("desc");
  const [removeTarget, setRemoveTarget] = useState(null);
  const [activeRevokeAck, setActiveRevokeAck] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [grantModalTarget, setGrantModalTarget] = useState(null);
  const [grantModalMonths, setGrantModalMonths] = useState(0);
  const [grantModalNote, setGrantModalNote] = useState("");
  const [grantSubmitting, setGrantSubmitting] = useState(false);
  const [grantUid, setGrantUid] = useState("");
  const [grantEmail, setGrantEmail] = useState("");
  const [grantMonths, setGrantMonths] = useState(0);
  const [grantNote, setGrantNote] = useState("");
  const [grantBusy, setGrantBusy] = useState(false);
  const [grantBanner, setGrantBanner] = useState(null);
  const [grantLogs, setGrantLogs] = useState([]);

  const pushGrantLog = (entry) => {
    const log = { id: Date.now(), at: new Date().toLocaleString("ro-RO"), ...entry };
    setGrantLogs((prev) => [log, ...prev].slice(0, 15));
    console.log("[grant_manual]", log);
    return log;
  };

  const runGrantManual = async ({ source, uid, email, months, note }) => {
    const payload = {
      action: "grant_manual",
      uid: uid?.trim() || undefined,
      email: email?.trim() || undefined,
      months,
      note: note?.trim() || undefined,
    };

    pushGrantLog({ source, status: "pending", message: "Trimit cerere…", request: payload });

    const res = await fetch("/api/dashboard/subscribers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-dashboard-token": DASHBOARD_SECRET,
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const message = data?.message || data?.error || "grant_failed";
      pushGrantLog({
        source,
        status: "error",
        httpStatus: res.status,
        message,
        request: payload,
        debug: data?.debug || null,
      });
      throw new Error(message);
    }

    const appears = data?.debug?.appearsInTable !== false;
    const inList = data?.debug?.inSubscriberList !== false;
    const resolvedBy = data?.debug?.resolvedBy;
    const targetDocId = data?.uid || data?.debug?.targetDocId;

    pushGrantLog({
      source,
      status: appears && inList ? "success" : "warning",
      httpStatus: res.status,
      message:
        appears && inList
          ? `Salvat pe document Users/${targetDocId}${resolvedBy ? ` (găsit prin ${resolvedBy})` : ""}`
          : `Salvat în DB dar NU apare în listă (doc: ${targetDocId}) — vezi debug`,
      request: payload,
      debug: data?.debug || null,
      uid: targetDocId,
    });

    return data;
  };

  const openGrantModal = (s) => {
    setGrantModalMonths(0);
    setGrantModalNote("");
    setGrantModalTarget(s);
  };

  const closeGrantModal = () => {
    if (grantSubmitting) return;
    setGrantModalTarget(null);
  };

  const confirmGrantFromModal = async () => {
    if (!grantModalTarget) return;
    setGrantSubmitting(true);
    setError("");
    try {
      const data = await runGrantManual({
        source: "modal",
        uid: grantModalTarget.uid,
        months: grantModalMonths,
        note: grantModalNote,
      });
      setGrantModalTarget(null);
      setStatusFilter("manual");
      if (data?.debug?.appearsInTable === false || data?.debug?.inSubscriberList === false) {
        setError("Acces salvat, dar utilizatorul nu apare în tabel — verifică logul de mai jos.");
      }
      await load();
    } catch (e) {
      setError(e?.message || "Eroare la acordare");
    } finally {
      setGrantSubmitting(false);
    }
  };

  const submitGrant = async () => {
    if (!grantUid.trim() && !grantEmail.trim()) {
      setGrantBanner({ type: "error", text: "Completează cel puțin UID sau email." });
      return;
    }
    setGrantBusy(true);
    setGrantBanner(null);
    try {
      const data = await runGrantManual({
        source: "form",
        uid: grantUid,
        email: grantEmail,
        months: grantMonths,
        note: grantNote,
      });
      const resolvedBy = data?.debug?.resolvedBy ? `, găsit prin ${data.debug.resolvedBy}` : "";
      const listWarning =
        data?.debug?.appearsInTable === false || data?.debug?.inSubscriberList === false
          ? " Atenție: nu apare în tabel — vezi logul."
          : "";
      setGrantBanner({
        type: data?.debug?.appearsInTable === false || data?.debug?.inSubscriberList === false ? "error" : "success",
        text: `Acces premium manual activ (Users/${data.uid}${resolvedBy}).${listWarning}`,
      });
      setGrantUid("");
      setGrantEmail("");
      setGrantNote("");
      setGrantMonths(0);
      setStatusFilter("manual");
      await load();
    } catch (e) {
      setGrantBanner({ type: "error", text: e?.message || "Eroare la acordare" });
    } finally {
      setGrantBusy(false);
    }
  };

  const openRemoveModal = (s) => {
    setRemoveTarget(s);
    setActiveRevokeAck(false);
  };

  const closeRemoveModal = () => {
    if (removing) return;
    setRemoveTarget(null);
    setActiveRevokeAck(false);
  };

  const confirmRemove = async () => {
    if (!removeTarget) return;
    if (removeTarget.premium && !activeRevokeAck) return;
    setRemoving(true);
    setError("");
    try {
      const res = await fetch("/api/dashboard/subscribers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-dashboard-token": DASHBOARD_SECRET,
        },
        body: JSON.stringify({
          uid: removeTarget.uid,
          confirmActiveRevocation: removeTarget.premium ? true : undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg =
          data?.error === "active_revocation_not_confirmed"
            ? "Bifează confirmarea pentru utilizatorii cu abonament activ."
            : data?.message || data?.error || "Eroare la eliminare";
        throw new Error(msg);
      }
      setSubscribers((prev) => prev.filter((x) => x.uid !== removeTarget.uid));
      setRemoveTarget(null);
      setActiveRevokeAck(false);
    } catch (e) {
      setError(e?.message || "Eroare la eliminare");
    } finally {
      setRemoving(false);
    }
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/dashboard/subscribers", {
        headers: { "x-dashboard-token": DASHBOARD_SECRET },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "load_failed");
      setSubscribers(Array.isArray(data.subscribers) ? data.subscribers : []);
    } catch (e) {
      setError(e?.message || "Eroare la încărcare");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const stats = useMemo(() => {
    const active = subscribers.filter((s) => s.premium).length;
    const manual = subscribers.filter((s) => s.isManual).length;
    const manualActive = subscribers.filter((s) => s.isManual && s.premium).length;
    const canceled = subscribers.filter((s) => s.subscriptionStatus === "canceled").length;
    const cancelAtEnd = subscribers.filter((s) => s.cancelAtPeriodEnd && s.premium).length;
    return { total: subscribers.length, active, manual, manualActive, canceled, cancelAtEnd };
  }, [subscribers]);

  const filtered = useMemo(() => {
    let list = subscribers;
    if (statusFilter === "active") list = list.filter((s) => s.premium);
    else if (statusFilter === "canceled") list = list.filter((s) => s.subscriptionStatus === "canceled");
    else if (statusFilter === "issues") list = list.filter((s) => s.subscriptionStatus === "past_due" || s.subscriptionStatus === "unpaid");
    else if (statusFilter === "manual") list = list.filter((s) => s.isManual);

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((s) =>
        `${s.firstName} ${s.lastName} ${s.email} ${s.stripeSubscriptionId} ${s.stripeCustomerId} ${s.billingName}`
          .toLowerCase()
          .includes(q)
      );
    }

    const validitySortMs = (s) => {
      if (s.isManual) {
        if (s.manualPremiumExpiresAt) return new Date(s.manualPremiumExpiresAt).getTime();
        return Number.MAX_SAFE_INTEGER;
      }
      if (s.currentPeriodEnd) return new Date(s.currentPeriodEnd).getTime();
      return 0;
    };

    return [...list].sort((a, b) => {
      if (sortField === "currentPeriodEnd") {
        const va = validitySortMs(a);
        const vb = validitySortMs(b);
        if (va < vb) return sortDir === "asc" ? -1 : 1;
        if (va > vb) return sortDir === "asc" ? 1 : -1;
        return 0;
      }
      let va = a[sortField] ?? "";
      let vb = b[sortField] ?? "";
      if (typeof va === "boolean") va = va ? 1 : 0;
      if (typeof vb === "boolean") vb = vb ? 1 : 0;
      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [subscribers, statusFilter, search, sortField, sortDir]);

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <span className="ml-1 text-slate-300">↕</span>;
    return <span className="ml-1 text-indigo-600">{sortDir === "asc" ? "↑" : "↓"}</span>;
  };

  const thCls = "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 whitespace-nowrap cursor-pointer hover:text-slate-800 select-none";
  const tdCls = "px-4 py-3 text-sm text-slate-800 whitespace-nowrap";

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <meta name="robots" content="noindex,nofollow" />
      </Head>

      <div className="px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex flex-wrap items-center gap-4">
          <button
            onClick={() => router.push("/dashboard")}
            className="group flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:border-gray-400 hover:shadow"
          >
            <svg className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Dashboard
          </button>
          <div className="flex items-center gap-3">
            <div className="h-8 w-px bg-gray-300" />
            <h1 className="text-xl font-bold text-gray-900">Abonați Premium</h1>
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="ml-auto flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
          >
            <svg className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Reîncarcă
          </button>
        </div>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <StatCard label="Total înregistrați" value={stats.total} color="border-slate-200" />
          <StatCard label="Activi acum" value={stats.active} color="border-emerald-200" />
          <StatCard
            label="Adăugați manual"
            value={stats.manual}
            sub={stats.manualActive < stats.manual ? `${stats.manualActive} activi acum` : "acces din panou"}
            color="border-fuchsia-200"
          />
          <StatCard label="Anulați" value={stats.canceled} color="border-slate-200" />
          <StatCard label="Anulare la final perioadă" value={stats.cancelAtEnd} sub="activi, dar fără reînnoire" color="border-amber-200" />
        </div>

        {/* Opțional: introducere UID / email dacă utilizatorul nu e în tabel */}
        <details className="mb-8 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <summary className="cursor-pointer text-sm font-medium text-slate-800">
            Avansat: caută după UID sau email (fără rând în tabel)
          </summary>
          <div className="mt-4 border-t border-slate-100 pt-4">
          <p className="mb-3 text-xs text-slate-600">
            Folosește doar când utilizatorul nu apare în listă. Pentru rândurile din tabel, folosește „Acordă premium”.
          </p>
          <p className="mb-3 text-xs text-amber-800/90">
            Blocat doar dacă utilizatorul are încă acces activ prin Stripe — mai întâi „Șterge” sau anulează acolo.
          </p>
          {grantBanner ? (
            <div
              className={`mt-3 rounded-lg px-3 py-2 text-sm ${
                grantBanner.type === "success"
                  ? "border border-emerald-200 bg-emerald-50 text-emerald-900"
                  : "border border-red-200 bg-red-50 text-red-800"
              }`}
            >
              {grantBanner.text}
            </div>
          ) : null}
          <div className="mt-4 flex flex-wrap items-end gap-3">
            <label className="block min-w-[10rem] flex-1">
              <span className="mb-1 block text-xs font-medium text-slate-600">UID (Firebase Auth)</span>
              <input
                value={grantUid}
                onChange={(e) => setGrantUid(e.target.value)}
                placeholder="ex. X1X8tHjY…"
                disabled={grantBusy}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 disabled:opacity-60"
              />
            </label>
            <label className="block min-w-[12rem] flex-1">
              <span className="mb-1 block text-xs font-medium text-slate-600">sau Email (din profil)</span>
              <input
                type="email"
                value={grantEmail}
                onChange={(e) => setGrantEmail(e.target.value)}
                placeholder="email din Users"
                disabled={grantBusy}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 disabled:opacity-60"
              />
            </label>
            <label className="block w-full min-w-[8rem] sm:w-40">
              <span className="mb-1 block text-xs font-medium text-slate-600">Durată (luni)</span>
              <select
                value={grantMonths}
                onChange={(e) => setGrantMonths(Number(e.target.value))}
                disabled={grantBusy}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-indigo-400 disabled:opacity-60"
              >
                <option value={0}>Nelimitat</option>
                {[1, 2, 3, 6, 12].map((m) => (
                  <option key={m} value={m}>
                    {m} {m === 1 ? "lună" : "luni"}
                  </option>
                ))}
              </select>
            </label>
            <label className="block min-w-full flex-[2] sm:min-w-[14rem]">
              <span className="mb-1 block text-xs font-medium text-slate-600">Notă internă (opțional)</span>
              <input
                value={grantNote}
                onChange={(e) => setGrantNote(e.target.value)}
                placeholder="ex. Cadou / test"
                disabled={grantBusy}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-indigo-400 disabled:opacity-60"
              />
            </label>
            <button
              type="button"
              onClick={submitGrant}
              disabled={grantBusy}
              className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:opacity-50"
            >
              {grantBusy ? "Se salvează…" : "Acordă premium manual"}
            </button>
          </div>

          {grantLogs.length > 0 ? (
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Log acordare manuală ({grantLogs.length})
                </p>
                <button
                  type="button"
                  onClick={() => setGrantLogs([])}
                  className="text-xs font-medium text-slate-500 hover:text-slate-800"
                >
                  Șterge log
                </button>
              </div>
              <div className="max-h-80 space-y-2 overflow-y-auto">
                {grantLogs.map((log) => (
                  <details key={log.id} className="rounded-lg border border-slate-200 bg-white p-2.5 text-xs">
                    <summary className="cursor-pointer list-none font-medium text-slate-800">
                      <span className="inline-flex flex-wrap items-center gap-2">
                        <span className="text-slate-500">{log.at}</span>
                        <span
                          className={`rounded-full px-2 py-0.5 font-semibold ${
                            log.status === "success"
                              ? "bg-emerald-100 text-emerald-800"
                              : log.status === "warning"
                                ? "bg-amber-100 text-amber-900"
                                : log.status === "error"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {log.status}
                          {log.httpStatus ? ` · ${log.httpStatus}` : ""}
                        </span>
                        <span>{log.message}</span>
                      </span>
                    </summary>
                    <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap break-all rounded bg-slate-900 p-2 font-mono text-[10px] leading-relaxed text-slate-100">
                      {JSON.stringify(
                        {
                          source: log.source,
                          request: log.request,
                          debug: log.debug,
                        },
                        null,
                        2,
                      )}
                    </pre>
                  </details>
                ))}
              </div>
            </div>
          ) : null}
        </div>
        </details>

        {/* Filters */}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="relative">
            <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Caută după nume, email, ID..."
              className="w-64 rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-4 text-sm text-slate-800 shadow-sm outline-none placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { key: "all", label: "Toți", count: stats.total },
              { key: "active", label: "Activi", count: stats.active },
              { key: "manual", label: "Adăugați manual", count: stats.manual },
              { key: "canceled", label: "Anulați", count: stats.canceled },
              { key: "issues", label: "Probleme", count: subscribers.filter((s) => s.subscriptionStatus === "past_due" || s.subscriptionStatus === "unpaid").length },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setStatusFilter(f.key)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  statusFilter === f.key
                    ? f.key === "manual"
                      ? "bg-fuchsia-600 text-white"
                      : "bg-indigo-600 text-white"
                    : f.key === "manual"
                      ? "border border-fuchsia-200 bg-fuchsia-50 text-fuchsia-900 hover:bg-fuchsia-100"
                      : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                {f.label}
                <span
                  className={`rounded-full px-1.5 py-0.5 text-xs font-semibold ${
                    statusFilter === f.key
                      ? "bg-white/20 text-inherit"
                      : f.key === "manual"
                        ? "bg-fuchsia-100 text-fuchsia-800"
                        : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {f.count}
                </span>
              </button>
            ))}
          </div>
          <span className="ml-auto text-sm text-slate-500">
            {filtered.length} {filtered.length === 1 ? "utilizator" : "utilizatori"}
          </span>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-800">
            {error}
            <button onClick={load} className="ml-3 rounded bg-red-700 px-3 py-1 text-xs text-white hover:bg-red-600">
              Reîncearcă
            </button>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-200" />
            ))}
          </div>
        )}

        {/* Table */}
        {!loading && !error && (
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            {filtered.length === 0 ? (
              <p className="py-12 text-center text-slate-500">
                {search || statusFilter !== "all" ? "Niciun rezultat pentru filtrele selectate." : "Nu există abonați în baza de date."}
              </p>
            ) : (
              <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-slate-50">
                  <tr>
                    <th className={thCls} onClick={() => toggleSort("premium")}>
                      Premium <SortIcon field="premium" />
                    </th>
                    <th className={thCls} onClick={() => toggleSort("firstName")}>
                      Nume <SortIcon field="firstName" />
                    </th>
                    <th className={thCls} onClick={() => toggleSort("email")}>
                      Email <SortIcon field="email" />
                    </th>
                    <th className={thCls} onClick={() => toggleSort("isManual")}>
                      Sursă <SortIcon field="isManual" />
                    </th>
                    <th className={thCls} onClick={() => toggleSort("subscriptionStatus")}>
                      Status <SortIcon field="subscriptionStatus" />
                    </th>
                    <th className={thCls} onClick={() => toggleSort("currentPeriodEnd")}>
                      Valabilitate <SortIcon field="currentPeriodEnd" />
                    </th>
                    <th className={thCls}>Anulare</th>
                    <th className={thCls} onClick={() => toggleSort("billingType")}>
                      Facturare <SortIcon field="billingType" />
                    </th>
                    <th className={thCls} onClick={() => toggleSort("billingCountry")}>
                      Țară <SortIcon field="billingCountry" />
                    </th>
                    <th className={thCls} onClick={() => toggleSort("updatedAt")}>
                      Actualizat <SortIcon field="updatedAt" />
                    </th>
                    <th className={thCls}>Stripe</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 whitespace-nowrap">
                      Acțiuni
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((s) => (
                    <tr key={s.uid} className="transition hover:bg-slate-50">
                      <td className={tdCls}>
                        <PremiumDot active={s.premium} />
                      </td>
                      <td className={tdCls}>
                        <div className="font-medium text-slate-900">
                          {[s.firstName, s.lastName].filter(Boolean).join(" ") || "—"}
                        </div>
                        {s.billingName && s.billingName !== [s.firstName, s.lastName].filter(Boolean).join(" ") && (
                          <div className="text-xs text-slate-400">{s.billingName}</div>
                        )}
                      </td>
                      <td className={tdCls}>
                        <a
                          href={`mailto:${s.email}`}
                          className="text-indigo-600 hover:underline"
                        >
                          {s.email || "—"}
                        </a>
                      </td>
                      <td className={tdCls}>
                        {s.isManual ? (
                          <span className="inline-flex rounded-full bg-fuchsia-100 px-2 py-0.5 text-xs font-semibold text-fuchsia-900">
                            Manual
                          </span>
                        ) : s.subscriptionProvider === "stripe" || s.stripeSubscriptionId ? (
                          <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-800">
                            Stripe
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </td>
                      <td className={tdCls}>
                        <Badge status={s.subscriptionStatus} />
                      </td>
                      <td className={tdCls}>
                        {s.isManual ? (
                          <span title="Dată expirare acces manual">
                            {s.manualPremiumExpiresAt ? formatDate(s.manualPremiumExpiresAt) : "Nelimitat"}
                          </span>
                        ) : (
                          formatDate(s.currentPeriodEnd)
                        )}
                      </td>
                      <td className={tdCls}>
                        {s.cancelAtPeriodEnd ? (
                          <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                            Da
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </td>
                      <td className={tdCls}>
                        {s.billingType ? (
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            s.billingType === "company" ? "bg-violet-100 text-violet-800" : "bg-sky-100 text-sky-800"
                          }`}>
                            {s.billingType === "company" ? "Firmă" : "Persoană fizică"}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </td>
                      <td className={tdCls}>{s.billingCountry || "—"}</td>
                      <td className={tdCls}>{formatDate(s.updatedAt)}</td>
                      <td className={tdCls}>
                        {s.stripeSubscriptionId ? (
                          <a
                            href={`https://dashboard.stripe.com/subscriptions/${s.stripeSubscriptionId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:shadow"
                            title={s.stripeSubscriptionId}
                          >
                            Stripe
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </td>
                      <td className={`${tdCls} max-w-[9rem]`}>
                        <div className="flex flex-col gap-1.5">
                          <button
                            type="button"
                            onClick={() => openGrantModal(s)}
                            disabled={Boolean(s.premium && s.subscriptionProvider !== "manual" && s.stripeSubscriptionId)}
                            title={
                              s.premium && s.subscriptionProvider !== "manual" && s.stripeSubscriptionId
                                ? "Acces încă activ (Stripe) — folosește mai întâi „Șterge” sau anulează în Stripe"
                                : "Acordă acces premium din baza de date"
                            }
                            className={`inline-flex justify-center rounded-lg border px-2 py-1.5 text-xs font-medium shadow-sm transition ${
                              s.premium && s.subscriptionProvider !== "manual" && s.stripeSubscriptionId
                                ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                                : "border-indigo-200 bg-indigo-50 text-indigo-900 hover:bg-indigo-100"
                            }`}
                          >
                            Acordă premium
                          </button>
                          <button
                            type="button"
                            onClick={() => openRemoveModal(s)}
                            className={`inline-flex justify-center rounded-lg border px-2 py-1.5 text-xs font-medium shadow-sm transition ${
                              s.premium
                                ? "border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100"
                                : "border-slate-200 bg-white text-slate-700 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-800"
                            }`}
                            title={
                              s.premium
                                ? "Elimină din listă — necesită confirmare suplimentară (abonament activ)"
                                : "Elimină din listă"
                            }
                          >
                            Șterge
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      <RemoveSubscriberModal
        subscriber={removeTarget}
        activeRevokeAck={activeRevokeAck}
        onAckChange={setActiveRevokeAck}
        onClose={closeRemoveModal}
        onConfirm={confirmRemove}
        removing={removing}
      />
      <GrantPremiumModal
        subscriber={grantModalTarget}
        months={grantModalMonths}
        onMonthsChange={setGrantModalMonths}
        note={grantModalNote}
        onNoteChange={setGrantModalNote}
        onClose={closeGrantModal}
        onConfirm={confirmGrantFromModal}
        submitting={grantSubmitting}
      />
    </div>
  );
}

export default function AbonatiiPage() {
  return (
    <>
      <Head>
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <LocalPasswordGate redirectTo="/dashboard/login">
        <SubscribersScreen />
      </LocalPasswordGate>
    </>
  );
}
