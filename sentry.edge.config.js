const Sentry = require("@sentry/nextjs");
const { getSentryOptions } = require("./sentry.shared.config");

Sentry.init(
  getSentryOptions(process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN)
);
