import { DataRow, MetricGroup } from "@/components/data";
import { Card, CardFooter } from "@/components/ui/card";
import type { ChainThesisSpec } from "@/features/market/hooks";
import type { ThesisSpec as GeneratedThesisSpec } from "@/lib/api/generated/model/thesisSpec";
import { formatBps, shortAddress } from "@/lib/format";
import { useLocale } from "@/lib/locale-provider";

type ThesisSpecData = GeneratedThesisSpec | ChainThesisSpec;

function ChainThesisSpecView({ spec }: { spec: ChainThesisSpec }) {
  // The page title already renders the narrative, so this card carries only the
  // terms that title does not state.
  return (
    <Card>
      <MetricGroup columns={4} layout="rows">
        <DataRow label="Basket">
          {spec.basket
            .map((asset) => `${asset.symbol} ${Number(asset.weightBps) / 100}%`)
            .join(" · ")}
          <span
            className="mt-1 block font-mono text-meta text-text-3"
            data-mono
          >
            {spec.basket.map((asset) => shortAddress(asset.feed)).join(" · ")}
          </span>
        </DataRow>
        <DataRow label="Benchmark">
          {spec.benchmark.symbol}
          <span
            className="mt-1 block font-mono text-meta text-text-3"
            data-mono
          >
            {shortAddress(spec.benchmark.feed)}
          </span>
        </DataRow>
        <DataRow label="Hurdle">
          <span className="font-mono" data-financial>
            {formatBps(spec.hurdleBps)}
          </span>
        </DataRow>
        <DataRow label="Duration">
          <span className="font-mono" data-financial>
            {(Number(spec.durationSeconds) / 86_400).toFixed(1)} days
          </span>
        </DataRow>
      </MetricGroup>
    </Card>
  );
}

function CompilerThesisSpecView({ spec }: { spec: GeneratedThesisSpec }) {
  const { t } = useLocale();
  return (
    <Card>
      <p className="text-narrative font-semibold">{spec.human_condition}</p>
      <MetricGroup className="mt-5" columns={4} layout="rows">
        <DataRow label="Basket">
          {spec.basket
            .map((asset) => `${asset.symbol} ${asset.weight_bps / 100}%`)
            .join(" · ")}
        </DataRow>
        <DataRow label="Benchmark">{spec.benchmark.symbol}</DataRow>
        <DataRow label="Hurdle">
          <span className="font-mono" data-financial>
            {formatBps(spec.hurdle_bps)}
          </span>
        </DataRow>
        <DataRow label="Duration">
          <span className="font-mono" data-financial>
            {spec.duration_days} days
          </span>
        </DataRow>
      </MetricGroup>
      {spec.risk.warnings.length > 0 ? (
        <CardFooter className="text-body text-text-2">
          {t("thesis.risk", { level: spec.risk.level })}{" "}
          {spec.risk.warnings.join(" ")}
        </CardFooter>
      ) : null}
    </Card>
  );
}

export function ThesisSpec({ spec }: { spec: ThesisSpecData }) {
  return "source" in spec ? (
    <ChainThesisSpecView spec={spec} />
  ) : (
    <CompilerThesisSpecView spec={spec} />
  );
}
