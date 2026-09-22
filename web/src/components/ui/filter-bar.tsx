import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface FilterOption<T extends string> {
  id: T;
  label: string;
}

/**
 * A row of mutually exclusive filter chips. Owns the selected/unselected
 * treatment so no page invents its own chip styling.
 */
export function FilterBar<T extends string>({
  options,
  value,
  onChange,
  label,
  className,
}: {
  options: Array<FilterOption<T>>;
  value: T;
  onChange: (next: T) => void;
  label: string;
  className?: string;
}) {
  return (
    <div
      role="toolbar"
      aria-label={label}
      className={cn("flex flex-wrap gap-1", className)}
    >
      {options.map((option) => {
        const active = option.id === value;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            aria-pressed={active}
            className={cn(
              "min-h-9 border px-3 font-mono text-meta uppercase tracking-label transition-colors duration-standard",
              active
                ? "border-brand/40 bg-brand/15 text-brand"
                : "border-border text-text-3 hover:border-border-strong hover:text-text-1",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

/**
 * A row of toggleable chips where any number can be active at once. Shares the
 * FilterBar treatment so multi-select and single-select read as one control.
 */
export function ToggleChips<T extends string>({
  options,
  values,
  onToggle,
  label,
  className,
}: {
  options: Array<FilterOption<T>>;
  values: T[];
  onToggle: (next: T) => void;
  label: string;
  className?: string;
}) {
  return (
    <div
      role="toolbar"
      aria-label={label}
      className={cn("flex flex-wrap gap-1", className)}
    >
      {options.map((option) => {
        const active = values.includes(option.id);
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onToggle(option.id)}
            aria-pressed={active}
            className={cn(
              "min-h-9 border px-3 font-mono text-meta uppercase tracking-label transition-colors duration-standard",
              active
                ? "border-brand/40 bg-brand/15 text-brand"
                : "border-border text-text-3 hover:border-border-strong hover:text-text-1",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

/** A plain text chip for read-only labels (no interaction). */
export function Chip({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center border border-border px-2 py-0.5 font-mono text-meta uppercase tracking-label text-text-3",
        className,
      )}
    >
      {children}
    </span>
  );
}
