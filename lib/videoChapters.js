const toFiniteInteger = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  const integer = Math.floor(parsed);
  return integer >= 0 ? integer : null;
};

export function formatChapterTime(totalSeconds) {
  const safe = toFiniteInteger(totalSeconds) ?? 0;
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function parseChapterTime(value) {
  if (typeof value === "number") return toFiniteInteger(value);
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^\d+$/.test(trimmed)) return toFiniteInteger(trimmed);
  const parts = trimmed.split(":");
  if (parts.length < 2 || parts.length > 3) return null;
  const nums = parts.map((part) => Number(part));
  if (nums.some((num) => !Number.isInteger(num) || num < 0)) return null;
  if (parts.length === 2) {
    const [minutes, seconds] = nums;
    if (seconds > 59) return null;
    return minutes * 60 + seconds;
  }
  const [hours, minutes, seconds] = nums;
  if (minutes > 59 || seconds > 59) return null;
  return hours * 3600 + minutes * 60 + seconds;
}

export function resolveChapterTitle(chapter, locale = "ro") {
  if (!chapter || typeof chapter !== "object") return "";
  const normalizedLocale =
    typeof locale === "string" && locale.trim()
      ? locale.trim().toLowerCase().replace("_", "-").split("-")[0]
      : "ro";
  const localized = chapter.locales?.[normalizedLocale]?.title;
  if (typeof localized === "string" && localized.trim()) return localized.trim();
  const ro = chapter.locales?.ro?.title;
  if (typeof ro === "string" && ro.trim()) return ro.trim();
  return typeof chapter.title === "string" ? chapter.title.trim() : "";
}

export function normalizeVideoChapters(value, { locale = "ro", includeLocales = true } = {}) {
  if (!Array.isArray(value)) return [];
  const rows = [];
  for (const item of value) {
    if (!item || typeof item !== "object" || Array.isArray(item)) continue;
    const startSeconds = toFiniteInteger(item.startSeconds ?? item.start ?? item.time);
    if (startSeconds == null) continue;
    const endSecondsRaw = item.endSeconds ?? item.end;
    const endSeconds =
      endSecondsRaw === undefined || endSecondsRaw === null || endSecondsRaw === ""
        ? null
        : toFiniteInteger(endSecondsRaw);
    if (endSeconds != null && endSeconds <= startSeconds) continue;

    const title = resolveChapterTitle(item, locale);
    if (!title) continue;

    const chapter = {
      startSeconds,
      endSeconds,
      title,
    };

    if (includeLocales && item.locales && typeof item.locales === "object" && !Array.isArray(item.locales)) {
      const locales = {};
      for (const [key, localeEntry] of Object.entries(item.locales)) {
        const localeTitle =
          localeEntry && typeof localeEntry === "object" && typeof localeEntry.title === "string"
            ? localeEntry.title.trim()
            : "";
        if (localeTitle) {
          locales[key] = { title: localeTitle };
        }
      }
      if (Object.keys(locales).length > 0) chapter.locales = locales;
    }

    rows.push(chapter);
  }
  return rows.sort((a, b) => a.startSeconds - b.startSeconds);
}

export function validateVideoChapters(value) {
  if (value === undefined || value === null) return null;
  if (!Array.isArray(value)) return "Capitolele trebuie să fie o listă.";
  for (const item of value) {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      return "Fiecare capitol trebuie să aibă timp și titlu.";
    }
    const startSeconds = toFiniteInteger(item.startSeconds);
    if (startSeconds == null) {
      return "Fiecare capitol trebuie să aibă un timp de început valid.";
    }
    const endSeconds =
      item.endSeconds === undefined || item.endSeconds === null || item.endSeconds === ""
        ? null
        : toFiniteInteger(item.endSeconds);
    if (endSeconds != null && endSeconds <= startSeconds) {
      return "Timpul de final trebuie să fie după timpul de început.";
    }
    if (!resolveChapterTitle(item, "ro")) {
      return "Fiecare capitol trebuie să aibă titlu, cel puțin în română.";
    }
  }
  return null;
}
