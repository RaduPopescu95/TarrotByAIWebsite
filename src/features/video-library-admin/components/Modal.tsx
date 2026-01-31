import React, { useEffect } from "react";

type Props = {
  title?: string;
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
};

export default function Modal({ title, open, onClose, children }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90]">
      <div
        className="absolute inset-0 bg-gray-900/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="absolute inset-0 overflow-y-auto">
        <div className="flex min-h-full items-start justify-center px-4 py-12 sm:px-6">
          <div className="w-full max-w-6xl">
            <div className="rounded-2xl border-4 border-black bg-white shadow-2xl">
              <div className="max-h-[calc(100vh-16rem)] overflow-y-auto px-6 py-6">
                {children}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

