import { Card } from "@/components/ui/card";
import type { ChainThesisSpec } from "@/features/market/hooks";
import type { ThesisSpec as GeneratedThesisSpec } from "@/lib/api/generated/model/thesisSpec";
import { formatBps, shortAddress } from "@/lib/format";

type ThesisSpecData = GeneratedThesisSpec | ChainThesisSpec;

function ChainThesisSpecView({ spec }: { spec: ChainThesisSpec }) {
  return (
    <Card>
      <p className="mb-4 text-xs font-semibold uppercase tracking-[0.08em] text-brand">
        Onchain ThesisSpec
      </p>
      <p className="text-lg font-semibold leading-7">{spec.narrative}</p>
      <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-4">
        <div>
          <dt className="text-xs text-text-3">Basket</dt>
          <dd className="mt-1 text-text-1">
            {spec.basket
              .map(
                (asset) => `${asset.symbol} ${Number(asset.weightBps) / 100}%`,
              )
              .join(" · ")}
          </dd>
          <p className="mt-1 text-xs text-text-3">
            {spec.basket.map((asset) => shortAddress(asset.feed)).join(" · ")}
          </p>
        </div>
        <div>
          <dt className="text-xs text-text-3">Benchmark</dt>
          <dd className="mt-1 text-text-1">{spec.benchmark.symbol}</dd>
          <p className="mt-1 text-xs text-text-3">
            {shortAddress(spec.benchmark.feed)}
          </p>
        </div>
        <div>
          <dt className="text-xs text-text-3">Hurdle</dt>
          <dd className="mt-1 font-mono text-text-1" data-financial>
            {formatBps(spec.hurdleBps)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-text-3">Duration</dt>
          <dd className="mt-1 font-mono text-text-1" data-financial>
            {(Number(spec.durationSeconds) / 86_400).toFixed(1)} days
          </dd>
        </div>
      </dl>
      <p className="mt-5 border-t border-border pt-4 text-sm text-text-2">
        Basket, benchmark, weights, hurdle, and narrative are read from the
        deployed market contract.
      </p>
    </Card>
  );
}

function CompilerThesisSpecView({ spec }: { spec: GeneratedThesisSpec }) {
  return (
    <Card>
      <p className="mb-4 text-xs font-semibold uppercase tracking-[0.08em] text-brand">
        Machine financial claim
      </p>
      <p className="text-lg font-semibold leading-7">{spec.human_condition}</p>
      <dl className="mt-5 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
        <div>
          <dt className="text-xs text-text-3">Basket</dt>
          <dd className="mt-1 text-text-1">
            {spec.basket
              .map((asset) => `${asset.symbol} ${asset.weight_bps / 100}%`)
              .join(" · ")}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-text-3">Benchmark</dt>
          <dd className="mt-1 text-text-1">{spec.benchmark.symbol}</dd>
        </div>
        <div>
          <dt className="text-xs text-text-3">Hurdle</dt>
          <dd className="mt-1 font-mono text-text-1" data-financial>
            {formatBps(spec.hurdle_bps)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-text-3">Duration</dt>
          <dd className="mt-1 font-mono text-text-1" data-financial>
            {spec.duration_days} days
          </dd>
        </div>
      </dl>
      <p className="mt-5 border-t border-border pt-4 text-sm text-text-2">
        Risk: <span className="text-text-1">{spec.risk.level}</span>.{" "}
        {spec.risk.warnings.join(" ")}
      </p>
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
