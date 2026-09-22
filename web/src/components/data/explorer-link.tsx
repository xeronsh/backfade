import type { ReactNode } from "react";
import { config } from "@/lib/config";
import { cn } from "@/lib/utils";

type ExplorerKind = "address" | "tx" | "block";

/**
 * Every onchain value the interface shows — an address, a transaction, a block —
 * is checkable against the explorer rather than trusted because it is on screen.
 * One component so the link target and the tab safety stay in a single place.
 */
export function ExplorerLink({
  kind,
  value,
  children,
  className,
  title,
}: {
  kind: ExplorerKind;
  value: string;
  children: ReactNode;
  className?: string;
  title?: string;
}) {
  return (
    <a
      href={`${config.explorerUrl}/${kind}/${value}`}
      target="_blank"
      rel="noreferrer noopener"
      title={title}
      className={cn(
        "transition-colors duration-standard hover:text-brand",
        className,
      )}
    >
      {children}
    </a>
  );
}
