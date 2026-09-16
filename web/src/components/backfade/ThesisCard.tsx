import { Link } from "react-router-dom";
import { ConvictionBar } from "@/components/backfade/ConvictionBar";
import { MarketStatus } from "@/components/backfade/MarketStatus";
import {
  Address,
  DataRow,
  Metric,
  MetricGroup,
  Timestamp,
} from "@/components/data";
import { Card } from "@/components/ui/card";
import {
  Collapsible,
  CollapsiblePanel,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { MarketSummary } from "@/features/market/hooks";
import { formatAmount, formatBps } from "@/lib/format";

export function ThesisCard({ market }: { market: MarketSummary }) {
  return (
    <Card className="h-full transition-colors duration-emphasis hover:border-brand/35">
      <div className="flex items-center justify-between gap-4 font-mono text-meta text-text-3">
        <Link
          to={`/profile/${market.creator}`}
          className="transition-colors duration-standard hover:text-text-1"
        >
          {market.creator.slice(0, 6)}…{market.creator.slice(-4)}
        </Link>
        <MarketStatus state={market.state} />
      </div>
      <Link to={`/market/${market.address}`} className="mt-4 block">
        <h2 className="line-clamp-2 text-narrative font-semibold transition-colors duration-standard hover:text-brand">
          {market.narrative}
        </h2>
        <p className="mt-2 line-clamp-2 text-body text-text-2">
          Basket must outperform its benchmark by {formatBps(market.hurdleBps)}{" "}
          before oracle settlement.
        </p>
        <div className="mt-5">
          <ConvictionBar back={market.backPool} fade={market.fadePool} />
        </div>
        <MetricGroup className="mt-5 border-t border-border pt-4" columns={2}>
          <Metric
            label="Creator conviction"
            value={`${formatAmount(market.creatorBond)} USDG`}
          />
          <Metric
            label="Resolves"
            value={<Timestamp value={market.resolvesAt} />}
          />
        </MetricGroup>
      </Link>
      <Collapsible className="mt-4 border-t border-border pt-2">
        <CollapsibleTrigger>View machine claim</CollapsibleTrigger>
        <CollapsiblePanel>
          <p>
            Basket must outperform its benchmark by{" "}
            {formatBps(market.hurdleBps)} before oracle settlement.
          </p>
          <MetricGroup className="mt-3" columns={3}>
            <DataRow label="Bond">
              {formatAmount(market.creatorBond)} USDG
            </DataRow>
            <DataRow label="Resolves">
              <Timestamp value={market.resolvesAt} />
            </DataRow>
            <DataRow label="Contract">
              <Address value={market.address} />
            </DataRow>
          </MetricGroup>
        </CollapsiblePanel>
      </Collapsible>
      <div className="mt-4 text-right font-mono text-meta text-text-3">
        <Address value={market.address} />
      </div>
    </Card>
  );
}
