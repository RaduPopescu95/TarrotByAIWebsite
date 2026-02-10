import React from "react";

export default function MaterialsPanel({
  lesson,
  lessonSummaryTitle,
  lessonDurationLabel,
  lessonDurationUnknown,
  emptyTitle,
  emptyDescription,
}) {
  if (!lesson) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5">
        <h2 className="text-base font-semibold text-slate-900">{emptyTitle}</h2>
        <p className="mt-2 text-sm text-slate-600">{emptyDescription}</p>
      </div>
    );
  }

  const durationText =
    typeof lesson.durationLabel === "string" && lesson.durationLabel.trim().length > 0
      ? lesson.durationLabel
      : typeof lesson.durationMinutes === "number" && lesson.durationMinutes > 0
      ? `${lesson.durationMinutes}`
      : lessonDurationUnknown;

  const summaryText = typeof lesson.summary === "string" ? lesson.summary.trim() : "";

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
        <h2 className="text-lg font-semibold text-slate-900">{lesson.title}</h2>
        <p className="mt-2 text-sm text-slate-600">
          {lessonDurationLabel}: {durationText}
        </p>
      </section>

      <section>
        <h3 className="text-base font-semibold text-slate-900">{lessonSummaryTitle}</h3>
        <p className="mt-2 text-sm leading-relaxed text-slate-700">
          {summaryText || emptyDescription}
        </p>
      </section>
    </div>
  );
}
