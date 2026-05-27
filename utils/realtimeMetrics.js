function safeJsonSize(value) {
  try {
    return JSON.stringify(value)?.length || 0;
  } catch (_) {
    return 0;
  }
}

export function logRtdbMetric(event, details = {}) {
  try {
    if (process.env.NODE_ENV === "production") {
      console.info("[RTDB_METRIC]", event, details);
      return;
    }
    console.log("[RTDB_METRIC]", event, details);
  } catch (_) {
    // no-op
  }
}

export function logRtdbRead(path, payload) {
  logRtdbMetric("read", {
    path,
    approxBytes: safeJsonSize(payload),
  });
}

export function logRtdbWrite(path, payload) {
  logRtdbMetric("write", {
    path,
    approxBytes: safeJsonSize(payload),
  });
}

export function logDataSourceDecision(feature, mode, details = {}) {
  logRtdbMetric("source_decision", {
    feature,
    mode,
    ...details,
  });
}
