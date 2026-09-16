import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Badge({
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-chip border border-border-strong px-2 py-0.5 text-meta font-semibold uppercase tracking-label text-text-2",
        className,
      )}
      {...props}
    />
  );
}
