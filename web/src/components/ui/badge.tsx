import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Badge({
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-chip border border-border-strong px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.04em] text-text-2",
        className,
      )}
      {...props}
    />
  );
}
