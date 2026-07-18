import { readDashboardSession } from "../../../../lib/dashboardSession";

export default function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }
  res.setHeader("Cache-Control", "private, no-store, max-age=0");
  try {
    const session = readDashboardSession(req);
    return res.status(session ? 200 : 401).json({
      authenticated: Boolean(session),
      expiresAt: session?.expiresAt || null,
    });
  } catch (_) {
    return res.status(401).json({ authenticated: false, expiresAt: null });
  }
}
