import { resolveLibraryEmbedSrc } from "../../../../lib/videoLibraryPublic";
import type { VideoCreateInput } from "../types/video";

export type VideoValidationErrors = {
  title?: string;
  platform?: string;
  localizedVideo?: string;
  localeVideos?: Partial<Record<string, string>>;
  thumbnailUrl?: string;
  isPublished?: string;
  publicReleaseAt?: string;
};

const toMillis = (value: unknown): number | null => {
  if (!value) return null;
  if (typeof value === "object" && typeof (value as { toMillis?: unknown }).toMillis === "function") {
    const millis = (value as { toMillis: () => number }).toMillis();
    return Number.isFinite(millis) ? millis : null;
  }
  if (value instanceof Date) {
    const millis = value.getTime();
    return Number.isFinite(millis) ? millis : null;
  }
  return null;
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

  if (input.publishAt && input.isPublished !== true) {
    errors.isPublished =
      "Pentru publicare programată, activează \"Publicat în aplicație\"; altfel videoclipul rămâne ascuns.";
  }

  if (input.publicReleaseAt) {
    const publishAtMs = toMillis(input.publishAt);
    const publicReleaseAtMs = toMillis(input.publicReleaseAt);
    if (input.isPublished !== true) {
      errors.publicReleaseAt =
        "Pentru acces Premium anticipat, activează „Publicat în aplicație”.";
    } else if (input.isPremium !== true) {
      errors.publicReleaseAt =
        "Accesul Premium anticipat necesită modul „Premium apoi public”.";
    } else if (
      publishAtMs == null ||
      publicReleaseAtMs == null ||
      publicReleaseAtMs <= publishAtMs
    ) {
      errors.publicReleaseAt =
        "Publicarea generală la 18:00 trebuie să fie după începutul accesului Premium.";
    }
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

  const bunnyThumb =
    platform === "bunny" && typeof input.thumbnailUrl === "string"
      ? input.thumbnailUrl.trim()
      : "";
  if (bunnyThumb) {
    try {
      const u = new URL(bunnyThumb);
      if (u.protocol !== "http:" && u.protocol !== "https:") {
        errors.thumbnailUrl = "Thumbnail-ul trebuie să fie un URL http(s) valid.";
      }
    } catch {
      errors.thumbnailUrl = "Thumbnail-ul nu este un URL valid.";
    }
  }

  return errors;
}
