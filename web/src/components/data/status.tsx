import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const tones = {
  neutral: "border-border-strong text-text-2",
  success: "border-back bg-back-soft text-back",
  danger: "border-fade bg-fade-soft text-fade",
  warning: "border-warning text-warning",
  info: "border-info text-info",
  brand: "border-brand text-brand",
} as const;

export type StatusTone = keyof typeof tones;

/** Any labelled state: market lifecycle, transaction phase, network state. */
export function Status({
  children,
  tone = "neutral",
  dot = false,
  className,
}: {
  children: ReactNode;
  tone?: StatusTone;
  dot?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-chip border px-2 py-0.5 font-mono text-meta uppercase tracking-label",
        tones[tone],
        className,
      )}
    >
      {dot ? <span aria-hidden="true" className="size-1.5 bg-current" /> : null}
      {children}
    </span>
  );
}
