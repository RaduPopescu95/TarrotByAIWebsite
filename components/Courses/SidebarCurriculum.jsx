import React, { useEffect, useMemo, useState } from "react";

export default function SidebarCurriculum({
  title,
  lessons = [],
  activeLessonId,
  onSelectLesson,
  progressLabel,
  downloadCertificateLabel,
  certificateLockedLabel,
  isCertificateEnabled,
  onDownloadCertificate,
  isCertificateLoading = false,
  emptyLabel = "",
}) {
  const defaultOpenLessonId = useMemo(() => activeLessonId || lessons[0]?.id || null, [
    activeLessonId,
    lessons,
  ]);
  const [openLessonId, setOpenLessonId] = useState(defaultOpenLessonId);

  useEffect(() => {
    setOpenLessonId(defaultOpenLessonId);
  }, [defaultOpenLessonId]);

  const handleToggleLesson = (lessonId) => {
    setOpenLessonId((prevLessonId) => (prevLessonId === lessonId ? null : lessonId));
    if (typeof onSelectLesson === "function") onSelectLesson(lessonId);
  };
  const canDownloadCertificate =
    isCertificateEnabled && typeof onDownloadCertificate === "function";

  return (
    <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_12px_32px_-24px_rgba(15,23,42,0.8)] sm:p-5">
        <div className="mb-4 space-y-1">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-700">{title}</h2>
          <p className="text-xs text-slate-500">{progressLabel}</p>
        </div>

        {lessons.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-3 py-4 text-sm text-slate-500">
            {emptyLabel}
          </p>
        ) : (
          <ul className="space-y-2">
            {lessons.map((lesson, index) => {
              const isOpen = lesson.id === openLessonId;
              const isActive = lesson.id === activeLessonId;
              const panelId = `lesson-panel-${lesson.id}`;

              return (
                <li
                  key={lesson.id}
                  className={`relative overflow-hidden rounded-2xl border transition ${
                    isActive
                      ? "border-red-200 bg-red-50/80 before:absolute before:inset-y-2 before:left-0 before:w-1 before:rounded-r before:bg-red-500"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => handleToggleLesson(lesson.id)}
                    className="flex w-full items-start gap-3 px-3 py-3 text-left"
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                  >
                    <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center text-xs font-semibold text-slate-500">
                      {index + 1}.
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-slate-800">
                        {lesson.title}
                      </span>
                      <span className="mt-1 block text-xs text-slate-500">{lesson.durationLabel}</span>
                    </span>

                    <svg
                      aria-hidden="true"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className={`h-4 w-4 text-slate-500 transition ${isOpen ? "rotate-180" : "rotate-0"}`}
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.22 7.22a.75.75 0 0 1 1.06 0L10 10.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 8.28a.75.75 0 0 1 0-1.06z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>

                  {isOpen && (
                    <div id={panelId} className="border-t border-slate-200 px-3 pb-3 pt-2 text-xs text-slate-600">
                      {lesson.summary}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <button
        type="button"
        onClick={canDownloadCertificate ? onDownloadCertificate : undefined}
        disabled={!canDownloadCertificate || isCertificateLoading}
        className={`w-full rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition ${
          canDownloadCertificate
            ? "border-slate-200 bg-white text-slate-800 hover:border-slate-300 hover:bg-slate-50"
            : "border-slate-200 bg-slate-100 text-slate-500"
        } disabled:cursor-not-allowed disabled:opacity-80`}
      >
        {downloadCertificateLabel}
        {!isCertificateEnabled && (
          <span className="mt-1 block text-xs font-normal text-slate-500">{certificateLockedLabel}</span>
        )}
      </button>
    </aside>
  );
}
