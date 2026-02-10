import React from "react";

function PlayOverlay() {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/10">
      <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-white/90 text-slate-900 shadow-lg shadow-black/20">
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="ml-1 h-7 w-7"
        >
          <path d="M8.5 6.7a1 1 0 0 1 1.53-.85l8 5.3a1 1 0 0 1 0 1.7l-8 5.3A1 1 0 0 1 8.5 17V6.7z" />
        </svg>
      </span>
    </div>
  );
}

export default function VideoCard({
  hasAccess,
  playbackLoading,
  playbackError,
  playbackVimeoId,
  previewThumbnailUrl,
  shouldRenderPreviewVideo,
  previewVimeoId,
  title,
  preparingLabel,
  noPreviewLabel,
  playbackUnavailableLabel,
  fallbackPlayerTitle,
}) {
  const hasLockedPreview = Boolean(previewThumbnailUrl) || Boolean(shouldRenderPreviewVideo);

  return (
    <section className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-[0_14px_34px_-26px_rgba(15,23,42,0.75)]">
      <div className="relative aspect-video w-full overflow-hidden bg-slate-900">
        {hasAccess ? (
          playbackLoading ? (
            <div className="flex h-full w-full items-center justify-center px-6 text-center text-sm text-slate-200">
              {preparingLabel}
            </div>
          ) : playbackError ? (
            <div className="flex h-full w-full items-center justify-center px-6 text-center text-sm text-red-200">
              {playbackError}
            </div>
          ) : playbackVimeoId ? (
            <iframe
              src={`https://player.vimeo.com/video/${playbackVimeoId}`}
              title={title || fallbackPlayerTitle}
              className="h-full w-full"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center px-6 text-center text-sm text-amber-200">
              {playbackUnavailableLabel}
            </div>
          )
        ) : previewThumbnailUrl ? (
          <img
            src={previewThumbnailUrl}
            alt={title || fallbackPlayerTitle}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : shouldRenderPreviewVideo ? (
          <iframe
            title={`${title || fallbackPlayerTitle} preview`}
            src={`https://player.vimeo.com/video/${previewVimeoId}?autoplay=0&muted=1&loop=0&autopause=1&controls=0&title=0&byline=0&portrait=0`}
            className="h-full w-full"
            loading="lazy"
            allow="fullscreen; picture-in-picture"
            allowFullScreen={false}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center px-6 text-center text-sm text-slate-300">
            {noPreviewLabel}
          </div>
        )}

        {!hasAccess && hasLockedPreview && <PlayOverlay />}
      </div>
    </section>
  );
}
