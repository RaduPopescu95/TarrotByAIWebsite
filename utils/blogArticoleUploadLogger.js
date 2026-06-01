const PREFIX = "[BlogArticoleUpload]";

export function summarizeArticleInfo(info) {
  const ro = info?.ro || {};
  return {
    nume: ro.nume || "",
    descriereLen: (ro.descriere || "").length,
    contentLen: (ro.content || "").length,
    localeCount: info ? Object.keys(info).length : 0,
  };
}

export function logBlogArticoleUpload(step, details = {}) {
  console.info(PREFIX, step, details);
}

export function logBlogArticoleUploadWarn(step, details = {}) {
  console.warn(PREFIX, step, details);
}

export function logBlogArticoleUploadError(step, error, details = {}) {
  console.error(PREFIX, step, {
    ...details,
    message: error?.message || String(error),
    code: error?.code,
    name: error?.name,
  });
}
