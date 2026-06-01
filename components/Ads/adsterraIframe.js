function normalizeScriptHost(host) {
  const trimmed = (host || "").trim().replace(/\/$/, "");
  if (!trimmed) return "";
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  if (trimmed.startsWith("//")) {
    return `https:${trimmed}`;
  }
  return `https://${trimmed}`;
}

export function buildAdsterraNativeIframeSrcDoc(scriptHost, key) {
  const base = normalizeScriptHost(scriptHost);
  if (!base || !key) return "";

  const invokeUrl = `${base}/${key}/invoke.js`;
  const containerId = `container-${key}`;

  return `<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    html, body { margin: 0; padding: 0; background: transparent; overflow: hidden; }
    #${containerId} { max-width: 100%; margin: 0 auto; }
  </style>
</head>
<body>
  <div id="${containerId}"></div>
  <script async="async" data-cfasync="false" src="${invokeUrl}"><\/script>
</body>
</html>`;
}

/** Standard Adsterra banner (atOptions + highperformanceformat.com). */
export function buildAdsterraStandardBannerSrcDoc(scriptHost, key, width, height) {
  const base = normalizeScriptHost(scriptHost);
  if (!base || !key) return "";

  const invokeUrl = `${base}/${key}/invoke.js`;
  const w = Number(width) || 300;
  const h = Number(height) || 250;

  return `<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    html, body { margin: 0; padding: 0; background: transparent; overflow: hidden; text-align: center; }
  </style>
</head>
<body>
  <script>
    atOptions = {
      'key' : '${key}',
      'format' : 'iframe',
      'height' : ${h},
      'width' : ${w},
      'params' : {}
    };
  <\/script>
  <script src="${invokeUrl}"><\/script>
</body>
</html>`;
}

export function buildAdsterraIframeSrcDoc({ format, host, key, width, height }) {
  if (!key) return "";
  if (format === "iframe") {
    return buildAdsterraStandardBannerSrcDoc(host, key, width, height);
  }
  return buildAdsterraNativeIframeSrcDoc(host, key);
}
