import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SplitLayoutProps {
  main: ReactNode;
  aside: ReactNode;
  className?: string;
  /** `sticky` keeps the aside pinned on desktop; `flow` leaves it in place. */
  asidePosition?: "sticky" | "flow";
  asideWidth?: "narrow" | "wide";
  gap?: "tight" | "loose";
}

/**
 * Two-column page body. Replaces per-page grid variants so the column math
 * lives in exactly one file.
 */
export function SplitLayout({
  main,
  aside,
  className,
  asidePosition = "flow",
  asideWidth = "narrow",
  gap = "tight",
}: SplitLayoutProps) {
  return (
    <div
      data-slot="split-layout"
      className={cn(
        "grid items-start",
        gap === "tight" ? "gap-5" : "gap-8",
        asideWidth === "narrow"
          ? "lg:grid-cols-[minmax(0,1fr)_minmax(320px,380px)]"
          : "lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]",
        className,
      )}
    >
      <div data-slot="split-main" className="grid gap-6">
        {main}
      </div>
      <div
        data-slot="split-aside"
        data-aside-position={asidePosition}
        className={cn(
          "grid gap-4",
          asidePosition === "sticky" && "lg:sticky lg:top-24",
        )}
      >
        {aside}
      </div>
    </div>
  );
}
