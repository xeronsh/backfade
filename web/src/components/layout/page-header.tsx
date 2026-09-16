import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  eyebrow?: ReactNode;
  title: ReactNode;
  lede?: ReactNode;
  actions?: ReactNode;
  aside?: ReactNode;
  className?: string;
}

/**
 * Page identity: eyebrow, title at the Design System's 32/38, lede at 15/22.
 * Anything bigger than this belongs to editorial moments the Design System
 * does not grant to routes.
 */
export function PageHeader({
  eyebrow,
  title,
  lede,
  actions,
  aside,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "grid gap-8 border-b border-border pb-10 lg:grid-cols-[minmax(0,1fr)_minmax(240px,320px)] lg:items-end",
        className,
      )}
    >
      <div>
        {eyebrow ? (
          <p className="flex items-center gap-2 font-mono text-meta uppercase tracking-eyebrow text-brand">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-3 text-page-title font-semibold text-text-1">
          {title}
        </h1>
        {lede ? (
          <p className="mt-4 max-w-2xl text-body text-text-2">{lede}</p>
        ) : null}
        {actions ? (
          <div className="mt-7 flex flex-wrap items-center gap-3">
            {actions}
          </div>
        ) : null}
      </div>
      {aside ? <div className="min-w-0">{aside}</div> : null}
    </header>
  );
}
