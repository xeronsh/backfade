import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={cn(
        "min-h-36 w-full resize-y rounded-field border border-border bg-surface-2 p-3 text-base text-text-1 transition-colors duration-standard placeholder:text-text-3 focus-visible:border-brand/60",
        className,
      )}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";
