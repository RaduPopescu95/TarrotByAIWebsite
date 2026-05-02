import { resolveLibraryEmbedSrc } from "../../../../lib/videoLibraryPublic";
import type { VideoCreateInput } from "../types/video";

export type VideoValidationErrors = {
  title?: string;
  platform?: string;
  localizedVideo?: string;
  localeVideos?: Partial<Record<string, string>>;
};

function embedHintForPlatform(platform: string | undefined): string {
  if (platform === "bunny") {
    return "Introdu link play/embed Bunny (player.mediadelivery.net), bibliotecă/id-video sau UUID video dacă NEXT_PUBLIC_BUNNY_STREAM_LIBRARY_ID e setat în mediu.";
  }
  return "Link invalid pentru platforma aleasă.";
}

export function validateVideoInput(input: VideoCreateInput): VideoValidationErrors {
  const errors: VideoValidationErrors = {};
  const platform =
    input.platform === "bunny" || input.platform === "vimeo" || input.platform === "youtube"
      ? input.platform
      : "youtube";

  if (!input.title || !input.title.trim()) {
    errors.title = "Titlul este obligatoriu";
  }
  if (!input.platform) {
    errors.platform = "Platforma este obligatorie";
  }

  const pairs: Array<{ lc: string; url: string }> = [];
  if (input.locales && typeof input.locales === "object") {
    for (const [lc, blob] of Object.entries(input.locales)) {
      const u = typeof blob?.videoUrl === "string" ? blob.videoUrl.trim() : "";
      if (u) pairs.push({ lc, url: u });
    }
  }

  if (pairs.length === 0) {
    errors.localizedVideo = "Completează cel puțin un link video pentru o limbă a site‑ului.";
  } else {
    const localeVideos: Partial<Record<string, string>> = {};
    for (const { lc, url } of pairs) {
      const embed = resolveLibraryEmbedSrc(platform, url);
      if (!embed) {
        localeVideos[lc] = embedHintForPlatform(platform);
      }
    }
    if (Object.keys(localeVideos).length > 0) {
      errors.localeVideos = localeVideos;
      errors.localizedVideo =
        platform === "bunny"
          ? "Un sau mai multe linkuri Bunny sunt invalide. Verifică câmpurile marcate mai jos."
          : "Un sau mai multe linkuri video sunt invalide. Verifică câmpurile marcate mai jos.";
    }
  }

  return errors;
}
