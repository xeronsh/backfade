import { type ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface TabButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
}

export const TabButton = forwardRef<HTMLButtonElement, TabButtonProps>(
  function TabButton({ active = false, className, ...props }, ref) {
    return (
      <button
        ref={ref}
        className={cn(
          "min-h-11 shrink-0 border-b-2 px-4 font-mono text-meta uppercase tracking-label transition-colors duration-standard",
          active
            ? "border-brand text-brand"
            : "border-transparent text-text-3 hover:text-text-1",
          className,
        )}
        {...props}
      />
    );
  },
);
TabButton.displayName = "TabButton";
