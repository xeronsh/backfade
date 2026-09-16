import type { LabelHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type LabelProps = Omit<LabelHTMLAttributes<HTMLLabelElement>, "htmlFor"> & {
  htmlFor: string;
};

export function Label({ className, htmlFor, ...props }: LabelProps) {
  return (
    // biome-ignore lint/a11y/noLabelWithoutControl: htmlFor is required and forwarded to the native label.
    <label
      htmlFor={htmlFor}
      className={cn("block text-sm font-medium text-text-1", className)}
      {...props}
    />
  );
}
