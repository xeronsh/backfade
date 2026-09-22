import type { ReactNode } from "react";
import { formatAmount, formatDate, shortAddress } from "@/lib/format";
import { useLocale } from "@/lib/locale-provider";
import { cn } from "@/lib/utils";

/** A USDG amount: mono, tabular, always carrying its unit. */
export function Amount({
  value,
  unit = "USDG",
  className,
}: {
  value: bigint | undefined;
  unit?: string | null;
  className?: string;
}) {
  return (
    <span className={cn("font-mono tabular-nums", className)} data-financial>
      {formatAmount(value)}
      {unit ? ` ${unit}` : null}
    </span>
  );
}

/** A 20-byte address, shortened unless `full` is set. */
export function Address({
  value,
  full = false,
  className,
}: {
  value: string;
  full?: boolean;
  className?: string;
}) {
  return (
    <span className={cn("font-mono", full && "break-all", className)} data-mono>
      {full ? value : shortAddress(value)}
    </span>
  );
}

/** A chain timestamp in the reader's locale. */
export function Timestamp({
  value,
  className,
}: {
  value: bigint | number | undefined;
  className?: string;
}) {
  const { locale } = useLocale();
  return (
    <span className={cn("tabular-nums", className)} data-financial>
      {formatDate(value, locale)}
    </span>
  );
}

/** A short inline figure — bps, percentages, round ids, block numbers. */
export function Figure({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span className={cn("font-mono tabular-nums", className)} data-financial>
      {children}
    </span>
  );
}
