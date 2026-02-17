const fs = require("fs");
const OpenAI = require("openai");
const formidable = require("formidable");
const { toFile } = require("openai/uploads");

export const config = {
  api: {
    bodyParser: false,
  },
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
  return "transcribe";
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
      "Failed to transcribe media to SRT.";

    console.error("[transcribe-ro-srt] Error:", message);
    return res.status(status).json({ error: message });
  } finally {
    if (uploadedFile?.filepath) {
      fs.promises.unlink(uploadedFile.filepath).catch(() => {});
    }
  }
}
