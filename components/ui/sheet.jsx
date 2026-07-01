import * as React from "react";
import { cn } from "../../lib/utils";

const Sheet = ({ open, onOpenChange, children }) => {
  React.useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="fixed inset-0 bg-black/50"
        onClick={() => onOpenChange?.(false)}
      />
      {children}
    </div>
  );
};

const SheetContent = React.forwardRef(
  ({ className, children, side = "right", ...props }, ref) => {
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
      setMounted(true);
    }, []);

    const sideClasses = {
      right: "right-0 h-full w-full sm:max-w-xl",
      left: "left-0 h-full w-full sm:max-w-xl",
      top: "top-0 w-full h-auto max-h-[80vh]",
      bottom: "bottom-0 w-full h-auto max-h-[80vh]",
    };

    const slideClasses = {
      right: mounted ? "translate-x-0" : "translate-x-full",
      left: mounted ? "translate-x-0" : "-translate-x-full",
      top: mounted ? "translate-y-0" : "-translate-y-full",
      bottom: mounted ? "translate-y-0" : "translate-y-full",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "fixed z-50 bg-white shadow-2xl overflow-y-auto",
          "border-l border-gray-200",
          "transition-all duration-300 ease-out",
          sideClasses[side],
          slideClasses[side],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
SheetContent.displayName = "SheetContent";

const SheetHeader = ({ className, ...props }) => (
  <div
    className={cn("flex flex-col space-y-2 px-6 py-4 border-b border-gray-200", className)}
    {...props}
  />
);

const SheetTitle = ({ className, ...props }) => (
  <h2
    className={cn("text-lg font-semibold text-gray-900", className)}
    {...props}
  />
);

const SheetDescription = ({ className, ...props }) => (
  <p
    className={cn("text-sm text-gray-600", className)}
    {...props}
  />
);

const SheetFooter = ({ className, ...props }) => (
  <div
    className={cn(
      "flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50",
      className
    )}
    {...props}
  />
);

export {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
};
