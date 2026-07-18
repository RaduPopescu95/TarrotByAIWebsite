import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { FiEye, FiEyeOff } from "react-icons/fi";

async function loadDashboardSession() {
  const response = await fetch("/api/dashboard/auth/session", {
    method: "GET",
    credentials: "same-origin",
    cache: "no-store",
  });
  return response.ok;
}

export default function LocalPasswordGate({
  children,
  onGranted,
  redirectTo,
  authenticatedRedirectTo = null,
  title = "Acces Dashboard",
  description = "Introduceți parola pentru a accesa dashboard-ul",
}) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [granted, setGranted] = useState(false);
  const [show, setShow] = useState(false);
  const [checking, setChecking] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    void loadDashboardSession()
      .then((authenticated) => {
        if (!active) return;
        setGranted(authenticated);
      })
      .catch(() => {
        if (active) setGranted(false);
      })
      .finally(() => {
        if (active) setChecking(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (checking || granted || !redirectTo || router?.pathname === redirectTo) return;
    router.replace(redirectTo);
  }, [checking, granted, redirectTo, router]);

  useEffect(() => {
    if (!granted || children) return;
    if (authenticatedRedirectTo) router.replace(authenticatedRedirectTo);
    else if (router.pathname === "/administrare/login") router.replace("/administrare");
    else if (router.pathname === "/dashboard/login") router.replace("/dashboard");
  }, [authenticatedRedirectTo, children, granted, router]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/dashboard/auth/login", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.error || "Autentificarea a eșuat");
      }
      setGranted(true);
      setPassword("");
      if (typeof onGranted === "function") onGranted();
    } catch (submitError) {
      setError(submitError?.message || "Autentificarea a eșuat");
    } finally {
      setSubmitting(false);
    }
  };

  if (checking || (granted && !children)) return null;
  if (granted) return <>{children}</>;
  if (redirectTo) return null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-xl"
      >
        <h2 className="mb-2 text-2xl font-bold text-gray-900">{title}</h2>
        <p className="mb-6 text-sm text-gray-600">{description}</p>
        <label className="mb-2 block text-sm font-medium text-gray-700">Parolă</label>
        <div className="relative">
          <input
            type={show ? "text" : "password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Introduceți parola"
            autoFocus
            disabled={submitting}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 pr-12 text-gray-900 shadow-sm placeholder:text-gray-500 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60"
          />
          <button
            type="button"
            onClick={() => setShow((value) => !value)}
            aria-label={show ? "Ascunde parola" : "Afișează parola"}
            className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer border-0 bg-transparent p-1.5 text-gray-500 transition-colors hover:text-gray-700"
          >
            {show ? <FiEyeOff size={20} /> : <FiEye size={20} />}
          </button>
        </div>
        {error ? (
          <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700">
            {error}
          </div>
        ) : null}
        <button
          type="submit"
          disabled={submitting || !password}
          className="mt-6 w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white shadow-sm transition-all hover:bg-blue-500 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Se verifică…" : "Confirmă"}
        </button>
      </form>
    </div>
  );
}

export async function clearDashboardAccess() {
  try {
    await fetch("/api/dashboard/auth/logout", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
  } catch (_) {
    // Navigation still proceeds; the cookie will expire server-side.
  }
}
