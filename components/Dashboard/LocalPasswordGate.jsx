import React, { useEffect, useMemo, useState } from "react";
import { FiEye, FiEyeOff } from "react-icons/fi";

const STORAGE_KEY = "dashboard_access_token";
const DEFAULT_PASSWORD = "Cristina1994!";

function getNowMs() {
  return new Date().getTime();
}

function readToken() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch (_) {
    return null;
  }
}

function writeToken(minutesValid) {
  const expiresAt = getNowMs() + minutesValid * 60 * 1000;
  const value = { granted: true, expiresAt };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  return value;
}

function clearToken() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (_) {}
}

export default function LocalPasswordGate({ children, ttlMinutes = 20160, onGranted }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [granted, setGranted] = useState(false);
  const [show, setShow] = useState(false);

  // Check token on mount and on interval
  useEffect(() => {
    const check = () => {
      const token = readToken();
      if (token && token.granted && typeof token.expiresAt === "number") {
        if (token.expiresAt > getNowMs()) {
          setGranted(true);
          setError("");
          return;
        }
      }
      clearToken();
      setGranted(false);
    };
    check();
    const id = setInterval(check, 30 * 1000);
    return () => clearInterval(id);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    if (password === DEFAULT_PASSWORD) {
      writeToken(ttlMinutes);
      setGranted(true);
      setPassword("");
      try {
        if (typeof onGranted === "function") {
          onGranted();
        }
      } catch (_) {}
    } else {
      setError("Parolă incorectă");
    }
  };

  const handleLogout = () => {
    clearToken();
    setGranted(false);
  };

  if (granted) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-xl"
      >
        <h2 className="mb-2 text-2xl font-bold text-gray-900">Acces Dashboard</h2>
        <p className="mb-6 text-sm text-gray-600">Introduceți parola pentru a accesa dashboard-ul</p>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Parolă
        </label>
        <div className="relative">
          <input
            type={show ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Introduceți parola"
            autoFocus
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 pr-12 text-gray-900 shadow-sm placeholder:text-gray-500 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? "Ascunde parola" : "Afișează parola"}
            className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer border-0 bg-transparent p-1.5 text-gray-500 transition-colors hover:text-gray-700"
          >
            {show ? <FiEyeOff size={20} /> : <FiEye size={20} />}
          </button>
        </div>
        {error && (
          <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700">{error}</div>
        )}
        <button
          type="submit"
          className="mt-6 w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white shadow-sm transition-all hover:bg-blue-500 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Confirmă
        </button>
      </form>
    </div>
  );
}

// Helper for explicit manual logout from other places
export function clearDashboardAccess() {
  clearToken();
}


