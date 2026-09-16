import { formatBps } from "@/lib/format";
import { cn } from "@/lib/utils";

export function NarrativeAlpha({ value }: { value: bigint }) {
  const positive = value >= 0n;
  return (
    <div className="border-y border-border py-4">
      <p className="font-mono text-meta font-semibold uppercase tracking-eyebrow text-text-3">
        Narrative alpha
      </p>
      <p
        className={cn(
          "mt-1 font-mono text-narrative font-semibold tabular-nums",
          positive ? "text-back" : "text-fade",
        )}
        data-financial
      >
        {positive ? "+" : ""}
        {formatBps(value)}
      </p>
    </div>
  );
}
