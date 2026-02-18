const fs = require("fs");
const OpenAI = require("openai");
const formidable = require("formidable");
const archiver = require("archiver");
const { toFile } = require("openai/uploads");

export const config = {
  api: {
    bodyParser: false,
  },
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SRT_TIMECODE_REGEX =
  /^\d{2}:\d{2}:\d{2}[,.]\d{3}\s+-->\s+\d{2}:\d{2}:\d{2}[,.]\d{3}/;
const MAX_TRANSLATE_BATCH_ITEMS = 80;
const MAX_TRANSLATE_BATCH_CHARS = 12000;
const MAX_INPUT_SRT_CHARS = 180000;
const MULTI_TRANSLATE_TARGETS = {
  ro: "Romanian",
  es: "Spanish",
  fr: "French",
  de: "German",
  it: "Italian",
  pt: "Portuguese",
  pl: "Polish",
  cs: "Czech",
  el: "Greek",
};
const DEFAULT_MULTI_TARGET_CODES = Object.keys(MULTI_TRANSLATE_TARGETS);

function parseMultipartForm(req) {
  const form = formidable.default({
    multiples: false,
    allowEmptyFiles: false,
    maxFileSize: 200 * 1024 * 1024, // 200MB
  });

  return new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) {
        reject(err);
        return;
      }
      resolve({ fields, files });
    });
  });
}

function firstFile(value) {
  if (!value) {
    return null;
  }

  if (Array.isArray(value)) {
    return value[0] || null;
  }

  return value;
}

function firstField(value) {
  if (value === null || value === undefined) {
    return null;
  }

  if (Array.isArray(value)) {
    return value[0] || null;
  }

  return value;
}

function normalizeSubtitleLanguage(value) {
  if (typeof value !== "string" || !value.trim()) return "ro";
  const normalized = value.trim().toLowerCase();
  if (normalized.startsWith("en")) return "en";
  if (normalized.startsWith("ro")) return "ro";
  return "ro";
}

function normalizeTranslationMode(value) {
  if (typeof value !== "string") return "transcribe";
  const normalized = value.trim().toLowerCase();
  if (normalized === "translate-to-en") return "translate-to-en";
  if (normalized === "translate-srt-multi") return "translate-srt-multi";
  return "transcribe";
}

function parseTargetLanguages(value) {
  let rawValue = firstField(value);
  if (!rawValue) {
    return DEFAULT_MULTI_TARGET_CODES;
  }

  if (typeof rawValue !== "string") {
    rawValue = String(rawValue);
  }

  let parsedCodes = [];
  try {
    const parsedJson = JSON.parse(rawValue);
    if (Array.isArray(parsedJson)) {
      parsedCodes = parsedJson;
    }
  } catch {
    parsedCodes = rawValue.split(",");
  }

  const normalizedCodes = parsedCodes
    .map((item) => (typeof item === "string" ? item.trim().toLowerCase() : ""))
    .filter(Boolean)
    .filter((code) => code !== "en" && Boolean(MULTI_TRANSLATE_TARGETS[code]));

  const uniqueCodes = [...new Set(normalizedCodes)];
  if (!uniqueCodes.length) {
    return DEFAULT_MULTI_TARGET_CODES;
  }

  return uniqueCodes;
}

function sanitizeFilenameBase(name) {
  const fallback = "subtitrare";
  if (!name || typeof name !== "string") {
    return fallback;
  }

  const withoutExtension = name.replace(/\.[^/.]+$/, "");
  const sanitized = withoutExtension
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return sanitized || fallback;
}

function parseSrtBlocks(srtText) {
  const normalizedText = String(srtText || "")
    .replace(/^\uFEFF/, "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n");

  const rawBlocks = normalizedText
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  const blocks = rawBlocks.map((rawBlock, index) => {
    const lines = rawBlock.split("\n");
    const timecodeLineIndex = lines.findIndex((line) =>
      SRT_TIMECODE_REGEX.test(line.trim())
    );

    if (timecodeLineIndex === -1) {
      return {
        id: index,
        translatable: false,
        originalLines: lines,
      };
    }

    const prefixLines = lines.slice(0, timecodeLineIndex + 1);
    const sourceText = lines.slice(timecodeLineIndex + 1).join("\n");

    return {
      id: index,
      translatable: true,
      prefixLines,
      sourceText,
      originalLines: lines,
    };
  });

  const entries = blocks
    .filter((block) => block.translatable)
    .map((block) => ({ id: block.id, text: block.sourceText }));

  return { blocks, entries };
}

function createTranslationBatches(entries) {
  const nonEmptyEntries = entries.filter(
    (entry) => typeof entry.text === "string" && entry.text.trim().length > 0
  );

  const batches = [];
  let currentBatch = [];
  let currentChars = 0;

  for (const entry of nonEmptyEntries) {
    const estimatedLength = entry.text.length + 20;
    const shouldFlushCurrentBatch =
      currentBatch.length >= MAX_TRANSLATE_BATCH_ITEMS ||
      currentChars + estimatedLength > MAX_TRANSLATE_BATCH_CHARS;

    if (currentBatch.length && shouldFlushCurrentBatch) {
      batches.push(currentBatch);
      currentBatch = [];
      currentChars = 0;
    }

    currentBatch.push(entry);
    currentChars += estimatedLength;
  }

  if (currentBatch.length) {
    batches.push(currentBatch);
  }

  return batches;
}

async function translateBatch(entries, targetLanguageCode) {
  const languageLabel = MULTI_TRANSLATE_TARGETS[targetLanguageCode];
  const translationModel =
    process.env.OPENAI_SUBTITLE_TRANSLATE_MODEL || "gpt-4o-mini";

  const completion = await openai.chat.completions.create({
    model: translationModel,
    temperature: 0,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You translate English subtitle text into ${languageLabel}. Return strict JSON only with this shape: {"translations":[{"id":number,"text":string}]}. Keep each id unchanged. Preserve subtitle formatting tags (example: <i>, <b>) and line breaks where appropriate.`,
      },
      {
        role: "user",
        content: JSON.stringify({
          task: "translate_subtitle_entries",
          source_language: "English",
          target_language: languageLabel,
          entries,
        }),
      },
    ],
  });

  const rawMessage = completion?.choices?.[0]?.message?.content;
  if (!rawMessage || typeof rawMessage !== "string") {
    throw new Error(`Model returned empty translation output for ${languageLabel}.`);
  }

  let parsedResponse = null;
  try {
    parsedResponse = JSON.parse(rawMessage);
  } catch {
    throw new Error(
      `Model returned invalid JSON while translating to ${languageLabel}.`
    );
  }

  const translatedItems = Array.isArray(parsedResponse?.translations)
    ? parsedResponse.translations
    : [];

  const translatedMap = new Map();
  for (const item of translatedItems) {
    const id = Number(item?.id);
    const text = item?.text;
    if (Number.isFinite(id) && typeof text === "string") {
      translatedMap.set(id, text);
    }
  }

  return entries.map((entry) => ({
    id: entry.id,
    text: translatedMap.has(entry.id) ? translatedMap.get(entry.id) : entry.text,
  }));
}

async function translateEntriesToLanguage(entries, targetLanguageCode) {
  const translatedById = new Map(
    entries.map((entry) => [entry.id, typeof entry.text === "string" ? entry.text : ""])
  );

  const batches = createTranslationBatches(entries);
  for (const batch of batches) {
    const translatedBatch = await translateBatch(batch, targetLanguageCode);
    translatedBatch.forEach((item) => translatedById.set(item.id, item.text));
  }

  return translatedById;
}

function buildSrtFromBlocks(blocks, translatedById) {
  const rebuiltBlocks = blocks.map((block) => {
    if (!block.translatable) {
      return block.originalLines.join("\n");
    }

    const translatedText = translatedById.get(block.id);
    const effectiveText =
      typeof translatedText === "string" ? translatedText : block.sourceText;
    const translatedLines = effectiveText ? effectiveText.split("\n") : [];

    return [...block.prefixLines, ...translatedLines].join("\n");
  });

  return `${rebuiltBlocks.join("\n\n").trim()}\n`;
}

async function sendZip(res, zipName, files) {
  res.setHeader("Content-Type", "application/zip");
  res.setHeader("Content-Disposition", `attachment; filename="${zipName}"`);

  const archive = archiver("zip", { zlib: { level: 9 } });

  await new Promise((resolve, reject) => {
    archive.on("error", reject);
    res.on("finish", resolve);
    archive.pipe(res);

    files.forEach((file) => {
      archive.append(file.content, { name: file.name });
    });

    const finalizeResult = archive.finalize();
    if (finalizeResult && typeof finalizeResult.catch === "function") {
      finalizeResult.catch(reject);
    }
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({
      error: "OPENAI_API_KEY is not configured.",
    });
  }

  let uploadedFile = null;

  try {
    const { files, fields } = await parseMultipartForm(req);
    uploadedFile =
      firstFile(files?.video) || firstFile(files?.file) || firstFile(Object.values(files || {})[0]);
    const subtitleLanguage = normalizeSubtitleLanguage(firstField(fields?.language));
    const translationMode = normalizeTranslationMode(firstField(fields?.mode));

    if (!uploadedFile) {
      return res.status(400).json({
        error: "No video/audio file received. Use field name 'video' or 'file'.",
      });
    }

    if (!uploadedFile.filepath) {
      return res.status(400).json({ error: "Invalid uploaded file." });
    }

    if (translationMode === "translate-srt-multi") {
      const sourceSrtText = await fs.promises.readFile(uploadedFile.filepath, "utf8");

      if (!sourceSrtText || !sourceSrtText.trim()) {
        return res.status(400).json({ error: "Fisierul SRT este gol." });
      }

      if (sourceSrtText.length > MAX_INPUT_SRT_CHARS) {
        return res.status(413).json({
          error:
            "Fisierul SRT este prea mare pentru traducere directa. Incearca un SRT mai mic.",
        });
      }

      const { blocks, entries } = parseSrtBlocks(sourceSrtText);
      if (!entries.length) {
        return res.status(400).json({
          error: "Nu am gasit linii valide de subtitrare in fisierul SRT.",
        });
      }

      const targetLanguageCodes = parseTargetLanguages(fields?.targetLanguages);
      const baseName = sanitizeFilenameBase(uploadedFile.originalFilename);
      const translatedFiles = [];

      for (const targetLanguageCode of targetLanguageCodes) {
        console.info(`[transcribe-ro-srt] translating SRT to ${targetLanguageCode}`);
        const translatedById = await translateEntriesToLanguage(
          entries,
          targetLanguageCode
        );
        const translatedSrt = buildSrtFromBlocks(blocks, translatedById);
        translatedFiles.push({
          name: `${baseName}.${targetLanguageCode}.srt`,
          content: translatedSrt,
        });
      }

      const zipName = `${baseName}.multilang.srt.zip`;
      await sendZip(res, zipName, translatedFiles);
      return;
    }

    const fileForOpenAI = await toFile(
      fs.createReadStream(uploadedFile.filepath),
      uploadedFile.originalFilename || "upload-video.mp4",
      {
        type: uploadedFile.mimetype || undefined,
      }
    );

    const shouldTranslateToEnglish =
      subtitleLanguage === "en" && translationMode === "translate-to-en";

    let srtText = "";
    if (shouldTranslateToEnglish) {
      console.info("[transcribe-ro-srt] mode=translation/en");
      srtText = await openai.audio.translations.create({
        file: fileForOpenAI,
        model: "whisper-1",
        response_format: "srt",
        temperature: 0,
      });
    } else {
      console.info("[transcribe-ro-srt] mode=transcription/" + subtitleLanguage);
      srtText = await openai.audio.transcriptions.create({
        file: fileForOpenAI,
        model: "whisper-1",
        language: subtitleLanguage,
        response_format: "srt",
        temperature: 0,
      });
    }

    const outputName = `${sanitizeFilenameBase(uploadedFile.originalFilename)}.${subtitleLanguage}.srt`;

    res.setHeader("Content-Type", "application/x-subrip; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${outputName}"`);
    return res.status(200).send(srtText);
  } catch (error) {
    const status = error?.status || 500;
    const message =
      error?.error?.message ||
      error?.message ||
      "Failed to process subtitles.";

    console.error("[transcribe-ro-srt] Error:", message);
    return res.status(status).json({ error: message });
  } finally {
    if (uploadedFile?.filepath) {
      fs.promises.unlink(uploadedFile.filepath).catch(() => {});
    }
  }
}
