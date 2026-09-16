import { Collapsible as BaseCollapsible } from "@base-ui/react/collapsible";
import { ChevronDown } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * One disclosure primitive for the whole product: Base UI focus management,
 * Escape handling, and a chevron that rotates through the shared 160ms token.
 * Replaces ad-hoc `<details>/<summary>` markup.
 */
export function Collapsible({
  className,
  ...props
}: ComponentProps<typeof BaseCollapsible.Root>) {
  return <BaseCollapsible.Root className={cn(className)} {...props} />;
}

export function CollapsibleTrigger({
  className,
  children,
  ...props
}: ComponentProps<typeof BaseCollapsible.Trigger> & { children: ReactNode }) {
  return (
    <BaseCollapsible.Trigger
      className={cn(
        "group flex min-h-11 w-full items-center justify-between gap-3 font-mono text-meta uppercase tracking-label text-text-3 transition-colors duration-standard hover:text-brand data-[panel-open]:text-brand",
        className,
      )}
      {...props}
    >
      <span>{children}</span>
      <ChevronDown
        size={14}
        aria-hidden="true"
        className="transition-transform duration-standard group-data-[panel-open]:rotate-180"
      />
    </BaseCollapsible.Trigger>
  );
}

export function CollapsiblePanel({
  className,
  ...props
}: ComponentProps<typeof BaseCollapsible.Panel>) {
  return (
    <BaseCollapsible.Panel
      className={cn("pt-3 text-meta leading-5 text-text-3", className)}
      {...props}
    />
  );
}
