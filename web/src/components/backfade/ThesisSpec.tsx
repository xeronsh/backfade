import { DataRow, MetricGroup } from "@/components/data";
import { Card, CardFooter } from "@/components/ui/card";
import type { ChainThesisSpec } from "@/features/market/hooks";
import type { ThesisSpec as GeneratedThesisSpec } from "@/lib/api/generated/model/thesisSpec";
import { formatBps, shortAddress } from "@/lib/format";

type ThesisSpecData = GeneratedThesisSpec | ChainThesisSpec;

function ChainThesisSpecView({ spec }: { spec: ChainThesisSpec }) {
  return (
    <Card>
      <p className="mb-4 font-mono text-meta font-semibold uppercase tracking-eyebrow text-brand">
        Onchain ThesisSpec
      </p>
      <p className="text-narrative font-semibold">{spec.narrative}</p>
      <MetricGroup className="mt-5" columns={4} layout="rows">
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
      <CardFooter className="text-sm text-text-2">
        Basket, benchmark, weights, hurdle, and narrative are read from the
        deployed market contract.
      </CardFooter>
    </Card>
  );
}

function CompilerThesisSpecView({ spec }: { spec: GeneratedThesisSpec }) {
  return (
    <Card>
      <p className="mb-4 font-mono text-meta font-semibold uppercase tracking-eyebrow text-brand">
        Machine financial claim
      </p>
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
      <CardFooter className="text-sm text-text-2">
        Risk: <span className="text-text-1">{spec.risk.level}</span>.{" "}
        {spec.risk.warnings.join(" ")}
      </CardFooter>
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
