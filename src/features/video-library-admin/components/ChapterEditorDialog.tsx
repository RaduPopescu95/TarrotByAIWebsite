// @ts-nocheck
import React, { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../../components/ui/dialog";
import { Button } from "../../../../components/ui/button";
import { LANGUAGE_LABELS } from "../../../../data/constants";
import { gTranslateFetch } from "../../../../utils/apiUtils";
import { sortLocalesForVideoAdmin } from "../utils/videoAdminLocaleOrder";

export type ChapterDraft = {
  id: string;
  title: string;
  titles: Record<string, string>;
  startInput: string;
  endInput: string;
};

type Props = {
  open: boolean;
  initialChapter: ChapterDraft | null;
  localeIds: string[];
  onSave: (draft: ChapterDraft) => void;
  onClose: () => void;
  disabled?: boolean;
};

function createEmptyChapter(): ChapterDraft {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: "",
    titles: { ro: "" },
    startInput: "0:00",
    endInput: "",
  };
}

export default function ChapterEditorDialog({
  open,
  initialChapter,
  localeIds,
  onSave,
  onClose,
  disabled = false,
}: Props) {
  const [draft, setDraft] = useState<ChapterDraft>(createEmptyChapter());
  const [localError, setLocalError] = useState("");
  const [isTranslating, setIsTranslating] = useState(false);
  const [translateMessage, setTranslateMessage] = useState("");

  const sortedLocales = useMemo(
    () => sortLocalesForVideoAdmin(localeIds.length > 0 ? localeIds : ["ro"]),
    [localeIds]
  );

  useEffect(() => {
    if (!open) return;
    setLocalError("");
    setTranslateMessage("");
    setDraft(initialChapter ? { ...initialChapter, titles: { ...initialChapter.titles } } : createEmptyChapter());
  }, [open, initialChapter]);

  const handleTitleRoChange = (value: string) => {
    setDraft((prev) => ({
      ...prev,
      title: value,
      titles: { ...prev.titles, ro: value },
    }));
  };

  const handleLocaleTitleChange = (locale: string, value: string) => {
    setDraft((prev) => ({
      ...prev,
      titles: { ...prev.titles, [locale]: value },
      title: locale === "ro" ? value : prev.title,
    }));
  };

  const generateChapterLocales = async () => {
    const baseTitle = (draft.titles.ro || draft.title || "").trim();
    if (!baseTitle) {
      setTranslateMessage("Completează titlul RO înainte de localizare.");
      return;
    }
    setIsTranslating(true);
    setTranslateMessage("");
    try {
      const nextTitles: Record<string, string> = { ...draft.titles, ro: baseTitle };
      for (const locale of sortedLocales) {
        if (locale === "ro") continue;
        const translated = await gTranslateFetch(baseTitle, locale);
        nextTitles[locale] = translated || baseTitle;
      }
      setDraft((prev) => ({ ...prev, titles: nextTitles, title: baseTitle }));
      setTranslateMessage("Localizarea capitolelor s-a terminat.");
    } catch {
      setTranslateMessage("Localizarea a eșuat. Încearcă din nou.");
    } finally {
      setIsTranslating(false);
    }
  };

  const handleSave = () => {
    const title = (draft.titles.ro || draft.title || "").trim();
    const start = draft.startInput.trim();
    if (!title) {
      setLocalError("Titlul RO este obligatoriu.");
      return;
    }
    if (!start) {
      setLocalError("Timpul de start este obligatoriu.");
      return;
    }
    onSave({
      ...draft,
      title,
      titles: { ...draft.titles, ro: title },
    });
    onClose();
  };

  const uiLocked = disabled || isTranslating;

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent
        className="relative z-[101] max-h-[85vh] w-full max-w-[min(50vw,640px)] overflow-y-auto sm:mx-0"
        onClick={(e) => e.stopPropagation()}
      >
        <DialogHeader>
          <DialogTitle>{initialChapter ? "Editează capitol" : "Adaugă capitol"}</DialogTitle>
          <DialogDescription>
            Timpi acceptați: secunde, mm:ss sau hh:mm:ss. Titlurile pot fi localizate separat pentru
            fiecare limbă.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 px-6 pb-2">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-gray-700">Start *</label>
              <input
                value={draft.startInput}
                onChange={(e) => setDraft((prev) => ({ ...prev, startInput: e.target.value }))}
                disabled={uiLocked}
                className="mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-gray-50"
                placeholder="0:00"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Final</label>
              <input
                value={draft.endInput}
                onChange={(e) => setDraft((prev) => ({ ...prev, endInput: e.target.value }))}
                disabled={uiLocked}
                className="mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-gray-50"
                placeholder="opțional"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Titlu RO *</label>
            <input
              value={draft.titles.ro ?? draft.title ?? ""}
              onChange={(e) => handleTitleRoChange(e.target.value)}
              disabled={uiLocked}
              className="mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-gray-50"
              placeholder="Ex. Introducere"
            />
          </div>

          <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-4">
            <label className="text-sm font-medium text-gray-800">Localizare capitole</label>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => void generateChapterLocales()}
                disabled={uiLocked}
              >
                {isTranslating ? "Se localizează..." : "Generează localizări"}
              </Button>
              {translateMessage ? (
                <p
                  className={`text-sm ${
                    translateMessage.includes("eșuat") || translateMessage.includes("Completează")
                      ? "text-red-600"
                      : "text-emerald-600"
                  }`}
                >
                  {translateMessage}
                </p>
              ) : null}
            </div>
            <p className="mt-1.5 text-xs text-gray-500">
              Traduce titlul RO în celelalte limbi ale site-ului. Poți edita manual după generare.
            </p>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {sortedLocales.map((locale) => (
                <label key={locale} className="block">
                  <span className="mb-1 block text-xs font-semibold uppercase text-gray-500">
                    {(LANGUAGE_LABELS as Record<string, { denumire?: string }>)?.[locale]?.denumire ||
                      locale.toUpperCase()}
                  </span>
                  <input
                    value={draft.titles?.[locale] ?? (locale === "ro" ? draft.title : "")}
                    onChange={(e) => handleLocaleTitleChange(locale, e.target.value)}
                    disabled={uiLocked}
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-gray-50"
                    placeholder={locale === "ro" ? "Titlu RO" : "Titlu localizat"}
                  />
                </label>
              ))}
            </div>
          </div>

          {localError ? <p className="text-sm text-red-600">{localError}</p> : null}
        </div>

        <DialogFooter className="border-t border-gray-200">
          <Button type="button" variant="outline" onClick={onClose} disabled={uiLocked}>
            Anulează
          </Button>
          <Button type="button" onClick={handleSave} disabled={uiLocked}>
            Salvează capitol
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
