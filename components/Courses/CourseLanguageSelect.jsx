import React from "react";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import { LANGUAGE_LABELS } from "../../data/constants";

export default function CourseLanguageSelect({ availableLocales = [] }) {
  const router = useRouter();
  const { t } = useTranslation("common");

  if (!Array.isArray(availableLocales) || availableLocales.length <= 1) {
    return null;
  }

  const activeLocale = router.locale || "ro";

  const handleChange = (event) => {
    const nextLocale = event.target.value;
    if (!nextLocale || nextLocale === activeLocale) return;
    router.push(router.asPath, router.asPath, { locale: nextLocale });
  };

  return (
    <div className="flex max-w-full flex-col gap-2 sm:max-w-xs">
      <label htmlFor="course-playback-locale" className="text-sm font-medium text-slate-700">
        {t("videoLibraryPlaybackLanguage")}
      </label>
      <select
        id="course-playback-locale"
        value={activeLocale}
        onChange={handleChange}
        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
      >
        {availableLocales.map((lc) => (
          <option key={lc} value={lc}>
            {(LANGUAGE_LABELS && LANGUAGE_LABELS[lc]?.denumire) || lc.toUpperCase()}
          </option>
        ))}
      </select>
    </div>
  );
}
