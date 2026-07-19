import {
  createDashboardSession,
  dashboardSessionCookie,
  requireDashboardMutationOrigin,
  verifyDashboardPassword,
} from "../../../../lib/dashboardSession";

export default function handler(req, res) {
  const requestContext = {
    method: req.method,
    host: req.headers?.["x-forwarded-host"] || req.headers?.host || "unknown",
  };
  if (req.method !== "POST") {
    console.warn("[dashboard-auth] Method not allowed", requestContext);
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  try {
    requireDashboardMutationOrigin(req);
    if (!verifyDashboardPassword(req.body?.password)) {
      console.warn("[dashboard-auth] Invalid password", requestContext);
      return res.status(401).json({ error: "Parolă incorectă" });
    }
    res.setHeader("Set-Cookie", dashboardSessionCookie(createDashboardSession()));
    res.setHeader("Cache-Control", "private, no-store, max-age=0");
    console.info("[dashboard-auth] Login successful", requestContext);
    return res.status(200).json({ authenticated: true });
  } catch (error) {
    console.error("[dashboard-auth] Login failed", {
      ...requestContext,
      message: error?.message || "Unknown error",
      statusCode: error?.statusCode || 500,
    });
    return res
      .status(error?.statusCode || 500)
      .json({ error: error?.statusCode === 503 ? "Dashboard indisponibil" : "Login eșuat" });
  }
}
