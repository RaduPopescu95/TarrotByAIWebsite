import React from "react";

const TAB_ITEMS = [
  { id: "materials", labelKey: "materialsLabel" },
  { id: "notes", labelKey: "notesLabel" },
  { id: "contact", labelKey: "contactLabel" },
];

export default function LessonTabs({
  activeTab,
  onTabChange,
  onAddToCalendar,
  onShare,
  materialsLabel,
  notesLabel,
  contactLabel,
  calendarButtonLabel,
  shareButtonLabel,
}) {
  const labels = {
    materialsLabel,
    notesLabel,
    contactLabel,
  };

  return (
    <div className="flex flex-col gap-4 border-b border-slate-200 pb-4 md:flex-row md:items-center md:justify-between">
      <div
        role="tablist"
        aria-label="Course detail tabs"
        className="flex flex-wrap items-center gap-1"
      >
        {TAB_ITEMS.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              id={`course-tab-${tab.id}`}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`course-tabpanel-${tab.id}`}
              onClick={() => onTabChange(tab.id)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                isActive
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              {labels[tab.labelKey]}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onAddToCalendar}
          className="inline-flex items-center rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          {calendarButtonLabel}
        </button>
        <button
          type="button"
          onClick={onShare}
          className="inline-flex items-center rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          {shareButtonLabel}
        </button>
      </div>
    </div>
  );
}
