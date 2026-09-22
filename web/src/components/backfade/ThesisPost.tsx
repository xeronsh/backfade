import { Link } from "react-router-dom";
import { Metric, MetricGroup } from "@/components/data";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { ThesisDetail } from "@/features/thesis/types";
import { formatAmount, formatBps, shortAddress } from "@/lib/format";
import { useLocale } from "@/lib/locale-provider";

function isResolved(thesis: ThesisDetail) {
  return thesis.state === "SETTLED" || thesis.state === "CANCELLED";
}

export function ThesisPost({ thesis }: { thesis: ThesisDetail }) {
  const { t, stateLabel } = useLocale();
  const resolved = isResolved(thesis);
  const faded = thesis.challengers.reduce(
    (total, challenger) => total + challenger.stake,
    0n,
  );

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
          <span>{stateLabel(thesis.state)}</span>
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
            label={resolved ? t("common.realizedAlpha") : t("thread.liveAlpha")}
            value={formatBps(
              resolved ? thesis.realizedAlphaBps : (thesis.liveAlphaBps ?? 0n),
            )}
            tone="brand"
          />
          <Metric
            label={t("common.creatorConviction")}
            value={`${formatAmount(thesis.creatorBond)} USDG`}
          />
          <Metric
            label={t("common.matched")}
            value={`${formatAmount(thesis.matchedConviction)} USDG`}
          />
          <Metric
            label={t("common.openBounty")}
            value={`${formatAmount(thesis.openBounty)} USDG`}
          />
        </MetricGroup>
        <div className="mt-5 flex items-center justify-between gap-3 border-t border-border pt-4">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-meta">
            <span className="text-text-3">
              <span className="font-mono text-text-1">
                {thesis.challengers.length}
              </span>{" "}
              {thesis.challengers.length === 1
                ? t("card.challengeCountOne", {
                    count: thesis.challengers.length,
                  })
                : t("card.challengeCount", {
                    count: thesis.challengers.length,
                  })}
            </span>
            <span className="text-text-3">
              <span className="font-mono text-fade">
                {formatAmount(faded)}
              </span>{" "}
              USDG {t("card.faded")}
            </span>
          </div>
          <Link
            to={`/thesis/${thesis.address}`}
            className="font-mono text-meta font-semibold uppercase tracking-label text-brand hover:text-brand-hover"
          >
            {thesis.state === "OPEN" ? t("card.fade") : t("card.openThread")}
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
