import { formatBps } from "@/lib/format";

export function NarrativeAlpha({ value }: { value: bigint }) {
  const positive = value >= 0n;
  return (
    <div className="alpha-readout border-y border-border py-4">
      <p className="font-mono text-xs font-semibold uppercase tracking-[0.12em] text-text-3">
        Narrative Alpha
      </p>
      <p
        className={`mt-1 font-mono text-2xl font-semibold ${positive ? "text-back" : "text-fade"}`}
        data-financial
      >
        {positive ? "+" : ""}
        {formatBps(value)}
      </p>
    </div>
  );
}
