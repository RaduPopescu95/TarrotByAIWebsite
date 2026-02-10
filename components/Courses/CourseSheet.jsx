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
import CourseForm from "./CourseForm";

export default function CourseSheet({
  open,
  onOpenChange,
  editingCourse,
  onSubmit,
  loading,
  error,
  categories,
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle>
                {editingCourse ? "Editează cursul" : "Adaugă curs nou"}
              </SheetTitle>
              <SheetDescription>
                {editingCourse
                  ? "Modifică detaliile cursului existent."
                  : "Completează formularul pentru a adăuga un curs nou."}
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
          {error && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
          <CourseForm
            initialValue={editingCourse}
            onSubmit={onSubmit}
            onCancel={() => onOpenChange(false)}
            loading={loading}
            categories={categories}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
