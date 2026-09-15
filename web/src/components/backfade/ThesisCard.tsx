import { ArrowUpRight } from "lucide-react";
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
    <Card className="group transition-colors hover:border-border-strong">
      <div className="mb-3 flex items-center justify-between gap-3 text-xs text-text-3">
        <Link to={`/profile/${market.creator}`} className="hover:text-text-1">
          {shortAddress(market.creator)}
        </Link>
        <MarketStatus state={market.state} />
      </div>
      <Link to={`/market/${market.address}`} className="block">
        <h2 className="line-clamp-2 text-lg font-semibold leading-7 group-hover:text-brand">
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
      <div className="mt-4 flex items-center justify-end text-xs text-text-3">
        <span data-mono>{shortAddress(market.address)}</span>
        <ArrowUpRight size={14} className="ml-1" aria-hidden="true" />
      </div>
    </Card>
  );
}
