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

export default function LocalPasswordGate({ children, ttlMinutes = 20160 }) {
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
    } else {
      setError("Parolă incorectă");
    }
  };

  const handleLogout = () => {
    clearToken();
    setGranted(false);
  };

  if (granted) {
    return (
      <>
        {children}
      </>
    );
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#303030" }}>
      <form onSubmit={handleSubmit} style={{ background: "#1f1f1f", padding: 24, borderRadius: 12, width: "100%", maxWidth: 360 }}>
        <h2 style={{ color: "#fff", marginBottom: 16 }}>Acces Dashboard</h2>
        <label style={{ color: "#bbb", fontSize: 14, display: "block", marginBottom: 8 }}>Introduceți parola</label>
        <div style={{ position: "relative" }}>
          <input
            type={show ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Parola"
            autoFocus
            style={{ width: "100%", padding: "10px 44px 10px 12px", borderRadius: 8, border: "1px solid #444", background: "#2a2a2a", color: "#fff" }}
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? "Ascunde parola" : "Afișează parola"}
            style={{
              position: "absolute",
              right: 8,
              top: "50%",
              transform: "translateY(-50%)",
              background: "transparent",
              color: "#bbb",
              border: 0,
              cursor: "pointer",
              padding: 4,
            }}
          >
            {show ? <FiEyeOff size={18} /> : <FiEye size={18} />}
          </button>
        </div>
        {error && <div style={{ color: "#ff6b6b", marginTop: 8, fontSize: 13 }}>{error}</div>}
        <button type="submit" style={{ marginTop: 16, width: "100%", background: "#1976d2", color: "#fff", border: 0, borderRadius: 8, padding: "10px 12px", cursor: "pointer" }}>Confirmă</button>
       </form>
    </div>
  );
}

// Helper for explicit manual logout from other places
export function clearDashboardAccess() {
  clearToken();
}


