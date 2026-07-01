// @ts-nocheck
import React from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "../../../../components/ui/sheet";
import { Button } from "../../../../components/ui/button";
import { X } from "lucide-react";
import type { VideoCreateInput, VideoDoc } from "../types/video";
import VideoForm from "./VideoForm";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingVideo: VideoDoc | null;
  onSubmit: (data: VideoCreateInput) => Promise<void> | void;
  loading?: boolean;
  error?: string;
};

export default function VideoSheet({
  open,
  onOpenChange,
  editingVideo,
  onSubmit,
  loading = false,
  error,
}: Props) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex h-full w-full flex-col overflow-hidden p-0 sm:w-1/2 sm:max-w-[50vw] sm:min-w-[min(100%,420px)]"
      >
        <SheetHeader className="shrink-0 border-b border-gray-200 px-6 py-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <SheetTitle>
                {editingVideo ? "Editează videoclip" : "Adaugă videoclip"}
              </SheetTitle>
              <SheetDescription>
                Completează câmpurile obligatorii și salvează. Videoclipurile nepublicate nu apar
                în aplicație.
              </SheetDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              aria-label="Închide"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </SheetHeader>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-6 py-4">
          {error ? (
            <div className="mb-4 shrink-0 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}
          <VideoForm
            initialValue={editingVideo}
            onSubmit={onSubmit}
            onCancel={() => onOpenChange(false)}
            loading={loading}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
