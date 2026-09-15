export function ConvictionBar({ back, fade }: { back: bigint; fade: bigint }) {
  const total = back + fade;
  const backBps = total === 0n ? 5000 : Number((back * 10000n) / total);
  return (
    <div className="space-y-2">
      <meter
        className="sr-only"
        min={0}
        max={100}
        value={backBps / 100}
        aria-label={`BACK ${backBps / 100}% and FADE ${(10000 - backBps) / 100}%`}
      />
      <div className="flex justify-between text-sm font-medium">
        <span className="text-back">BACK {backBps / 100}%</span>
        <span className="text-fade">FADE {(10000 - backBps) / 100}%</span>
      </div>
      <div
        className="flex h-2 overflow-hidden rounded-full bg-fade-soft"
        aria-hidden="true"
      >
        <div
          className="bg-back transition-[width] duration-220 ease-standard"
          style={{ width: `${backBps / 100}%` }}
        />
      </div>
    </div>
  );
}
