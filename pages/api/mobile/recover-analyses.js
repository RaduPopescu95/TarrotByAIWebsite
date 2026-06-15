import { getOptionalAuth } from "../../../lib/requireAuth";
import { loadAnalysesByContact } from "../../../lib/loadAnalysesByContact";

function buildRequestId() {
  return `mobile_recover_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

const uniqueTrimmed = (values) => {
  const seen = new Set();
  const out = [];
  (values || []).forEach((value) => {
    const t = String(value || "").trim();
    if (t && !seen.has(t)) {
      seen.add(t);
      out.push(t);
    }
  });
  return out;
};

const readContact = (body, decoded) => {
  const fromBody = body && typeof body === "object" ? body : {};

  // Acceptăm atât forma veche (phone/email) cât și listele (phones/emails),
  // plus contactul din token ca fallback. Union + dedup.
  const phones = uniqueTrimmed([
    ...(Array.isArray(fromBody.phones) ? fromBody.phones : []),
    fromBody.phone,
    decoded?.phone_number,
  ]);
  const emails = uniqueTrimmed([
    ...(Array.isArray(fromBody.emails) ? fromBody.emails : []),
    fromBody.email,
    decoded?.email,
  ]);

  return {
    phones,
    emails,
    phone: phones[0] || "",
    email: emails[0] || "",
  };
};

const maskPhoneForLog = (phone) => {
  const value = String(phone || "").trim();
  if (!value) return "(gol)";
  if (value.length <= 4) return "****";
  return `***${value.slice(-4)}`;
};

const maskEmailForLog = (email) => {
  const value = String(email || "").trim();
  if (!value) return "(gol)";
  const at = value.indexOf("@");
  if (at <= 0) return "***";
  return `${value[0]}***${value.slice(at)}`;
};

export default async function handler(req, res) {
  const requestId = buildRequestId();
  res.setHeader("X-Request-Id", requestId);

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed", requestId });
  }

  // Recovery returns user-specific paid content; never cache it.
  res.setHeader("Cache-Control", "private, no-store, max-age=0");

  try {
    // Auth is optional: recovery must keep working for guests who paid without
    // an account. We still accept a token to derive contact when the body omits it.
    const decoded = await getOptionalAuth(req);
    const { phone, email, phones, emails } = readContact(req.body, decoded);

    if (!phones.length && !emails.length) {
      console.warn("[CONTACT_RECOVER] api.missing_contact", { requestId });
      return res.status(400).json({
        error: "Missing contact (phone or email required)",
        requestId,
      });
    }

    console.log("[CONTACT_RECOVER] api.request.start", {
      requestId,
      phones: phones.map(maskPhoneForLog),
      emails: emails.map(maskEmailForLog),
      hasAuth: Boolean(decoded?.uid),
    });

    const t0 = Date.now();
    const result = await loadAnalysesByContact({ phone, email, phones, emails });

    const responsePayload = {
      ...result,
      requestId,
      generatedAt: new Date().toISOString(),
      matchedBy: {
        phones: phones.length,
        emails: emails.length,
      },
    };
    const jsonStr = JSON.stringify(responsePayload);

    console.log("[CONTACT_RECOVER] api.request.done", {
      requestId,
      tookMs: Date.now() - t0,
      personal: result.personal?.length || 0,
      astrogramaOthers: result.astrogramaOthers?.length || 0,
      sinastrieOnePerson: result.sinastrieOnePerson?.length || 0,
      sinastrieOthers: result.sinastrieOthers?.length || 0,
      entitlements: result.entitlements?.length || 0,
      payloadSizeKB: Math.round(jsonStr.length / 1024),
    });

    res.setHeader("Content-Type", "application/json");
    return res.status(200).send(jsonStr);
  } catch (error) {
    console.error("[mobile/recover-analyses] POST error", {
      requestId,
      message: error?.message || String(error),
    });
    return res.status(500).json({
      error: "Failed to recover analyses",
      requestId,
    });
  }
}
