import { Link } from "react-router-dom";
import { OutcomeRow, OutcomeSplit } from "@/components/data/outcome";
import { ButtonLink } from "@/components/ui/button-link";
import type { MarketSummary } from "@/features/market/hooks";
import { useLocale } from "@/lib/locale-provider";

function split(market: MarketSummary) {
  const total = market.backPool + market.fadePool;
  const backBps =
    total === 0n ? 5000 : Number((market.backPool * 10000n) / total);
  return {
    back: Math.round(backBps / 100),
    fade: 100 - Math.round(backBps / 100),
  };
}

/**
 * Polymarket-style market card: the question owns the full width, then the two
 * outcome probabilities sit under it. The question is never squeezed next to a
 * number, because a truncated question is unreadable.
 */
export function MarketCard({ market }: { market: MarketSummary }) {
  const { t } = useLocale();
  const { back, fade } = split(market);
  const total = market.backPool + market.fadePool;

  return (
    <article className="flex flex-col border border-border bg-surface-1 transition-colors duration-emphasis hover:border-brand/40">
      <Link to={`/market/${market.address}`} className="block flex-1 p-5">
        <h3 className="line-clamp-3 min-h-14 text-narrative font-semibold text-text-1">
          {market.narrative}
        </h3>
        <div className="mt-5 grid gap-3">
          <OutcomeRow
            label={t("market.back")}
            percent={back}
            tone="back"
            bar="back"
          />
          <OutcomeRow
            label={t("market.fade")}
            percent={fade}
            tone="fade"
            bar="fade"
          />
        </div>
      </Link>
      <div className="flex items-center justify-between gap-4 border-t border-border px-5 py-3 font-mono text-meta text-text-3">
        <span>
          {t("feed.volume")} {formatPool(total)}
        </span>
        <span className="truncate">{shortAddr(market.creator)}</span>
      </div>
    </article>
  );
}

/**
 * The featured market: one market at full width with its split shown large,
 * mirroring Polymarket's hero card above the grid.
 */
export function FeaturedMarket({ market }: { market: MarketSummary }) {
  const { t } = useLocale();
  const total = market.backPool + market.fadePool;

  return (
    <article className="border border-border bg-surface-1">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-6 py-3 font-mono text-meta uppercase tracking-eyebrow">
        <span className="text-brand">{t("feed.featured")}</span>
        <span className="text-text-3">{market.state}</span>
      </div>
      <div className="grid gap-8 p-6 lg:grid-cols-[minmax(0,1fr)_minmax(300px,380px)] lg:items-center">
        <div className="min-w-0">
          <h3 className="text-page-title font-semibold text-text-1">
            {market.narrative}
          </h3>
          <p className="mt-4 font-mono text-meta text-text-3">
            {t("feed.volume")} {formatPool(total)} · {t("feed.endsIn")}{" "}
            {formatEnd(market.bettingEndsAt)}
          </p>
          <ButtonLink
            to={`/market/${market.address}`}
            variant="primary"
            className="mt-6"
          >
            {t("feed.readThesisLong")}
          </ButtonLink>
        </div>
        <OutcomeSplit
          back={market.backPool}
          fade={market.fadePool}
          size="title"
        />
      </div>
    </article>
  );
}

function formatPool(value: bigint) {
  const whole = value / 10n ** 18n;
  if (whole >= 1000n) return `$${(Number(whole) / 1000).toFixed(1)}K`;
  return `$${whole.toString()}`;
}

function formatEnd(value: bigint) {
  return new Date(Number(value) * 1000).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function shortAddr(value: string) {
  return `${value.slice(0, 6)}…${value.slice(-4)}`;
}
