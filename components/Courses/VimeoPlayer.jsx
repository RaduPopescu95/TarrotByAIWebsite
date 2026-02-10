import React from "react";

export default function VimeoPlayer({ vimeoId, title, fallbackTitle = "" }) {
  if (!vimeoId) return null;
  const src = `https://player.vimeo.com/video/${vimeoId}`;
  return (
    <div className="aspect-video w-full overflow-hidden rounded-2xl border border-gray-200 bg-black">
      <iframe
        src={src}
        title={title || fallbackTitle}
        className="h-full w-full"
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}
