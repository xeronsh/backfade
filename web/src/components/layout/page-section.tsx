import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageSectionProps {
  title?: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  /** Renders a rule above the section instead of relying on a wrapping Card. */
  divided?: boolean;
}

/**
 * The semantic `<section>` for a page. Routes compose PageSections and fill
 * them with primitives; they do not invent their own headings or spacing.
 */
export function PageSection({
  title,
  description,
  icon,
  action,
  children,
  className,
  divided = false,
}: PageSectionProps) {
  const headingId =
    typeof title === "string" && title.length > 0
      ? `section-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`
      : undefined;
  return (
    <section
      aria-labelledby={headingId}
      className={cn(divided && "border-y border-border py-6", className)}
    >
      {title ? (
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2
              id={headingId}
              className="flex items-center gap-2 text-narrative font-semibold text-text-1"
            >
              {icon}
              {title}
            </h2>
            {description ? (
              <p className="mt-1 text-meta text-text-3">{description}</p>
            ) : null}
          </div>
          {action}
        </div>
      ) : null}
      {children}
    </section>
  );
}
