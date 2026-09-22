import { DataRow, Metric, MetricGroup } from "@/components/data";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { ThesisSpecV2 } from "@/lib/api/generated/model/thesisSpecV2";
import { formatBps } from "@/lib/format";
import { useLocale } from "@/lib/locale-provider";

export function ThesisSpec({ spec }: { spec: ThesisSpecV2 }) {
  const { t } = useLocale();
  return (
    <Card>
      <CardHeader>
        <h2 className="text-narrative font-semibold">{t("spec.title")}</h2>
        <span className="ml-auto font-mono text-meta text-brand">
          v{spec.version}
        </span>
      </CardHeader>
      <CardContent className="pt-5">
        <dl className="grid gap-3">
          <DataRow label={t("spec.thesis")}>{spec.narrative}</DataRow>
          <DataRow label={t("spec.reference")}>
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
