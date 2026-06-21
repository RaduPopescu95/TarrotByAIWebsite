/**
 * Shared Sentry options for client and server (errors only).
 */
function getSentryOptions(dsn) {
  return {
    dsn,
    enabled:
      process.env.NODE_ENV === "production" && Boolean(dsn && String(dsn).trim()),
    tracesSampleRate: 0,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
  };
}

module.exports = { getSentryOptions };
