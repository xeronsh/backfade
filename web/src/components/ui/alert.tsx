import { CircleAlert, CircleCheck, Info, TriangleAlert } from "lucide-react";
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

const tones = {
  error: {
    container: "border-fade bg-fade-soft",
    label: "text-fade",
    icon: CircleAlert,
  },
  warning: {
    container: "border-warning bg-surface-2",
    label: "text-warning",
    icon: TriangleAlert,
  },
  info: {
    container: "border-info bg-surface-2",
    label: "text-info",
    icon: Info,
  },
  success: {
    container: "border-back bg-back-soft",
    label: "text-back",
    icon: CircleCheck,
  },
} as const;

export interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  tone?: keyof typeof tones;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
}

/**
 * The single way to report a read, compiler, wallet, or transaction failure.
 * Answers both "what happened?" and "what can I do?".
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
  const Icon = style.icon;
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
          "flex items-center gap-2 font-mono text-meta uppercase tracking-eyebrow",
          style.label,
        )}
      >
        <Icon size={15} aria-hidden="true" />
        {title}
      </p>
      {description ? (
        <p className="mt-3 max-w-xl text-sm leading-5 text-text-2">
          {description}
        </p>
      ) : null}
      {children}
      {action ? (
        <div className="mt-5 flex flex-wrap gap-3">{action}</div>
      ) : null}
    </div>
  );
}
