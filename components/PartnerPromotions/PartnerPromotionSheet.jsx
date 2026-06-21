import React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "../ui/sheet";
import { Button } from "../ui/button";
import { X } from "lucide-react";
import PartnerPromotionForm from "./PartnerPromotionForm";

export default function PartnerPromotionSheet({
  open,
  onOpenChange,
  editingId,
  form,
  setForm,
  zoneList,
  onTogglePlacement,
  onLogoFile,
  logoUploading,
  onCancel,
  onSave,
  saving,
  error,
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex h-full w-full flex-col overflow-hidden p-0 sm:w-1/2 sm:max-w-none"
      >
        <SheetHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <SheetTitle>
                {editingId ? "Editează promovarea" : "Firmă parteneră nouă"}
              </SheetTitle>
              <SheetDescription>
                {editingId
                  ? "Modifică detaliile firmei partenere și zonele de afișare."
                  : "Completează formularul pentru a adăuga o firmă parteneră nouă."}
              </SheetDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onCancel}
              disabled={saving}
              className="shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {error ? (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <PartnerPromotionForm
            form={form}
            setForm={setForm}
            zoneList={zoneList}
            onTogglePlacement={onTogglePlacement}
            onLogoFile={onLogoFile}
            logoUploading={logoUploading}
            onCancel={onCancel}
            onSave={onSave}
            saving={saving}
            showActions={false}
            zonesMaxHeight="max-h-64"
          />
        </div>

        <SheetFooter className="shrink-0">
          <Button variant="outline" onClick={onCancel} disabled={saving}>
            Anulează
          </Button>
          <Button onClick={onSave} disabled={saving}>
            {saving ? "Se salvează…" : "Salvează"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
