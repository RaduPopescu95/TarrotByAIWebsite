export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { text, target, source } = req.body || {};
  const trimmedText = typeof text === "string" ? text.trim() : "";
  const targetLang = typeof target === "string" ? target.trim() : "";
  const sourceLang = typeof source === "string" ? source.trim() : "auto";

  if (!trimmedText) {
    return res.status(400).json({ error: "Missing text" });
  }
  if (!targetLang) {
    return res.status(400).json({ error: "Missing target language" });
  }

  const rapidApiKey = process.env.RAPIDAPI_TRANSLATE_KEY;
  const rapidApiHost =
    process.env.RAPIDAPI_TRANSLATE_HOST || "google-translate113.p.rapidapi.com";

  if (!rapidApiKey) {
    return res.status(500).json({ error: "Translation service is not configured" });
  }

  try {
    const response = await fetch(`https://${rapidApiHost}/api/v1/translator/text`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-RapidAPI-Key": rapidApiKey,
        "X-RapidAPI-Host": rapidApiHost,
      },
      body: JSON.stringify({
        from: sourceLang || "auto",
        to: targetLang,
        text: trimmedText,
      }),
    });

    const result = await response.json().catch(() => ({}));
    const translated =
      (typeof result?.trans === "string" && result.trans) ||
      (typeof result?.translation === "string" && result.translation) ||
      "";

    if (!response.ok || !translated) {
      return res.status(502).json({
        error: "Translation failed",
        details: result?.message || result?.error || null,
      });
    }

    return res.status(200).json({
      translation: translated,
      trans: translated,
      target: targetLang,
      source: sourceLang || "auto",
      provider: "rapidapi",
    });
  } catch (error) {
    return res.status(500).json({ error: "Translation request failed" });
  }
}
