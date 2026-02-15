import React from "react";

export default function CoursePurchaseFab({
  visible,
  label,
  loadingLabel,
  isLoading,
  onClick,
}) {
  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isLoading}
      className="fixed bottom-4 right-4 z-40 rounded-full bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-70 sm:bottom-6 sm:right-6"
    >
      {isLoading ? loadingLabel : label}
    </button>
  );
}
