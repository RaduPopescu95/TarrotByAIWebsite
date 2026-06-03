import React, { useEffect, useId, useState } from "react";
import { useTranslation } from "next-i18next";

export default function VideoPlaybackConsentModal({
  open,
  onAccept,
  onDecline,
  recording = false,
}) {
  const { t } = useTranslation("common");
  const titleId = useId();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!open) {
      setChecked(false);
    }
  }, [open]);

  if (!open) {
    return null;
  }

  const handleAccept = () => {
    if (!checked || recording) return;
    setChecked(false);
    onAccept();
  };

  const handleDecline = () => {
    setChecked(false);
    onDecline();
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/55 p-4"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          handleDecline();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="flex max-h-[min(90vh,720px)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-amber-200/80 bg-[#fff9ef] shadow-2xl"
      >
        <div className="border-b border-amber-100 px-5 py-4 text-center">
          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-800">
            <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
              <path d="M12 1 3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z" />
            </svg>
          </div>
          <h2 id={titleId} className="text-lg font-bold text-slate-900">
            {t("videoConsentTitle")}
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 text-sm leading-relaxed text-slate-700">
          <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50/80 p-3 text-xs font-semibold uppercase tracking-wide text-amber-950">
            {t("videoConsentOfficialNotice")}
          </p>
          <p className="mb-3">{t("videoConsentRecordingNotice")}</p>
          <p className="mb-3">{t("videoConsentLegalSummary")}</p>
          <p>{t("videoConsentConsequences")}</p>
        </div>

        <div className="space-y-4 border-t border-amber-100 px-5 py-4">
          <label className="flex cursor-pointer items-start gap-3 text-sm text-slate-800">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300 text-amber-700 focus:ring-amber-500"
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
            />
            <span>{t("videoConsentCheckbox")}</span>
          </label>

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={handleDecline}
              disabled={recording}
              className="rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              {t("videoConsentBack")}
            </button>
            <button
              type="button"
              onClick={handleAccept}
              disabled={!checked || recording}
              className="rounded-full bg-amber-800 px-5 py-2.5 text-sm font-semibold text-white hover:bg-amber-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {recording ? "…" : t("videoConsentAccept")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
