import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

const PORTAL_LOGIN_FALLBACK =
  "https://billing.stripe.com/p/login/eVq28r4Gyb8XgKz3cJbjW00";

const REASON_LABELS = {
  missing_line1: "strada și numărul",
  missing_city: "localitatea",
  missing_country: "țara",
  missing_postal_code: "codul poștal",
  missing_romanian_county: "județul",
  invalid_romanian_postal_code: "un cod poștal românesc valid din 6 cifre",
};

export default function PremiumTaxAddressGate() {
  const { currentUser, userData, setUserData, loading } = useAuth();
  const [openingPortal, setOpeningPortal] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");
  const [missingReasons, setMissingReasons] = useState([]);

  const required =
    !loading &&
    Boolean(currentUser && !currentUser.isAnonymous && userData?.premiumTaxAddressGate?.required === true);

  useEffect(() => {
    if (!required) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [required]);

  if (!required) return null;

  async function authHeaders() {
    const token = await currentUser.getIdToken();
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  }

  async function openPortal() {
    setOpeningPortal(true);
    setError("");
    try {
      const response = await fetch("/api/stripe/premium/create-portal-session", {
        method: "POST",
        headers: await authHeaders(),
        body: JSON.stringify({ flow: "tax_address" }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload?.url) throw new Error("portal_unavailable");
      window.location.assign(payload.url);
    } catch (_) {
      // The no-code LIVE portal remains a safe fallback and authenticates by email OTP.
      window.location.assign(PORTAL_LOGIN_FALLBACK);
    }
  }

  async function verifyAddress() {
    setVerifying(true);
    setError("");
    setMissingReasons([]);
    try {
      const response = await fetch("/api/stripe/premium/verify-tax-address", {
        method: "POST",
        headers: await authHeaders(),
        body: JSON.stringify({}),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload?.complete) {
        setMissingReasons(Array.isArray(payload?.reasons) ? payload.reasons : []);
        setError(
          "Adresa nu este încă completă în Stripe. Revino în portal și completează toate câmpurile."
        );
        return;
      }
      setUserData((previous) => ({
        ...(previous || {}),
        premiumTaxAddressGate: {
          ...(previous?.premiumTaxAddressGate || {}),
          required: false,
          readyForMigration: true,
        },
      }));
    } catch (_) {
      setError("Nu am putut verifica adresa acum. Încearcă din nou.");
    } finally {
      setVerifying(false);
    }
  }

  const missingLabels = missingReasons.map((reason) => REASON_LABELS[reason]).filter(Boolean);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="premium-tax-address-title"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 20000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        background: "rgba(15, 23, 42, 0.82)",
        backdropFilter: "blur(8px)",
      }}
    >
      <div
        style={{
          width: "min(100%, 620px)",
          borderRadius: 24,
          background: "#fff",
          padding: "clamp(24px, 5vw, 44px)",
          boxShadow: "0 30px 90px rgba(0,0,0,.35)",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 46, lineHeight: 1, marginBottom: 18 }} aria-hidden="true">
          🧾
        </div>
        <h1
          id="premium-tax-address-title"
          style={{ margin: 0, color: "#0f172a", fontSize: "clamp(24px, 4vw, 34px)" }}
        >
          Actualizează adresa de facturare
        </h1>
        <p style={{ margin: "16px auto 0", maxWidth: 500, color: "#475569", fontSize: 17 }}>
          Pentru continuarea abonamentului și calcularea corectă a TVA-ului, avem nevoie de
          adresa completă de facturare în Stripe.
        </p>
        <p style={{ margin: "10px auto 0", maxWidth: 500, color: "#64748b", fontSize: 14 }}>
          Completează strada, localitatea, județul, codul poștal și țara. Fereastra nu poate fi
          închisă până când Stripe confirmă datele.
        </p>

        {error ? (
          <div
            role="alert"
            style={{
              marginTop: 18,
              borderRadius: 12,
              padding: 12,
              background: "#fef2f2",
              color: "#b91c1c",
              fontSize: 14,
            }}
          >
            {error}
            {missingLabels.length ? ` Lipsesc: ${missingLabels.join(", ")}.` : ""}
          </div>
        ) : null}

        <div style={{ display: "grid", gap: 12, marginTop: 26 }}>
          <button
            type="button"
            onClick={openPortal}
            disabled={openingPortal || verifying}
            style={{
              border: 0,
              borderRadius: 14,
              padding: "14px 18px",
              background: "#4f46e5",
              color: "#fff",
              fontSize: 16,
              fontWeight: 700,
              cursor: openingPortal ? "wait" : "pointer",
              opacity: openingPortal || verifying ? 0.7 : 1,
            }}
          >
            {openingPortal ? "Se deschide Stripe…" : "Actualizează adresa în Stripe"}
          </button>
          <button
            type="button"
            onClick={verifyAddress}
            disabled={openingPortal || verifying}
            style={{
              border: "1px solid #cbd5e1",
              borderRadius: 14,
              padding: "13px 18px",
              background: "#fff",
              color: "#334155",
              fontSize: 15,
              fontWeight: 700,
              cursor: verifying ? "wait" : "pointer",
              opacity: openingPortal || verifying ? 0.7 : 1,
            }}
          >
            {verifying ? "Verificăm adresa…" : "Am actualizat adresa — verifică"}
          </button>
        </div>
      </div>
    </div>
  );
}

