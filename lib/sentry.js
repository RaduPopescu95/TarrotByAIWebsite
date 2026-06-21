const Sentry = require("@sentry/nextjs");

/**
 * Report API route errors with optional request context.
 */
function captureApiError(error, context = {}) {
  if (!error) return;
  Sentry.captureException(error, {
    extra: context,
  });
}

module.exports = { captureApiError, Sentry };
