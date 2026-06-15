import { getOptionalAuth } from "../../../lib/requireAuth";
import { loadAnalysesByContact } from "../../../lib/loadAnalysesByContact";

function buildRequestId() {
  return `mobile_recover_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

const readContact = (body, decoded) => {
  const fromBody = body && typeof body === "object" ? body : {};
  const phone =
    String(fromBody.phone || "").trim() ||
    String(decoded?.phone_number || "").trim();
  const email =
    String(fromBody.email || "").trim() || String(decoded?.email || "").trim();
  return { phone, email };
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
    const { phone, email } = readContact(req.body, decoded);

    if (!phone && !email) {
      return res.status(400).json({
        error: "Missing contact (phone or email required)",
        requestId,
      });
    }

    const result = await loadAnalysesByContact({ phone, email });

    return res.status(200).json({
      ...result,
      requestId,
      generatedAt: new Date().toISOString(),
      matchedBy: {
        phone: Boolean(phone),
        email: Boolean(email),
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
