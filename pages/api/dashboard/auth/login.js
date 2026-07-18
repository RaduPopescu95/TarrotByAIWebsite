import {
  createDashboardSession,
  dashboardSessionCookie,
  requireDashboardMutationOrigin,
  verifyDashboardPassword,
} from "../../../../lib/dashboardSession";

export default function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  try {
    requireDashboardMutationOrigin(req);
    if (!verifyDashboardPassword(req.body?.password)) {
      return res.status(401).json({ error: "Parolă incorectă" });
    }
    res.setHeader("Set-Cookie", dashboardSessionCookie(createDashboardSession()));
    res.setHeader("Cache-Control", "private, no-store, max-age=0");
    return res.status(200).json({ authenticated: true });
  } catch (error) {
    return res
      .status(error?.statusCode || 500)
      .json({ error: error?.statusCode === 503 ? "Dashboard indisponibil" : "Login eșuat" });
  }
}
