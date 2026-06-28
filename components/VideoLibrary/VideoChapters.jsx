import { formatChapterTime } from "../../lib/videoChapters";

export default function VideoChapters({ chapters, onSelect, disabled = false, message = "" }) {
  if (!Array.isArray(chapters) || chapters.length === 0) return null;

  return (
    <section className="mt-5 rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-slate-900">Capitole</h2>
        {message ? (
          <span className="text-xs font-medium text-amber-700" role="status">
            {message}
          </span>
        ) : null}
      </div>
      <div className="mt-3 divide-y divide-slate-100">
        {chapters.map((chapter) => (
          <button
            key={`${chapter.startSeconds}-${chapter.title}`}
            type="button"
            disabled={disabled}
            onClick={() => onSelect?.(chapter)}
            className="flex w-full items-center gap-3 py-2.5 text-left transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="w-16 shrink-0 rounded bg-slate-900 px-2 py-1 text-center font-mono text-xs font-semibold text-white">
              {formatChapterTime(chapter.startSeconds)}
            </span>
            <span className="min-w-0 flex-1 text-sm font-medium text-slate-800">
              {chapter.title}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
