import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * The mono/uppercase micro-label used above figures, panels, and sections.
 * One tracking value, one colour role: routes never hand-roll it.
 */
export function MetaLabel({
  children,
  tone = "muted",
  className,
}: {
  children: ReactNode;
  tone?: "muted" | "brand";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "font-mono text-meta uppercase tracking-eyebrow",
        tone === "brand" ? "text-brand" : "text-text-3",
        className,
      )}
    >
      {children}
    </span>
  );
}
