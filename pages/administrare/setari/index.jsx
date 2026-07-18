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
    iosPremiumSubscriptionsEnabled: true,
    subscriptionSystemEnabled: true,
    androidBillingPremiumProvider: "revenuecat",
    androidBillingAnalysesProvider: "stripe",
    mobileUpdatePromptEnabled: false,
    mobileForceUpdateEnabled: false,
    mobileMinAppVersionIos: "",
    mobileMinAppVersionAndroid: "",
  });
  const [pendingToggle, setPendingToggle] = useState(null);
  const [pendingMobileToggle, setPendingMobileToggle] = useState(null);
  const [pendingMobileForceToggle, setPendingMobileForceToggle] = useState(null);

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
          iosPremiumSubscriptionsEnabled: true,
          subscriptionSystemEnabled: true,
          androidBillingPremiumProvider: "revenuecat",
          androidBillingAnalysesProvider: "stripe",
          mobileUpdatePromptEnabled: false,
          mobileForceUpdateEnabled: false,
          mobileMinAppVersionIos: "",
          mobileMinAppVersionAndroid: "",
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
          iosPremiumSubscriptionsEnabled: pendingToggle,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "save_failed");
      setSettings(data.settings);
      setSuccess(
        pendingToggle
          ? "Abonamentul premium Stripe a fost activat pentru aplicația iOS. Android rămâne pe Google Play Billing."
          : "Abonamentul premium Stripe a fost dezactivat pe iOS, iar videourile premium sunt libere doar acolo. Android rămâne pe Google Play Billing."
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

  const saveAndroidBillingProvider = async (field, provider) => {
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
        body: JSON.stringify({ [field]: provider }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "save_failed");
      setSettings(data.settings);
      setSuccess(
        provider === "revenuecat"
          ? "Google Play Billing a fost activat pentru fluxul Android selectat."
          : "Fluxul Android selectat a revenit la Stripe."
      );
    } catch (e) {
      setError(e?.message || "Eroare la salvare");
    } finally {
      setSaving(false);
    }
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

  const handleMobileForceToggleClick = (newValue) => {
    setPendingMobileForceToggle(newValue);
  };

  const confirmMobileForceToggle = async () => {
    if (pendingMobileForceToggle === null) return;
    if (pendingMobileForceToggle && !canEnableForceUpdate()) {
      setError(
        "Setează versiunile minime iOS și Android (ex. 4 — număr build) înainte de a activa force update."
      );
      setPendingMobileForceToggle(null);
      return;
    }
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
          mobileForceUpdateEnabled: pendingMobileForceToggle,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "save_failed");
      setSettings(data.settings);
      setSuccess(
        pendingMobileForceToggle
          ? "Force update este activat. Aplicația mobilă este blocată până la actualizare."
          : "Force update este dezactivat. Promptul poate rămâne activ ca mod soft."
      );
      setPendingMobileForceToggle(null);
    } catch (e) {
      setError(e?.message || "Eroare la salvare");
    } finally {
      setSaving(false);
    }
  };

  const cancelMobileForceToggle = () => {
    setPendingMobileForceToggle(null);
  };

  const handleMinVersionChange = (field, value) => {
    setSettings((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const saveMinAppVersions = async () => {
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
          mobileMinAppVersionIos: settings.mobileMinAppVersionIos?.trim() || null,
          mobileMinAppVersionAndroid:
            settings.mobileMinAppVersionAndroid?.trim() || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "save_failed");
      setSettings(data.settings);
      setSuccess("Versiunile minime iOS/Android au fost salvate.");
    } catch (e) {
      setError(e?.message || "Eroare la salvare");
    } finally {
      setSaving(false);
    }
  };

  const canEnableForceUpdate = () => {
    const ios = String(settings.mobileMinAppVersionIos || "").trim();
    const android = String(settings.mobileMinAppVersionAndroid || "").trim();
    return ios.length > 0 && android.length > 0;
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
            onClick={() => router.push("/administrare")}
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
            Administrare
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
              Abonament premium iOS — Stripe
            </h2>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="font-medium text-slate-900">
                    Sistemul de abonament este{" "}
                    <span
                      className={
                        settings.iosPremiumSubscriptionsEnabled
                          ? "text-emerald-600"
                          : "text-amber-600"
                      }
                    >
                      {settings.iosPremiumSubscriptionsEnabled
                        ? "ACTIVAT"
                        : "DEZACTIVAT"}
                    </span>
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {settings.iosPremiumSubscriptionsEnabled
                      ? "Pe iPhone și iPad, videourile premium necesită un abonament Stripe activ. Android rămâne permanent pe Google Play Billing."
                      : "Pe iPhone și iPad, videourile premium sunt deblocate și nu se mai pot porni abonamente Stripe noi. Android rămâne permanent pe Google Play Billing."}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    handleToggleClick(!settings.iosPremiumSubscriptionsEnabled)
                  }
                  disabled={
                    saving ||
                    pendingToggle !== null ||
                    pendingMobileToggle !== null
                  }
                  className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 ${
                    settings.iosPremiumSubscriptionsEnabled
                      ? "bg-emerald-500"
                      : "bg-slate-300"
                  }`}
                  role="switch"
                  aria-checked={settings.iosPremiumSubscriptionsEnabled}
                >
                  <span
                    className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      settings.iosPremiumSubscriptionsEnabled
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
                    settings.iosPremiumSubscriptionsEnabled
                      ? "border-emerald-200 bg-emerald-50"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Când este activat
                  </p>
                  <ul className="mt-2 space-y-1 text-sm text-slate-700">
                    <li>• iOS verifică abonamentul premium Stripe</li>
                    <li>• Videourile premium sunt blocate fără abonament pe iOS</li>
                    <li>• Android și site-ul rămân neschimbate</li>
                  </ul>
                </div>

                <div
                  className={`rounded-lg border p-3 ${
                    !settings.iosPremiumSubscriptionsEnabled
                      ? "border-amber-200 bg-amber-50"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Când este dezactivat
                  </p>
                  <ul className="mt-2 space-y-1 text-sm text-slate-700">
                    <li>• Numai iOS primește acces liber la video-uri premium</li>
                    <li>• Android verifică în continuare RevenueCat</li>
                    <li>• Portalul Stripe și plățile pentru analize/cursuri rămân active</li>
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
            <h2 className="mb-2 text-lg font-semibold text-slate-900">
              Plăți Android
            </h2>
            <p className="mb-4 text-sm text-slate-600">
              Abonamentul premium Android rămâne permanent pe Google Play Billing.
              Configurația pentru analize rămâne separată.
            </p>
            <div className="space-y-3">
              {[
                ["androidBillingAnalysesProvider", "Analize astrale"],
              ].map(([field, label]) => {
                const revenueCatEnabled = settings[field] === "revenuecat";
                return (
                  <div
                    key={field}
                    className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div>
                      <p className="font-medium text-slate-900">{label}</p>
                      <p className="text-sm text-slate-600">
                        {revenueCatEnabled ? "Google Play Billing" : "Stripe (fallback)"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        saveAndroidBillingProvider(
                          field,
                          revenueCatEnabled ? "stripe" : "revenuecat"
                        )
                      }
                      disabled={saving}
                      className={`relative inline-flex h-7 w-14 shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 ${
                        revenueCatEnabled ? "bg-emerald-500" : "bg-slate-300"
                      }`}
                      role="switch"
                      aria-checked={revenueCatEnabled}
                    >
                      <span
                        className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow transition ${
                          revenueCatEnabled ? "translate-x-7" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                );
              })}
              <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                <div>
                  <p className="font-medium text-slate-900">Abonament premium</p>
                  <p className="text-sm text-emerald-700">Google Play Billing / RevenueCat — activ permanent</p>
                </div>
                <span className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white">ACTIV</span>
              </div>
            </div>
          </div>

          <div className="mt-8 max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">
              Actualizare aplicație mobilă
            </h2>
            <p className="mb-4 text-sm text-slate-600">
              Controlează dacă utilizatorii văd modalul care îi îndeamnă să
              actualizeze aplicația și dacă actualizarea devine obligatorie.
              Același semnal ca documentul Firestore{" "}
              <code className="rounded bg-slate-100 px-1 text-xs">
                ShouldUpdate/unicde
              </code>{" "}
              — câmpurile <code className="rounded bg-slate-100 px-1 text-xs">update</code> și <code className="rounded bg-slate-100 px-1 text-xs">forceUpdate</code>.
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
                    pendingMobileToggle !== null ||
                    pendingMobileForceToggle !== null
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

            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="font-medium text-slate-900">
                    Force update este{" "}
                    <span
                      className={
                        settings.mobileForceUpdateEnabled === true
                          ? "text-rose-600"
                          : "text-slate-500"
                      }
                    >
                      {settings.mobileForceUpdateEnabled === true
                        ? "ACTIVAT"
                        : "DEZACTIVAT"}
                    </span>
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {settings.mobileForceUpdateEnabled === true
                      ? "Utilizatorii cu versiunea sub minimul setat pe platforma lor (iOS sau Android) nu pot închide modalul până fac update. Cei deja la versiunea minimă sau mai nouă pe platforma lor nu văd modalul."
                      : "Modalul poate rămâne soft (închidere permisă), în funcție de toggle-ul de prompt."}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    handleMobileForceToggleClick(
                      !(settings.mobileForceUpdateEnabled === true)
                    )
                  }
                  disabled={
                    saving ||
                    pendingToggle !== null ||
                    pendingMobileToggle !== null ||
                    pendingMobileForceToggle !== null
                  }
                  className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 ${
                    settings.mobileForceUpdateEnabled === true
                      ? "bg-rose-500"
                      : "bg-slate-300"
                  }`}
                  role="switch"
                  aria-checked={settings.mobileForceUpdateEnabled === true}
                >
                  <span
                    className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      settings.mobileForceUpdateEnabled === true
                        ? "translate-x-7"
                        : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
              <h3 className="text-sm font-semibold text-slate-900">
                Versiuni minime necesare
              </h3>
              <p className="mt-1 text-sm text-slate-600">
                Compară versiunea instalată cu minimul de pe fiecare platformă
                (iOS folosește minim iOS, Android folosește minim Android).
                Utilizatorii la versiunea minimă sau mai nouă pe platforma lor{" "}
                <strong>nu</strong> văd modalul, chiar dacă force update rămâne
                activ. Setează numărul din{" "}
                <code className="rounded bg-slate-100 px-1 text-xs">
                  EXPO_PUBLIC_APP_UPDATE_VERSION
                </code>{" "}
                al build-ului publicat (ex. 4).
              </p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="block text-sm text-slate-700">
                  <span className="mb-1 block font-medium">Versiune minimă iOS</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="4"
                    value={settings.mobileMinAppVersionIos || ""}
                    onChange={(event) =>
                      handleMinVersionChange(
                        "mobileMinAppVersionIos",
                        event.target.value
                      )
                    }
                    disabled={saving}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  />
                </label>
                <label className="block text-sm text-slate-700">
                  <span className="mb-1 block font-medium">
                    Versiune minimă Android
                  </span>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="4"
                    value={settings.mobileMinAppVersionAndroid || ""}
                    onChange={(event) =>
                      handleMinVersionChange(
                        "mobileMinAppVersionAndroid",
                        event.target.value
                      )
                    }
                    disabled={saving}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  />
                </label>
              </div>
              <button
                type="button"
                onClick={saveMinAppVersions}
                disabled={saving}
                className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-50"
              >
                Salvează versiuni minime
              </button>
              {settings.mobileForceUpdateEnabled === true ? (
                <p className="mt-3 text-xs text-rose-700">
                  Force update este activ: doar utilizatorii sub versiunea minimă
                  vor fi blocați.
                </p>
              ) : null}
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

        {/* Confirmation Modal — force update mobil */}
        {pendingMobileForceToggle !== null && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
          >
            <button
              type="button"
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-[1px]"
              onClick={cancelMobileForceToggle}
              aria-label="Închide"
            />
            <div className="relative z-10 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
              <h2 className="text-lg font-semibold text-slate-900">
                Confirmare — force update
              </h2>

              {pendingMobileForceToggle ? (
                <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4">
                  <p className="font-medium text-rose-900">
                    Activezi actualizare obligatorie
                  </p>
                  <p className="mt-2 text-sm text-rose-800">
                    Utilizatorii nu vor putea închide modalul de actualizare și
                    nu vor putea continua în aplicație până nu fac update.
                  </p>
                </div>
              ) : (
                <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="font-medium text-slate-900">
                    Dezactivezi actualizare obligatorie
                  </p>
                  <p className="mt-2 text-sm text-slate-700">
                    Utilizatorii revin la modul soft (promptul se poate închide
                    dacă rămâne activ).
                  </p>
                </div>
              )}

              <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={cancelMobileForceToggle}
                  disabled={saving}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Anulează
                </button>
                <button
                  type="button"
                  onClick={confirmMobileForceToggle}
                  disabled={saving}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm transition disabled:opacity-50 ${
                    pendingMobileForceToggle
                      ? "bg-rose-600 hover:bg-rose-500"
                      : "bg-slate-600 hover:bg-slate-500"
                  }`}
                >
                  {saving
                    ? "Se salvează…"
                    : pendingMobileForceToggle
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
      <LocalPasswordGate redirectTo="/administrare/login">
        <SettingsScreen />
      </LocalPasswordGate>
    </>
  );
}
