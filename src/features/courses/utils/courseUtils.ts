import type { CourseCreateInput } from "../types/course";

export function extractVimeoId(url: string): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.includes("vimeo.com")) return null;
    const parts = parsed.pathname.split("/").filter(Boolean);
    const last = parts[parts.length - 1] || "";
    return /^\d+$/.test(last) ? last : null;
  } catch (_) {
    return null;
  }
}

export function isValidUrl(value: string): boolean {
  if (!value) return false;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch (_) {
    return false;
  }
}

export function normalizeCourseInput(input: CourseCreateInput): CourseCreateInput {
  const vimeoId = input.vimeoId?.trim() || extractVimeoId(input.vimeoUrl) || undefined;
  return {
    ...input,
    title: input.title.trim(),
    description: input.description.trim(),
    vimeoUrl: input.vimeoUrl.trim(),
    vimeoId,
    thumbnailUrl: input.thumbnailUrl?.trim() || undefined,
  };
}
