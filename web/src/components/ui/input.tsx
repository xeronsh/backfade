import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(function Input({ className, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={cn(
        "min-h-11 w-full rounded-field border border-border bg-surface-2 px-3 text-text-1 placeholder:text-text-3",
        className,
      )}
      {...props}
    />
  );
});
Input.displayName = "Input";
