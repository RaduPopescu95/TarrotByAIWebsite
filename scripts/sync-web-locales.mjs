#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Sync web UI translations in public/locales/<code>/common.json.
 *
 * Usage:
 *   node scripts/sync-web-locales.mjs --dry-run
 *   node scripts/sync-web-locales.mjs --locale=de
 *   node scripts/sync-web-locales.mjs --only-stubs
 *   node scripts/sync-web-locales.mjs --max-keys=50
 *
 * Requires RAPIDAPI_TRANSLATE_KEY in .env (see pages/api/translate.js).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
dotenv.config({ path: path.join(ROOT, ".env") });

import { createRequire } from "module";

const require = createRequire(import.meta.url);
const nextI18nRoot = require("../next-i18next.config.js");
const SITE_LOCALES = Array.isArray(nextI18nRoot.i18n?.locales)
  ? [...nextI18nRoot.i18n.locales]
  : ["ro", "en"];

const LOCALES_DIR = path.join(ROOT, "public/locales");
const SOURCE_LOCALE = "en";
const STUB_LOCALES = new Set([
  "ar", "bs", "he", "hu", "ja", "ko", "mn", "pt", "ru", "sq", "sr", "tr", "zh",
]);

const TRANSLATE_TARGET_OVERRIDES = {
  zh: "zh-TW",
};

const PLACEHOLDER_RE = /\{\{[^}]+\}\}|%\{[^}]+\}|<\/?\d+>|<[^>]+>/g;

const BATCH_SEPARATOR = "\n§§§I18N§§§\n";
const DEFAULT_BATCH_SIZE = 20;

function parseArgs(argv) {
  const args = {
    dryRun: false,
    locale: null,
    onlyStubs: false,
    onlyMissing: false,
    maxKeys: Infinity,
    delayMs: 50,
    batchSize: DEFAULT_BATCH_SIZE,
  };
  for (const arg of argv) {
    if (arg === "--dry-run") args.dryRun = true;
    if (arg === "--only-stubs") args.onlyStubs = true;
    if (arg === "--only-missing") args.onlyMissing = true;
    if (arg.startsWith("--locale=")) args.locale = arg.slice("--locale=".length).trim();
    if (arg.startsWith("--max-keys=")) args.maxKeys = Number(arg.slice("--max-keys=".length)) || Infinity;
    if (arg.startsWith("--delay-ms=")) args.delayMs = Number(arg.slice("--delay-ms=".length)) || 50;
    if (arg.startsWith("--batch-size=")) args.batchSize = Number(arg.slice("--batch-size=".length)) || DEFAULT_BATCH_SIZE;
  }
  return args;
}

function loadJson(locale) {
  const filePath = path.join(LOCALES_DIR, locale, "common.json");
  if (!fs.existsSync(filePath)) return {};
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function saveJson(locale, data) {
  const dir = path.join(LOCALES_DIR, locale);
  fs.mkdirSync(dir, { recursive: true });
  const filePath = path.join(dir, "common.json");
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function protectPlaceholders(text) {
  const tokens = [];
  const protectedText = text.replace(PLACEHOLDER_RE, (match) => {
    const token = `__PH_${tokens.length}__`;
    tokens.push(match);
    return token;
  });
  return { protectedText, tokens };
}

function restorePlaceholders(text, tokens) {
  let restored = text;
  tokens.forEach((original, index) => {
    restored = restored.replace(`__PH_${index}__`, original);
    restored = restored.replace(`__ PH _ ${index} __`, original);
    restored = restored.replace(new RegExp(`__PH_${index}__`, "gi"), original);
  });
  return restored;
}

async function translateText(text, target) {
  const trimmedText = typeof text === "string" ? text.trim() : "";
  if (!trimmedText) return "";
  if (target === SOURCE_LOCALE) return trimmedText;

  const rapidApiKey = process.env.RAPIDAPI_TRANSLATE_KEY;
  const rapidApiHost =
    process.env.RAPIDAPI_TRANSLATE_HOST || "google-translate113.p.rapidapi.com";
  if (!rapidApiKey) {
    throw new Error("RAPIDAPI_TRANSLATE_KEY is required");
  }

  const apiTarget = TRANSLATE_TARGET_OVERRIDES[target] || target;
  const { protectedText, tokens } = protectPlaceholders(trimmedText);

  const response = await fetch(`https://${rapidApiHost}/api/v1/translator/text`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-RapidAPI-Key": rapidApiKey,
      "X-RapidAPI-Host": rapidApiHost,
    },
    body: JSON.stringify({
      from: SOURCE_LOCALE,
      to: apiTarget,
      text: protectedText,
    }),
  });

  const result = await response.json().catch(() => ({}));
  const translated =
    (typeof result?.trans === "string" && result.trans) ||
    (typeof result?.translation === "string" && result.translation) ||
    "";

  if (!response.ok || !translated) {
    throw new Error(`Translation failed target=${target}: ${result?.message || response.status}`);
  }

  return restorePlaceholders(translated, tokens);
}

async function translateBatch(values, target) {
  if (values.length === 0) return [];
  if (values.length === 1) return [await translateText(values[0], target)];

  const protectedBlocks = values.map((value) => protectPlaceholders(value));
  const joined = protectedBlocks.map((block) => block.protectedText).join(BATCH_SEPARATOR);

  const rapidApiKey = process.env.RAPIDAPI_TRANSLATE_KEY;
  const rapidApiHost =
    process.env.RAPIDAPI_TRANSLATE_HOST || "google-translate113.p.rapidapi.com";
  if (!rapidApiKey) throw new Error("RAPIDAPI_TRANSLATE_KEY is required");

  const apiTarget = TRANSLATE_TARGET_OVERRIDES[target] || target;
  const response = await fetch(`https://${rapidApiHost}/api/v1/translator/text`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-RapidAPI-Key": rapidApiKey,
      "X-RapidAPI-Host": rapidApiHost,
    },
    body: JSON.stringify({ from: SOURCE_LOCALE, to: apiTarget, text: joined }),
  });

  const result = await response.json().catch(() => ({}));
  const translatedJoined =
    (typeof result?.trans === "string" && result.trans) ||
    (typeof result?.translation === "string" && result.translation) ||
    "";

  if (!response.ok || !translatedJoined) {
    throw new Error(`Batch translation failed target=${target}: ${result?.message || response.status}`);
  }

  const parts = translatedJoined.split(BATCH_SEPARATOR);
  if (parts.length !== values.length) {
    const fallback = [];
    for (const value of values) {
      fallback.push(await translateText(value, target));
    }
    return fallback;
  }

  return parts.map((part, index) =>
    restorePlaceholders(part, protectedBlocks[index].tokens)
  );
}

function chunkArray(items, size) {
  const chunks = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

function keysNeedingWork(source, target, locale, onlyMissing) {
  const work = [];
  for (const key of Object.keys(source)) {
    const sourceValue = source[key];
    const targetValue = target[key];
    if (typeof sourceValue !== "string" || !sourceValue.trim()) continue;
    if (locale === SOURCE_LOCALE) continue;

    const missing = targetValue === undefined || targetValue === "";
    const stub = targetValue === sourceValue;
    if (onlyMissing && !missing) continue;
    if (!onlyMissing && !missing && !stub) continue;
    if (missing || stub) work.push(key);
  }
  return work;
}

async function syncLocale(locale, source, args) {
  if (locale === SOURCE_LOCALE) return { locale, translated: 0, skipped: 0 };

  let target = loadJson(locale);
  const keys = keysNeedingWork(source, target, locale, args.onlyMissing);
  const limitedKeys = keys.slice(0, args.maxKeys);

  console.log(`[${locale}] ${limitedKeys.length}/${keys.length} keys to translate`);
  if (args.dryRun) {
    return { locale, translated: limitedKeys.length, skipped: keys.length - limitedKeys.length, dryRun: true };
  }

  let translated = 0;
  const batches = chunkArray(limitedKeys, args.batchSize);
  for (let batchIndex = 0; batchIndex < batches.length; batchIndex += 1) {
    const batchKeys = batches[batchIndex];
    const batchValues = batchKeys.map((key) => source[key]);
    const batchTranslations = await translateBatch(batchValues, locale);
    batchKeys.forEach((key, index) => {
      target[key] = batchTranslations[index];
      translated += 1;
    });
    console.log(`[${locale}] batch ${batchIndex + 1}/${batches.length} (${translated}/${limitedKeys.length})`);
    if (args.delayMs > 0) await sleep(args.delayMs);
  }

  const ordered = {};
  for (const key of Object.keys(source)) {
    ordered[key] = target[key] ?? source[key];
  }
  saveJson(locale, ordered);
  return { locale, translated, skipped: keys.length - limitedKeys.length };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const source = loadJson(SOURCE_LOCALE);
  const sourceKeyCount = Object.keys(source).length;
  console.log(`Source ${SOURCE_LOCALE}: ${sourceKeyCount} keys`);

  let locales = SITE_LOCALES.filter((lc) => lc !== SOURCE_LOCALE);
  if (args.locale) locales = locales.filter((lc) => lc === args.locale);
  if (args.onlyStubs) locales = locales.filter((lc) => STUB_LOCALES.has(lc));

  const results = [];
  for (const locale of locales) {
    results.push(await syncLocale(locale, source, args));
  }

  console.log("\nSummary:");
  for (const row of results) {
    console.log(`  ${row.locale}: translated=${row.translated}${row.dryRun ? " (dry-run)" : ""}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
