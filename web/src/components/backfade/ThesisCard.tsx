import { ArrowUpRight, ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";
import { ConvictionBar } from "@/components/backfade/ConvictionBar";
import { MarketStatus } from "@/components/backfade/MarketStatus";
import { Card } from "@/components/ui/card";
import type { MarketSummary } from "@/features/market/hooks";
import {
  formatAmount,
  formatBps,
  formatDate,
  shortAddress,
} from "@/lib/format";

export function ThesisCard({ market }: { market: MarketSummary }) {
  return (
    <Card className="thesis-card group ui-card--interactive">
      <div className="thesis-card__meta mb-4">
        <Link to={`/profile/${market.creator}`} className="hover:text-text-1">
          {shortAddress(market.creator)}
        </Link>
        <MarketStatus state={market.state} />
      </div>
      <Link to={`/market/${market.address}`} className="block">
        <h2 className="thesis-card__title line-clamp-2 text-lg font-semibold leading-7">
          {market.narrative}
        </h2>
        <p className="mt-2 line-clamp-2 text-sm text-text-2">
          Basket must outperform its benchmark by {formatBps(market.hurdleBps)}{" "}
          before oracle settlement.
        </p>
        <div className="mt-5">
          <ConvictionBar back={market.backPool} fade={market.fadePool} />
        </div>
        <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-border pt-4 text-xs">
          <div>
            <dt className="text-text-3">Creator conviction</dt>
            <dd className="mt-1 font-mono text-text-1" data-financial>
              {formatAmount(market.creatorBond)} USDG
            </dd>
          </div>
          <div>
            <dt className="text-text-3">Resolves</dt>
            <dd className="mt-1 text-text-1" data-financial>
              {formatDate(market.resolvesAt)}
            </dd>
          </div>
        </dl>
      </Link>
      <details className="thesis-disclosure">
        <summary>
          <span>View machine claim</span>
          <ChevronDown size={14} aria-hidden="true" />
        </summary>
        <div className="thesis-disclosure__body">
          <p>
            Basket must outperform its benchmark by{" "}
            {formatBps(market.hurdleBps)} before oracle settlement.
          </p>
          <dl>
            <div>
              <dt>Bond</dt>
              <dd data-financial>{formatAmount(market.creatorBond)} USDG</dd>
            </div>
            <div>
              <dt>Resolves</dt>
              <dd data-financial>{formatDate(market.resolvesAt)}</dd>
            </div>
            <div>
              <dt>Contract</dt>
              <dd data-mono>{shortAddress(market.address)}</dd>
            </div>
          </dl>
        </div>
      </details>
      <div className="thesis-card__address mt-4 flex items-center justify-end text-xs">
        <span data-mono>{shortAddress(market.address)}</span>
        <ArrowUpRight size={14} className="ml-1" aria-hidden="true" />
      </div>
    </Card>
  );
}
