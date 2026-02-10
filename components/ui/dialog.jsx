import * as React from "react";
import { cn } from "../../lib/utils";
import { Button } from "./button";

const Dialog = ({ open, onOpenChange, children }) => {
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black/50"
        onClick={() => onOpenChange?.(false)}
      />
      {children}
    </div>
  );
};

const DialogContent = React.forwardRef(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "relative z-50 bg-white rounded-lg shadow-xl w-full max-w-lg mx-4",
          "animate-in fade-in-0 zoom-in-95",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
DialogContent.displayName = "DialogContent";

const DialogHeader = ({ className, ...props }) => (
  <div
    className={cn("flex flex-col space-y-1.5 px-6 py-4", className)}
    {...props}
  />
);

const DialogTitle = ({ className, ...props }) => (
  <h2
    className={cn("text-lg font-semibold text-gray-900", className)}
    {...props}
  />
);

const DialogDescription = ({ className, ...props }) => (
  <p
    className={cn("text-sm text-gray-600", className)}
    {...props}
  />
);

const DialogFooter = ({ className, ...props }) => (
  <div
    className={cn("flex items-center justify-end gap-3 px-6 py-4", className)}
    {...props}
  />
);

export {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
};
