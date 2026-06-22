import React from "react";

function formatPrice(price, currency, locale) {
  return new Intl.NumberFormat(locale || "ro-RO", {
    style: "currency",
    currency: currency || "RON",
    minimumFractionDigits: 0,
  }).format(price || 0);
}

export default function BundleCard({ bundle, locale, onClick, labels = {} }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group overflow-hidden rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-indigo-50 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="relative h-56 overflow-hidden bg-slate-100">
        {bundle.thumbnailUrl ? (
          <img
            src={bundle.thumbnailUrl}
            alt={bundle.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-amber-200 to-indigo-200 text-5xl">
            {bundle.courses?.length || bundle.courseIds?.length || ""}
          </div>
        )}
        <span className="absolute left-4 top-4 rounded-full bg-slate-950 px-3 py-1 text-xs font-bold uppercase tracking-wide text-amber-200">
          {labels.badge || "Trilogie"}
        </span>
      </div>
      <div className="space-y-3 p-5">
        <div>
          <h3 className="text-xl font-bold text-slate-900">{bundle.title}</h3>
          <p className="mt-1 line-clamp-2 text-sm text-slate-600">{bundle.description}</p>
        </div>
        <ol className="space-y-1 text-sm text-slate-700">
          {(bundle.courses || []).map((course, index) => (
            <li key={course.id}>
              <span className="font-semibold">{index + 1}.</span> {course.title}
            </li>
          ))}
        </ol>
        <div className="flex items-center justify-between border-t border-amber-200 pt-3">
          <span className="text-lg font-bold text-indigo-700">
            {formatPrice(bundle.price, bundle.currency, locale)}
          </span>
          <span className="text-sm font-semibold text-slate-900">
            {labels.open || "Vezi trilogia"} →
          </span>
        </div>
      </div>
    </button>
  );
}
