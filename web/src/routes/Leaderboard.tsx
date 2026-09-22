import { useState } from "react";
import { Link } from "react-router-dom";
import { Metric, MetricGroup } from "@/components/data";
import { PageContainer, PageHeader, PageSection } from "@/components/layout";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { LeaderboardMode } from "@/features/thesis/stats";
import { useLeaderboard } from "@/features/thesis/hooks";
import {
  formatAmount,
  formatBps,
  formatError,
  formatSignedAmount,
  shortAddress,
} from "@/lib/format";
import { useLocale } from "@/lib/locale-provider";

export default function Leaderboard() {
  const { t, locale } = useLocale();
  const [mode, setMode] = useState<LeaderboardMode>("overall");
  const query = useLeaderboard(mode);

  const modes: Array<{ value: LeaderboardMode; label: string }> = [
    { value: "overall", label: t("leaderboard.mode.overall") },
    { value: "creators", label: t("leaderboard.mode.creators") },
    { value: "faders", label: t("leaderboard.mode.faders") },
  ];

  return (
    <PageContainer>
      <PageHeader
        eyebrow={t("leaderboard.eyebrow")}
        title={t("leaderboard.title")}
        lede={t("leaderboard.lede")}
        actions={
          <fieldset
            className="flex flex-wrap gap-2"
            aria-label={t("leaderboard.modeLabel")}
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
          title={t("leaderboard.allTime")}
          description={t("leaderboard.sectionDescription")}
        >
          {query.error ? (
            <Alert
              title={t("leaderboard.unavailable")}
              description={formatError(query.error, locale)}
            />
          ) : null}
          {query.isLoading ? (
            <p className="text-body text-text-2">{t("leaderboard.loading")}</p>
          ) : null}
          {!query.isLoading && !query.error && query.data?.length === 0 ? (
            <Card>
              <p className="text-body text-text-2">
                {t("leaderboard.emptyBody")}
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
                    <Metric
                      label={t("leaderboard.roi")}
                      value={formatBps(entry.roiBps)}
                    />
                    <Metric
                      label={t("leaderboard.matchedCapital")}
                      value={`${formatAmount(entry.matchedCapital)} USDG`}
                    />
                    <Metric
                      label={t("leaderboard.resolved")}
                      value={entry.resolvedPositions}
                    />
                    <Metric
                      label={t("leaderboard.counterparties")}
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
