import React from "react";

function formatPrice(price, currency, locale) {
  if (typeof price !== "number") return "-";
  return new Intl.NumberFormat(locale || "ro-RO", {
    style: "currency",
    currency: currency || "RON",
    minimumFractionDigits: 0,
  }).format(price);
}

export default function CourseCard({
  course,
  onClick,
  noImageLabel = "",
  priceLocale = "ro-RO",
  openLabel = "",
  featuredLabel = "",
}) {
  const shouldShowVideoPreview =
    !course?.hasCustomThumbnail &&
    typeof course?.previewVimeoId === "string" &&
    course.previewVimeoId.length > 0;
  const priceLabel = formatPrice(course?.price, course?.currency, priceLocale);

  return (
    <button
      onClick={onClick}
      className="group relative flex h-full w-full cursor-pointer flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white text-left shadow-[0_4px_12px_rgba(15,23,42,0.06)] transition-shadow duration-300 hover:shadow-[0_8px_18px_rgba(15,23,42,0.1)]"
    >
      <div className="relative h-80 w-full overflow-hidden bg-slate-100">
        {shouldShowVideoPreview ? (
          <iframe
            title={`${course.title} preview`}
            src={`https://player.vimeo.com/video/${course.previewVimeoId}?autoplay=0&muted=1&loop=0&autopause=1&controls=0&title=0&byline=0&portrait=0`}
            loading="lazy"
            className="pointer-events-none h-full w-full object-cover"
            allow="fullscreen; picture-in-picture"
            allowFullScreen={false}
          />
        ) : course.thumbnailUrl ? (
          <img
            src={course.thumbnailUrl}
            alt={course.title}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-slate-400">
            {noImageLabel}
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-900/35 via-slate-900/5 to-transparent" />

        {featuredLabel ? (
          <span className="absolute left-3 top-3 inline-flex items-center rounded-full border border-amber-200 bg-amber-50/95 px-3 py-1 text-xs font-semibold text-amber-700 shadow-sm">
            {featuredLabel}
          </span>
        ) : null}

      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-3.5">
        <h3 className="line-clamp-2 text-base font-semibold text-slate-900">{course.title}</h3>
        <p className="line-clamp-1 text-xs leading-relaxed text-slate-600">{course.description}</p>
        <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-2.5">
          <span className="text-sm font-semibold text-indigo-600">{priceLabel}</span>
          {openLabel ? (
            <span className="inline-flex items-center gap-1 text-sm font-semibold text-slate-800 transition group-hover:text-indigo-600">
              {openLabel}
              <svg
                className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 111.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </span>
          ) : null}
        </div>
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1 overflow-hidden">
        <span className="block h-full w-full origin-left scale-x-0 bg-gradient-to-r from-cyan-400 via-indigo-500 to-fuchsia-500 transition-transform duration-500 ease-out group-hover:scale-x-100" />
      </div>
    </button>
  );
}
