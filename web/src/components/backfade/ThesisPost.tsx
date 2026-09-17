import { Link } from "react-router-dom";
import { Metric, MetricGroup } from "@/components/data";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { ThesisDetail } from "@/features/thesis/types";
import { formatAmount, formatBps, shortAddress } from "@/lib/format";

function alphaLabel(thesis: ThesisDetail) {
  return thesis.state === "SETTLED" || thesis.state === "CANCELLED"
    ? "Realized Alpha"
    : "Live Alpha · indicative";
}

function alphaValue(thesis: ThesisDetail) {
  return formatBps(
    thesis.state === "SETTLED" || thesis.state === "CANCELLED"
      ? thesis.realizedAlphaBps
      : thesis.liveAlphaBps,
  );
}

export function ThesisPost({ thesis }: { thesis: ThesisDetail }) {
  return (
    <Card className="transition-colors duration-standard hover:border-border-strong">
      <CardHeader className="justify-between">
        <p className="text-meta text-text-2">
          <Link
            to={`/profile/${thesis.creator}`}
            className="font-semibold text-text-1 hover:text-brand"
          >
            {shortAddress(thesis.creator)}
          </Link>
          <span className="px-2 text-text-3">·</span>
          <span>{thesis.state}</span>
        </p>
        <Link
          to={`/thesis/${thesis.address}`}
          className="font-mono text-meta text-text-3 hover:text-brand"
        >
          {shortAddress(thesis.address)}
        </Link>
      </CardHeader>
      <CardContent className="pt-5">
        <Link to={`/thesis/${thesis.address}`} className="block">
          <p className="text-narrative font-semibold leading-snug text-text-1">
            {thesis.narrative}
          </p>
          <p className="mt-3 font-mono text-meta uppercase tracking-label text-brand">
            {thesis.basket.map((asset) => asset.symbol).join(" + ")} vs{" "}
            {thesis.reference.symbol}
          </p>
        </Link>
        <MetricGroup columns={4} className="mt-6">
          <Metric
            label={alphaLabel(thesis)}
            value={alphaValue(thesis)}
            tone="brand"
          />
          <Metric
            label="Creator Conviction"
            value={`${formatAmount(thesis.creatorBond)} USDG`}
          />
          <Metric
            label="Matched"
            value={`${formatAmount(thesis.matchedConviction)} USDG`}
          />
          <Metric
            label="Open Bounty"
            value={`${formatAmount(thesis.openBounty)} USDG`}
          />
        </MetricGroup>
        <div className="mt-5 flex items-center justify-between gap-3 border-t border-border pt-4">
          <span className="text-meta text-text-3">
            {thesis.challengers.length}{" "}
            {thesis.challengers.length === 1 ? "Challenge" : "Challenges"}
          </span>
          <Link
            to={`/thesis/${thesis.address}`}
            className="font-mono text-meta font-semibold uppercase tracking-label text-brand hover:text-brand-hover"
          >
            {thesis.state === "OPEN" ? "Fade it →" : "Open thread →"}
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
