import { useState } from "react";
import { Link } from "react-router-dom";
import { Metric, MetricGroup } from "@/components/data";
import { PageContainer, PageHeader, PageSection } from "@/components/layout";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useLeaderboard } from "@/features/thesis/hooks";
import type { LeaderboardMode } from "@/features/thesis/stats";
import {
  formatAmount,
  formatBps,
  formatError,
  formatSignedAmount,
  shortAddress,
} from "@/lib/format";

const modes: Array<{ value: LeaderboardMode; label: string }> = [
  { value: "overall", label: "Overall" },
  { value: "creators", label: "Creators" },
  { value: "faders", label: "Faders" },
];

export default function Leaderboard() {
  const [mode, setMode] = useState<LeaderboardMode>("overall");
  const query = useLeaderboard(mode);

  return (
    <PageContainer>
      <PageHeader
        eyebrow="DISCOVERY"
        title="Realized P&L leaderboard"
        lede="Find capital-backed track records. Ranking is a discovery surface, not proof of human identity."
        actions={
          <fieldset
            className="flex flex-wrap gap-2"
            aria-label="Leaderboard mode"
          >
            {modes.map((item) => (
              <Button
                key={item.value}
                variant={mode === item.value ? "primary" : "default"}
                size="sm"
                aria-pressed={mode === item.value}
                onClick={() => setMode(item.value)}
              >
                {item.label}
              </Button>
            ))}
          </fieldset>
        }
      />
      <div className="mt-8">
        <PageSection
          title="All time"
          description="Sorted by realized net P&L. No rank rewards."
        >
          {query.error ? (
            <Alert
              title="Leaderboard unavailable"
              description={formatError(query.error)}
            />
          ) : null}
          {query.isLoading ? (
            <p className="text-body text-text-2">Loading realized results…</p>
          ) : null}
          {!query.isLoading && !query.error && query.data?.length === 0 ? (
            <Card>
              <p className="text-body text-text-2">
                No resolved capital activity yet.
              </p>
            </Card>
          ) : null}
          <div className="grid gap-3">
            {query.data?.map((entry, index) => (
              <Card key={entry.address}>
                <CardHeader className="items-start">
                  <span className="font-mono text-meta text-text-3">
                    #{index + 1}
                  </span>
                  <Link
                    to={`/profile/${entry.address}`}
                    className="font-semibold text-text-1 hover:text-brand"
                  >
                    {shortAddress(entry.address)}
                  </Link>
                  <span
                    className="ml-auto font-mono font-semibold text-brand"
                    data-financial
                  >
                    {formatSignedAmount(entry.pnl)} USDG
                  </span>
                </CardHeader>
                <CardContent className="pt-4">
                  <MetricGroup columns={4}>
                    <Metric label="ROI" value={formatBps(entry.roiBps)} />
                    <Metric
                      label="Matched Capital"
                      value={`${formatAmount(entry.matchedCapital)} USDG`}
                    />
                    <Metric label="Resolved" value={entry.resolvedPositions} />
                    <Metric
                      label="Counterparties"
                      value={entry.counterparties}
                    />
                  </MetricGroup>
                </CardContent>
              </Card>
            ))}
          </div>
        </PageSection>
      </div>
    </PageContainer>
  );
}
