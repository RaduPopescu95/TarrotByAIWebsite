import React from "react";

export default function VideoStatsTabs({ tabs, activeTab, onChange, children }) {
  return (
    <div>
      <div
        role="tablist"
        aria-label="Secțiuni statistici"
        className="flex gap-1 overflow-x-auto border-b border-slate-200 pb-px"
      >
        {tabs.map((tab) => {
          const selected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={`tab-${tab.id}`}
              aria-selected={selected}
              aria-controls={`panel-${tab.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => onChange(tab.id)}
              onKeyDown={(event) => {
                if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
                event.preventDefault();
                const index = tabs.findIndex((item) => item.id === tab.id);
                const next =
                  event.key === "ArrowRight"
                    ? tabs[(index + 1) % tabs.length]
                    : tabs[(index - 1 + tabs.length) % tabs.length];
                onChange(next.id);
              }}
              className={`whitespace-nowrap rounded-t-lg px-4 py-2.5 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 ${
                selected
                  ? "bg-white text-slate-900 shadow-[inset_0_-2px_0_0_#0f172a]"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      <div
        role="tabpanel"
        id={`panel-${activeTab}`}
        aria-labelledby={`tab-${activeTab}`}
        className="mt-4"
      >
        {children}
      </div>
    </div>
  );
}
