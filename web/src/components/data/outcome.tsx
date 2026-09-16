import { useLocale } from "@/lib/locale-provider";
import { cn } from "@/lib/utils";

/** Only the documented type roles are allowed here (gate rule E6). */
const sizes = {
  narrative: "text-narrative",
  title: "text-page-title",
} as const;

/**
 * The signature prediction-market readout: one labelled outcome with the
 * probability set large and right-aligned, so the number is the thing the eye
 * lands on. Replaces a paragraph-style "BACK x% / FADE y%" line.
 */
export function OutcomeRow({
  label,
  percent,
  tone = "neutral",
  size = "narrative",
  bar,
  className,
}: {
  label: string;
  percent: number;
  tone?: "back" | "fade" | "neutral";
  size?: keyof typeof sizes;
  /** Renders a filled proportion bar under the row. */
  bar?: "back" | "fade";
  className?: string;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <div className="flex items-baseline justify-between gap-4">
        <span
          className={cn(
            "font-mono uppercase tracking-label text-meta",
            tone === "back" && "text-back",
            tone === "fade" && "text-fade",
            tone === "neutral" && "text-text-3",
          )}
        >
          {label}
        </span>
        <span
          className={cn(
            "font-mono font-semibold tabular-nums",
            sizes[size],
            tone === "back" && "text-back",
            tone === "fade" && "text-fade",
            tone === "neutral" && "text-text-1",
          )}
          data-financial
        >
          {percent}%
        </span>
      </div>
      {bar ? (
        <span
          aria-hidden="true"
          className={cn(
            "mt-2 block h-1",
            bar === "back" ? "bg-back" : "bg-fade",
          )}
          style={{ width: `${percent}%` }}
        />
      ) : null}
    </div>
  );
}

/**
 * The binary split of a market: BACK and FADE as two outcome rows plus one
 * shared axis. BACK and FADE are always named in text, per the Design System.
 */
export function OutcomeSplit({
  back,
  fade,
  size = "narrative",
  className,
}: {
  back: bigint;
  fade: bigint;
  size?: keyof typeof sizes;
  className?: string;
}) {
  const { t } = useLocale();
  const total = back + fade;
  const backBps = total === 0n ? 5000 : Number((back * 10000n) / total);
  const backPercent = Math.round(backBps / 100);
  const fadePercent = 100 - backPercent;

  return (
    <div className={cn("space-y-3", className)}>
      <div
        className="conviction-bar__track"
        aria-label={`${t("market.back")} ${backPercent}%, ${t("market.fade")} ${fadePercent}%`}
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
      <div className="grid gap-2">
        <OutcomeRow
          label={t("market.back")}
          percent={backPercent}
          tone="back"
          size={size}
        />
        <OutcomeRow
          label={t("market.fade")}
          percent={fadePercent}
          tone="fade"
          size={size}
        />
      </div>
    </div>
  );
}
