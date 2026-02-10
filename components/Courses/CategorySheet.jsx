import React, { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "../ui/sheet";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { X } from "lucide-react";
import { LANGUAGE_LABELS } from "../../data/constants";
import { gTranslateFetch } from "../../utils/apiUtils";

export default function CategorySheet({
  open,
  onOpenChange,
  editingCategory,
  onSubmit,
  loading,
  error,
}) {
  const [name, setName] = useState("");
  const [localError, setLocalError] = useState("");
  const [locales, setLocales] = useState(editingCategory?.locales);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translateMessage, setTranslateMessage] = useState("");
  const uiLocked = loading || isTranslating;

  useEffect(() => {
    if (open) {
      setName(editingCategory?.name || "");
      setLocalError("");
      setLocales(editingCategory?.locales);
      setTranslateMessage("");
    }
  }, [open, editingCategory]);

  const generateLocales = async (value) => {
    const trimmed = value.trim();
    if (!trimmed) {
      setTranslateMessage("Completează categoria înainte de localizare.");
      return undefined;
    }
    setIsTranslating(true);
    setTranslateMessage("");
    try {
      const result = {};
      const languageKeys = Object.keys(LANGUAGE_LABELS);
      for (const lang of languageKeys) {
        if (lang === "ro") {
          result[lang] = trimmed;
          continue;
        }
        const translated = await gTranslateFetch(trimmed, lang);
        result[lang] = translated || trimmed;
      }
      setLocales(result);
      setTranslateMessage("Localizarea s-a terminat. Poți continua.");
      return result;
    } catch (error) {
      console.error("[categories.form] translate_fail", {
        message: error?.message || "unknown_error",
      });
      setTranslateMessage("Localizarea a eșuat. Încearcă din nou.");
      return undefined;
    } finally {
      setIsTranslating(false);
    }
  };

  const submitForm = (localesToSubmit) => {
    const trimmed = name.trim();
    if (!trimmed) {
      setLocalError("Numele categoriei este obligatoriu.");
      return;
    }
    const hasLocales =
      localesToSubmit &&
      typeof localesToSubmit === "object" &&
      !Array.isArray(localesToSubmit) &&
      Object.keys(localesToSubmit).length > 0;
    const safeLocales = hasLocales ? localesToSubmit : { ro: trimmed };
    onSubmit({ name: trimmed, locales: safeLocales });
  };

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setLocalError("Numele categoriei este obligatoriu.");
      return;
    }
    submitForm(locales);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle>
                {editingCategory ? "Editează categorie" : "Adaugă categorie"}
              </SheetTitle>
              <SheetDescription>
                {editingCategory
                  ? "Actualizează numele categoriei."
                  : "Creează o categorie nouă pentru cursuri."}
              </SheetDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </SheetHeader>

        <div className="relative px-6 py-6 space-y-4">
          {(error || localError) && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error || localError}
            </div>
          )}

          <div>
            <label htmlFor="categoryName" className="block text-sm font-medium text-gray-900">
              Nume categorie <span className="text-red-500">*</span>
            </label>
            <Input
              id="categoryName"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (localError) setLocalError("");
                setLocales(undefined);
                if (translateMessage) setTranslateMessage("");
              }}
              placeholder="Ex: Tarot avansat"
              className="mt-2"
              disabled={uiLocked}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900">Localizare</label>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <Button type="button" variant="outline" onClick={() => generateLocales(name)} disabled={uiLocked}>
                {isTranslating ? "Se localizează..." : "Generează localizări"}
              </Button>
              {isTranslating && (
                <span className="inline-flex items-center gap-2 text-xs text-gray-500">
                  <span className="inline-flex h-3.5 w-3.5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                  Se traduc textele...va rugam asteptati...
                </span>
              )}
              {translateMessage && (
                <span
                  className={`text-xs ${
                    translateMessage.includes("eșuat") ? "text-red-600" : "text-emerald-600"
                  }`}
                >
                  {translateMessage}
                </span>
              )}
            </div>
            <p className="mt-1.5 text-xs text-gray-500">
              Localizarea folosește numele curent al categoriei. Dacă nu localizezi, se salvează
              cu fallback RO.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={uiLocked}>
              Renunță
            </Button>
            <Button onClick={handleSave} disabled={uiLocked}>
              {loading ? "Se salvează..." : editingCategory ? "Salvează" : "Creează categorie"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
