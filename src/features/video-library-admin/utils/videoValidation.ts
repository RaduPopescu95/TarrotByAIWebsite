import { resolveLibraryEmbedSrc } from "../../../../lib/videoLibraryPublic";
import type { VideoCreateInput } from "../types/video";

export type VideoValidationErrors = {
  title?: string;
  platform?: string;
  videoUrl?: string;
};

export function validateVideoInput(input: VideoCreateInput): VideoValidationErrors {
  const errors: VideoValidationErrors = {};
  if (!input.title || !input.title.trim()) {
    errors.title = "Titlul este obligatoriu";
  }
  if (!input.platform) {
    errors.platform = "Platforma este obligatorie";
  }
  if (!input.videoUrl || !input.videoUrl.trim()) {
    errors.videoUrl = "Linkul video este obligatoriu";
  } else if (input.platform === "bunny") {
    const embed = resolveLibraryEmbedSrc("bunny", input.videoUrl);
    if (!embed) {
      errors.videoUrl =
        "Introdu un embed Bunny Stream valid (player.mediadelivery.net/embed/…).";
    }
  }
  return errors;
}
