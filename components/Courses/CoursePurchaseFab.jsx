import React from "react";

export default function CoursePurchaseFab({
  visible,
  label,
  loadingLabel,
  isLoading,
  onClick,
  passwordEnabled = false,
  passwordValue = "",
  onPasswordChange,
  passwordLabel = "",
  passwordPlaceholder = "",
  passwordHint = "",
}) {
  if (!visible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-40 w-[min(92vw,24rem)] space-y-3 sm:bottom-6 sm:right-6">
      {passwordEnabled && (
        <div className="rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur">
          <label className="mb-1.5 block text-xs font-semibold text-slate-700">{passwordLabel}</label>
          <input
            type="password"
            value={passwordValue}
            onChange={(event) => onPasswordChange?.(event.target.value)}
            placeholder={passwordPlaceholder}
            autoComplete="off"
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          />
          {passwordHint ? <p className="mt-1.5 text-[11px] text-slate-500">{passwordHint}</p> : null}
        </div>
      )}

      <button
        type="button"
        onClick={onClick}
        disabled={isLoading}
        className="w-full rounded-full bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isLoading ? loadingLabel : label}
      </button>
    </div>
  );
}
