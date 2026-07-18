import { clearDashboardSessionCookie } from "../../../../lib/dashboardSession";
import { requireDashboardSession } from "../../../../lib/dashboardSession";

export default function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  try {
    requireDashboardSession(req, { mutation: true });
  } catch (error) {
    if (error?.statusCode === 403) {
      return res.status(403).json({ error: "Forbidden" });
    }
  }
  res.setHeader("Set-Cookie", clearDashboardSessionCookie());
  res.setHeader("Cache-Control", "private, no-store, max-age=0");
  return res.status(200).json({ authenticated: false });
}
