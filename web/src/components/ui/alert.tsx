import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

const tones = {
  error: { container: "border-fade bg-fade-soft", label: "text-fade" },
  warning: { container: "border-warning bg-surface-2", label: "text-warning" },
  info: { container: "border-info bg-surface-2", label: "text-info" },
  success: { container: "border-back bg-back-soft", label: "text-back" },
} as const;

export interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  tone?: keyof typeof tones;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
}

/**
 * The single way to report a read, compiler, wallet, or transaction failure.
 * Answers both "what happened?" and "what can I do?". State is carried by the
 * tone colour and the title text, not by a leading glyph.
 */
export function Alert({
  tone = "error",
  title,
  description,
  action,
  className,
  children,
  ...props
}: AlertProps) {
  const style = tones[tone];
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "rounded-panel border px-5 py-6",
        style.container,
        className,
      )}
      {...props}
    >
      <p
        className={cn(
          "font-mono text-meta uppercase tracking-eyebrow",
          style.label,
        )}
      >
        {title}
      </p>
      {description ? (
        <p className="mt-3 max-w-xl text-body text-text-2">{description}</p>
      ) : null}
      {children}
      {action ? (
        <div className="mt-5 flex flex-wrap gap-3">{action}</div>
      ) : null}
    </div>
  );
}
