import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const valueTones = {
  default: "text-text-1",
  back: "text-back",
  fade: "text-fade",
  brand: "text-brand",
  warning: "text-warning",
  info: "text-info",
  muted: "text-text-3",
} as const;

export type ValueTone = keyof typeof valueTones;

interface MetricGroupProps {
  children: ReactNode;
  columns?: 2 | 3 | 4 | 5;
  className?: string;
  /** Renders rows with dividers instead of a grid of cells. */
  layout?: "grid" | "rows";
}

/**
 * The only `<dl>` in the product. Routes supply `Metric` / `DataRow` children,
 * so no route has to hand-roll a definition list.
 */
export function MetricGroup({
  children,
  columns = 4,
  className,
  layout = "grid",
}: MetricGroupProps) {
  return (
    <dl
      className={cn(
        layout === "grid"
          ? cn(
              "grid gap-4 text-body",
              columns === 2 && "grid-cols-2",
              columns === 3 && "grid-cols-2 sm:grid-cols-3",
              columns === 4 && "grid-cols-2 sm:grid-cols-4",
              columns === 5 && "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5",
            )
          : "grid gap-3 text-body",
        className,
      )}
    >
      {children}
    </dl>
  );
}

interface MetricProps {
  label: ReactNode;
  value: ReactNode;
  tone?: ValueTone;
  hint?: ReactNode;
  /** `rail` draws the Design System's 2px side rail; `none` is a plain cell. */
  accent?: "none" | "back" | "fade" | "brand";
  className?: string;
  id?: string;
}

/** A labelled figure: liquidity, volume, conviction, counts. */
export function Metric({
  label,
  value,
  tone = "default",
  hint,
  accent = "none",
  className,
  id,
}: MetricProps) {
  return (
    <div
      className={cn(
        "min-w-0",
        accent !== "none" && "border-l-2 pl-3",
        accent === "back" && "border-back",
        accent === "fade" && "border-fade",
        accent === "brand" && "border-brand",
        className,
      )}
    >
      <dt className="font-mono text-meta uppercase tracking-label text-text-3">
        {label}
      </dt>
      <dd
        id={id}
        className={cn(
          "mt-1 font-mono font-semibold tabular-nums",
          valueTones[tone],
        )}
        data-financial
      >
        {value}
      </dd>
      {hint ? <p className="mt-1 text-meta text-text-3">{hint}</p> : null}
    </div>
  );
}

interface DataRowProps {
  label: ReactNode;
  children: ReactNode;
  className?: string;
  /** `stacked` puts the value under the label; `inline` right-aligns it. */
  layout?: "stacked" | "inline";
}

/** A labelled fact read from chain: oracle feed, creator, contract, lifecycle. */
export function DataRow({
  label,
  children,
  className,
  layout = "stacked",
}: DataRowProps) {
  return (
    <div
      className={cn(
        "min-w-0 border-b border-border pb-3 last:border-b-0 last:pb-0",
        layout === "inline" && "flex items-baseline justify-between gap-4",
        className,
      )}
    >
      <dt
        className={cn(
          "font-mono text-meta uppercase tracking-label text-text-3",
          layout === "stacked" && "mb-1",
        )}
      >
        {label}
      </dt>
      <dd className="min-w-0 text-body text-text-1">{children}</dd>
    </div>
  );
}
