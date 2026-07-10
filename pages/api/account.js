import { purgeUserAccount } from "../../lib/accountDeletion";
import { requireAuth } from "../../lib/requireAuth";

function buildRequestId() {
  return `account_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export default async function handler(req, res) {
  const requestId = buildRequestId();
  res.setHeader("X-Request-Id", requestId);
  res.setHeader("Cache-Control", "private, no-store, max-age=0");

  if (req.method !== "DELETE") {
    res.setHeader("Allow", "DELETE");
    return res.status(405).json({ error: "Method not allowed", requestId });
  }

  try {
    const decoded = await requireAuth(req);
    const uid = decoded?.uid;
    if (!uid) {
      return res.status(401).json({ error: "Unauthorized", requestId });
    }

    const summary = await purgeUserAccount(uid);

    return res.status(200).json({
      ok: true,
      requestId,
      summary,
    });
  } catch (error) {
    const statusCode = error?.statusCode || 500;
    if (statusCode === 401) {
      return res.status(401).json({
        error: error?.message || "Unauthorized",
        requestId,
      });
    }

    console.error("[account.deletion] api_failed", {
      requestId,
      message: error?.message || "unknown_error",
    });

    return res.status(500).json({
      error: "Failed to delete account",
      requestId,
    });
  }
}
