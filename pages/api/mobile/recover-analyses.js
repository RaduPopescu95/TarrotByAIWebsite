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
      return res.status(400).json({
        error: "Missing contact (phone or email required)",
        requestId,
      });
    }

    const result = await loadAnalysesByContact({ phone, email, phones, emails });

    return res.status(200).json({
      ...result,
      requestId,
      generatedAt: new Date().toISOString(),
      matchedBy: {
        phones: phones.length,
        emails: emails.length,
      },
    });
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
