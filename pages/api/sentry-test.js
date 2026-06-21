/**
 * Optional smoke route for Sentry server reporting.
 * Enable only when testing: SENTRY_TEST_ROUTE_ENABLED=true
 */
export default function handler(req, res) {
  if (process.env.SENTRY_TEST_ROUTE_ENABLED !== "true") {
    return res.status(404).json({ error: "not_found" });
  }

  throw new Error("Sentry web server test error");
}
