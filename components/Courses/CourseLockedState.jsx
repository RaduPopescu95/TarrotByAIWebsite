import React from "react";

export default function CourseLockedState({
  isLoggedIn,
  onPurchase,
  onLogin,
  onRegister,
  isLoading,
  title,
  authTitle,
  descriptionLoggedIn,
  descriptionLoggedOut,
  purchaseButtonLabel,
  purchaseLoadingLabel,
  loginButtonLabel,
  registerButtonLabel,
  authHintLabel,
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      <p className="mt-2 text-sm text-gray-600">
        {isLoggedIn ? descriptionLoggedIn : descriptionLoggedOut}
      </p>
      {isLoggedIn ? (
        <button
          onClick={onPurchase}
          disabled={isLoading}
          className="mt-4 rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white"
        >
          {isLoading ? purchaseLoadingLabel : purchaseButtonLabel}
        </button>
      ) : (
        <div className="mt-5 space-y-3">
          <p className="text-sm font-semibold text-gray-900">{authTitle}</p>
          <p className="text-sm text-gray-600">{authHintLabel}</p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onLogin}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
            >
              {loginButtonLabel}
            </button>
            <button
              type="button"
              onClick={onRegister}
              className="rounded-lg border border-indigo-300 bg-white px-4 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-50"
            >
              {registerButtonLabel}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
