export function ConvictionBar({ back, fade }: { back: bigint; fade: bigint }) {
  const total = back + fade;
  const backBps = total === 0n ? 5000 : Number((back * 10000n) / total);
  const backPercent = backBps / 100;
  const fadePercent = 100 - backPercent;

  return (
    <div className="conviction-bar space-y-2">
      <meter
        className="sr-only"
        min={0}
        max={100}
        value={backPercent}
        aria-label={`BACK ${backPercent}% and FADE ${fadePercent}%`}
      />
      <div className="flex justify-between text-body font-medium">
        <span className="text-fade">FADE {fadePercent}%</span>
        <span className="text-back">BACK {backPercent}%</span>
      </div>
      <div
        className="conviction-bar__track"
        aria-label={`Conviction split: ${fadePercent}% FADE, ${backPercent}% BACK`}
        role="img"
      >
        <div
          className="conviction-bar__fade"
          style={{ width: `${fadePercent}%` }}
        />
        <div
          className="conviction-bar__back"
          style={{ width: `${backPercent}%` }}
        />
        <span
          className="conviction-bar__marker"
          style={{ left: `${fadePercent}%` }}
        />
      </div>
    </div>
  );
}
