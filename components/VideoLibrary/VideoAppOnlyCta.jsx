import React from "react";
import { useTranslation } from "next-i18next";
import { APPLE_APP_STORE_URL, GOOGLE_PLAY_APP_URL } from "../../lib/appStoreLinks";

export default function VideoAppOnlyCta({ compact = false, className = "" }) {
  const { t } = useTranslation("common");

  return (
    <div className={`space-y-3 text-center ${className}`.trim()}>
      <p className={`font-medium text-slate-100 ${compact ? "text-xs" : "text-sm"}`}>
        {t("videoLibraryAppOnlyMessage")}
      </p>
      <p className={`text-slate-300 ${compact ? "text-[11px]" : "text-xs"}`}>
        {t("videoLibraryAppOnlyDownloadHint")}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <a
          href={GOOGLE_PLAY_APP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={`rounded-full bg-white font-semibold text-slate-900 hover:bg-slate-100 ${
            compact ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm"
          }`}
        >
          {t("videoLibraryAppOnlyGooglePlay")}
        </a>
        <a
          href={APPLE_APP_STORE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={`rounded-full border border-white/70 font-semibold text-white hover:bg-white/10 ${
            compact ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm"
          }`}
        >
          {t("videoLibraryAppOnlyAppStore")}
        </a>
      </div>
    </div>
  );
}
