import React, { useMemo } from "react";
import { RANGE_OPTIONS } from "./videoStatsConstants";
import { platformLabel as labelPlatform } from "./formatVideoStatsDelta";

export default function VideoStatsFilters({
  range,
  platform,
  category,
  searchInput,
  categories = [],
  onRangeChange,
  onPlatformChange,
  onCategoryChange,
  onSearchInputChange,
  onSearchApply,
  onClearFilters,
}) {
  const hasActiveFilters = Boolean(platform || category || searchInput.trim());

  const badges = useMemo(() => {
    const items = [];
    if (platform) {
      items.push({
        key: "platform",
        label: labelPlatform(platform),
        onRemove: () => onPlatformChange(""),
      });
    }
    if (category) {
      items.push({
        key: "category",
        label: category,
        onRemove: () => onCategoryChange(""),
      });
    }
    if (searchInput.trim()) {
      items.push({
        key: "search",
        label: `„${searchInput.trim()}”`,
        onRemove: () => {
          onSearchInputChange("");
          onSearchApply("");
        },
      });
    }
    return items;
  }, [
    category,
    onCategoryChange,
    onPlatformChange,
    onSearchApply,
    onSearchInputChange,
    platform,
    searchInput,
  ]);

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Perioadă">
        {RANGE_OPTIONS.map((option) => {
          const active = range === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onRangeChange(option.value)}
              aria-pressed={active}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 ${
                active
                  ? "bg-slate-900 text-white"
                  : "bg-slate-50 text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-[160px_180px_1fr_auto]">
        <label className="block text-xs font-medium text-slate-600">
          Platformă
          <select
            value={platform}
            onChange={(event) => onPlatformChange(event.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
          >
            <option value="">Toate platformele</option>
            <option value="bunny">Bunny</option>
            <option value="youtube">YouTube</option>
            <option value="vimeo">Vimeo</option>
          </select>
        </label>

        <label className="block text-xs font-medium text-slate-600">
          Categorie
          <select
            value={category}
            onChange={(event) => onCategoryChange(event.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
          >
            <option value="">Toate categoriile</option>
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-xs font-medium text-slate-600 sm:col-span-2 lg:col-span-1">
          Căutare
          <input
            value={searchInput}
            onChange={(event) => onSearchInputChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") onSearchApply(searchInput);
            }}
            placeholder="Titlu sau ID"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
          />
        </label>

        <div className="flex items-end gap-2">
          <button
            type="button"
            onClick={() => onSearchApply(searchInput)}
            className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 lg:w-auto"
          >
            Caută
          </button>
          {hasActiveFilters ? (
            <button
              type="button"
              onClick={onClearFilters}
              className="w-full whitespace-nowrap rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 lg:w-auto"
            >
              Șterge filtrele
            </button>
          ) : null}
        </div>
      </div>

      {badges.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2" aria-label="Filtre active">
          {badges.map((badge) => (
            <button
              key={badge.key}
              type="button"
              onClick={badge.onRemove}
              className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
              aria-label={`Elimină filtrul ${badge.label}`}
            >
              {badge.label}
              <span aria-hidden="true">×</span>
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}
