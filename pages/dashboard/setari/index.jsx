import React, { useCallback, useEffect, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import LocalPasswordGate from "../../../components/Dashboard/LocalPasswordGate";

const DASHBOARD_SECRET = "Cristina1994!";

function SettingsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [settings, setSettings] = useState({
    subscriptionSystemEnabled: true,
    mobileUpdatePromptEnabled: false,
  });
  const [pendingToggle, setPendingToggle] = useState(null);
  const [pendingMobileToggle, setPendingMobileToggle] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/dashboard/settings", {
        headers: { "x-dashboard-token": DASHBOARD_SECRET },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "load_failed");
      setSettings(
        data.settings || {
          subscriptionSystemEnabled: true,
          mobileUpdatePromptEnabled: false,
        }
      );
    } catch (e) {
      setError(e?.message || "Eroare la încărcare");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleToggleClick = (newValue) => {
    setPendingToggle(newValue);
  };

  const confirmToggle = async () => {
    if (pendingToggle === null) return;
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/dashboard/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-dashboard-token": DASHBOARD_SECRET,
        },
        body: JSON.stringify({
          subscriptionSystemEnabled: pendingToggle,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "save_failed");
      setSettings(data.settings);
      setSuccess(
        pendingToggle
          ? "Sistemul de abonament a fost activat. Videourile premium necesită acum abonament."
          : "Sistemul de abonament a fost dezactivat. Toate videourile sunt acum gratuite."
      );
      setPendingToggle(null);
    } catch (e) {
      setError(e?.message || "Eroare la salvare");
    } finally {
      setSaving(false);
    }
  };

  const cancelToggle = () => {
    setPendingToggle(null);
  };

  const handleMobileToggleClick = (newValue) => {
    setPendingMobileToggle(newValue);
  };

  const confirmMobileToggle = async () => {
    if (pendingMobileToggle === null) return;
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/dashboard/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-dashboard-token": DASHBOARD_SECRET,
        },
        body: JSON.stringify({
          mobileUpdatePromptEnabled: pendingMobileToggle,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "save_failed");
      setSettings(data.settings);
      setSuccess(
        pendingMobileToggle
          ? "Modalul de actualizare este activat în aplicația mobilă (Tarot, Mesaje magice, Noroc)."
          : "Modalul de actualizare este dezactivat pe mobil."
      );
      setPendingMobileToggle(null);
    } catch (e) {
      setError(e?.message || "Eroare la salvare");
    } finally {
      setSaving(false);
    }
  };

  const cancelMobileToggle = () => {
    setPendingMobileToggle(null);
  };

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
            <svg
              className="h-4 w-4 transition-transform group-hover:-translate-x-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Dashboard
          </button>
          <div className="flex items-center gap-3">
            <div className="h-8 w-px bg-gray-300" />
            <h1 className="text-xl font-bold text-gray-900">Setări Globale</h1>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-800">
            {error}
            <button
              onClick={load}
              className="ml-3 rounded bg-red-700 px-3 py-1 text-xs text-white hover:bg-red-600"
            >
              Reîncearcă
            </button>
          </div>
        )}

        {/* Success */}
        {success && (
          <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800">
            {success}
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-3">
            <div className="h-32 animate-pulse rounded-xl bg-slate-200" />
            <div className="h-32 animate-pulse rounded-xl bg-slate-200" />
          </div>
        )}

        {/* Settings Card */}
        {!loading && (
          <>
          <div className="max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              Sistem de Abonament Premium
            </h2>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="font-medium text-slate-900">
                    Sistemul de abonament este{" "}
                    <span
                      className={
                        settings.subscriptionSystemEnabled
                          ? "text-emerald-600"
                          : "text-amber-600"
                      }
                    >
                      {settings.subscriptionSystemEnabled
                        ? "ACTIVAT"
                        : "DEZACTIVAT"}
                    </span>
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {settings.subscriptionSystemEnabled
                      ? "Videourile marcate ca premium necesită un abonament activ pentru a fi vizualizate."
                      : "Toate videourile sunt gratuite, indiferent de marcarea premium."}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    handleToggleClick(!settings.subscriptionSystemEnabled)
                  }
                  disabled={
                    saving ||
                    pendingToggle !== null ||
                    pendingMobileToggle !== null
                  }
                  className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 ${
                    settings.subscriptionSystemEnabled
                      ? "bg-emerald-500"
                      : "bg-slate-300"
                  }`}
                  role="switch"
                  aria-checked={settings.subscriptionSystemEnabled}
                >
                  <span
                    className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      settings.subscriptionSystemEnabled
                        ? "translate-x-7"
                        : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Info boxes */}
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div
                  className={`rounded-lg border p-3 ${
                    settings.subscriptionSystemEnabled
                      ? "border-emerald-200 bg-emerald-50"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Când este activat
                  </p>
                  <ul className="mt-2 space-y-1 text-sm text-slate-700">
                    <li>• Utilizatorii trebuie să plătească abonament</li>
                    <li>• Videourile premium sunt blocate fără abonament</li>
                    <li>• Funcționează normal pe web și în aplicația mobilă</li>
                  </ul>
                </div>

                <div
                  className={`rounded-lg border p-3 ${
                    !settings.subscriptionSystemEnabled
                      ? "border-amber-200 bg-amber-50"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Când este dezactivat
                  </p>
                  <ul className="mt-2 space-y-1 text-sm text-slate-700">
                    <li>• Toate videourile sunt gratuite</li>
                    <li>• Nu se verifică statusul de premium</li>
                    <li>• Util pentru promoții sau testare</li>
                  </ul>
                </div>
              </div>
            </div>

            {settings.updatedAt && (
              <p className="mt-4 text-xs text-slate-500">
                Ultima actualizare:{" "}
                {new Date(settings.updatedAt).toLocaleString("ro-RO")}
              </p>
            )}
          </div>

          <div className="mt-8 max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">
              Actualizare aplicație mobilă
            </h2>
            <p className="mb-4 text-sm text-slate-600">
              Controlează dacă utilizatorii văd modalul care îi îndeamnă să
              actualizeze aplicația (ecrane Tarot, Mesaje magice, Noroc).
              Același semnal ca documentul Firestore{" "}
              <code className="rounded bg-slate-100 px-1 text-xs">
                ShouldUpdate/unicde
              </code>{" "}
              — câmpul <code className="rounded bg-slate-100 px-1 text-xs">update</code>.
            </p>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="font-medium text-slate-900">
                    Modalul de actualizare este{" "}
                    <span
                      className={
                        settings.mobileUpdatePromptEnabled === true
                          ? "text-emerald-600"
                          : "text-slate-500"
                      }
                    >
                      {settings.mobileUpdatePromptEnabled === true
                        ? "ACTIVAT"
                        : "DEZACTIVAT"}
                    </span>
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {settings.mobileUpdatePromptEnabled === true
                      ? "Utilizatorii pot vedea promptul (respectă amânarea de pe telefon, ex. după respingere)."
                      : "Nu se mai afișează promptul de actualizare pe acele ecrane."}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    handleMobileToggleClick(
                      !(settings.mobileUpdatePromptEnabled === true)
                    )
                  }
                  disabled={
                    saving ||
                    pendingToggle !== null ||
                    pendingMobileToggle !== null
                  }
                  className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 ${
                    settings.mobileUpdatePromptEnabled === true
                      ? "bg-emerald-500"
                      : "bg-slate-300"
                  }`}
                  role="switch"
                  aria-checked={settings.mobileUpdatePromptEnabled === true}
                >
                  <span
                    className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      settings.mobileUpdatePromptEnabled === true
                        ? "translate-x-7"
                        : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
          </>
        )}

        {/* Confirmation Modal — abonament */}
        {pendingToggle !== null && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
          >
            <button
              type="button"
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-[1px]"
              onClick={cancelToggle}
              aria-label="Închide"
            />
            <div className="relative z-10 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
              <h2 className="text-lg font-semibold text-slate-900">
                Confirmare modificare
              </h2>

              {pendingToggle ? (
                <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                  <p className="font-medium text-emerald-900">
                    Activezi sistemul de abonament
                  </p>
                  <p className="mt-2 text-sm text-emerald-800">
                    Videourile marcate ca premium vor necesita un abonament
                    activ. Utilizatorii fără abonament nu vor putea vizualiza
                    conținutul premium.
                  </p>
                </div>
              ) : (
                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <p className="font-medium text-amber-900">
                    Dezactivezi sistemul de abonament
                  </p>
                  <p className="mt-2 text-sm text-amber-800">
                    Toate videourile vor deveni gratuite. Utilizatorii vor putea
                    vizualiza orice conținut fără restricții, inclusiv pe
                    aplicația mobilă.
                  </p>
                </div>
              )}

              <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={cancelToggle}
                  disabled={saving}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Anulează
                </button>
                <button
                  type="button"
                  onClick={confirmToggle}
                  disabled={saving}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm transition disabled:opacity-50 ${
                    pendingToggle
                      ? "bg-emerald-600 hover:bg-emerald-500"
                      : "bg-amber-600 hover:bg-amber-500"
                  }`}
                >
                  {saving
                    ? "Se salvează…"
                    : pendingToggle
                    ? "Activează"
                    : "Dezactivează"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Modal — actualizare mobil */}
        {pendingMobileToggle !== null && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
          >
            <button
              type="button"
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-[1px]"
              onClick={cancelMobileToggle}
              aria-label="Închide"
            />
            <div className="relative z-10 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
              <h2 className="text-lg font-semibold text-slate-900">
                Confirmare — aplicație mobilă
              </h2>

              {pendingMobileToggle ? (
                <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                  <p className="font-medium text-emerald-900">
                    Activezi modalul de actualizare
                  </p>
                  <p className="mt-2 text-sm text-emerald-800">
                    Pe ecranele Tarot, Mesaje magice și Noroc, utilizatorii pot
                    primi îndemnul să actualizeze aplicația (conform regulilor
                    de pe telefon, inclusiv amânarea după închidere).
                  </p>
                </div>
              ) : (
                <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="font-medium text-slate-900">
                    Dezactivezi modalul de actualizare
                  </p>
                  <p className="mt-2 text-sm text-slate-700">
                    Nu se va mai afișa promptul de actualizare legat de acest
                    semnal din Firestore, până îl reactivezi.
                  </p>
                </div>
              )}

              <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={cancelMobileToggle}
                  disabled={saving}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Anulează
                </button>
                <button
                  type="button"
                  onClick={confirmMobileToggle}
                  disabled={saving}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm transition disabled:opacity-50 ${
                    pendingMobileToggle
                      ? "bg-emerald-600 hover:bg-emerald-500"
                      : "bg-slate-600 hover:bg-slate-500"
                  }`}
                >
                  {saving
                    ? "Se salvează…"
                    : pendingMobileToggle
                    ? "Activează"
                    : "Dezactivează"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SetariPage() {
  return (
    <>
      <Head>
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <LocalPasswordGate redirectTo="/dashboard/login">
        <SettingsScreen />
      </LocalPasswordGate>
    </>
  );
}
