import React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "../ui/sheet";
import { Button } from "../ui/button";
import { X } from "lucide-react";
import BundleForm from "./BundleForm";

export default function BundleSheet({
  open,
  onOpenChange,
  editingBundle,
  courses,
  onSubmit,
  loading,
  error,
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle>
                {editingBundle ? "Editează trilogia" : "Adaugă trilogie"}
              </SheetTitle>
              <SheetDescription>
                Selectează minim două cursuri existente și setează prețul ofertei.
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

        <div className="px-6 py-6">
          {error ? (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}
          <BundleForm
            initialValue={editingBundle}
            courses={courses}
            onSubmit={onSubmit}
            onCancel={() => onOpenChange(false)}
            loading={loading}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
