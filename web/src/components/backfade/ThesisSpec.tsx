import { DataRow, Metric, MetricGroup } from "@/components/data";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { ThesisSpecV2 } from "@/lib/api/generated/model/thesisSpecV2";
import { formatBps } from "@/lib/format";

export function ThesisSpec({ spec }: { spec: ThesisSpecV2 }) {
  return (
    <Card>
      <CardHeader>
        <h2 className="text-narrative font-semibold">Thesis structure</h2>
        <span className="ml-auto font-mono text-meta text-brand">
          v{spec.version}
        </span>
      </CardHeader>
      <CardContent className="pt-5">
        <dl className="grid gap-3">
          <DataRow label="Thesis">{spec.narrative}</DataRow>
          <DataRow label="Reference">
            <span className="font-semibold">{spec.reference.symbol}</span>
            <span className="ml-2 text-text-3">({spec.reference_origin})</span>
          </DataRow>
        </dl>
        <div className="mt-5">
          <MetricGroup columns={2}>
            {spec.basket.map((asset) => (
              <Metric
                key={asset.symbol}
                label={asset.symbol}
                value={formatBps(asset.weight_bps)}
              />
            ))}
          </MetricGroup>
        </div>
      </CardContent>
    </Card>
  );
}
