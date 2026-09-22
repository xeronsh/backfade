import { useState } from "react";
import { Link } from "react-router-dom";
import { EmptyState } from "@/components/backfade/EmptyState";
import { ThesisPost } from "@/components/backfade/ThesisPost";
import { ExplorerLink, Metric, MetricGroup } from "@/components/data";
import { PageContainer, PageSection, SplitLayout } from "@/components/layout";
import { Alert } from "@/components/ui/alert";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { FilterBar } from "@/components/ui/filter-bar";
import { useLeaderboard, useTheses } from "@/features/thesis/hooks";
import { config } from "@/lib/config";
import { formatAmount, formatError, shortAddress } from "@/lib/format";
import { useLocale } from "@/lib/locale-provider";

type Filter = "all" | "open" | "resolved";

export default function Feed() {
  const { t, locale } = useLocale();
  const [filter, setFilter] = useState<Filter>("all");
  const theses = useTheses();
  const leaderboard = useLeaderboard();
  const data = theses.data ?? [];
  const openCount = data.filter((thesis) => thesis.state === "OPEN").length;
  const visible = data.filter((thesis) => {
    if (filter === "open") return thesis.state === "OPEN";
    if (filter === "resolved")
      return thesis.state === "SETTLED" || thesis.state === "CANCELLED";
    return true;
  });

  return (
    <PageContainer>
      {theses.error ? (
        <Alert
          title={t("feed.unavailable")}
          description={formatError(theses.error, locale, t("error.chainRead"))}
        />
      ) : null}
      <SplitLayout
        main={
          <PageSection
            title={t("feed.title")}
            action={
              <FilterBar
                label={t("feed.filterLabel")}
                options={[
                  { id: "all", label: t("feed.filter.all") },
                  { id: "open", label: t("feed.filter.open") },
                  { id: "resolved", label: t("feed.filter.resolved") },
                ]}
                value={filter}
                onChange={setFilter}
              />
            }
          >
            {theses.isLoading ? (
              <p className="text-body text-text-2">{t("feed.loading")}</p>
            ) : null}
            {!theses.isLoading && !theses.error ? (
              visible.length === 0 ? (
                <EmptyState
                  title={t("feed.emptyTitle")}
                  description={t("feed.emptyBody")}
                  action={{ label: t("feed.post"), to: "/post" }}
                />
              ) : (
                <div className="grid gap-4">
                  {visible.map((thesis) => (
                    <ThesisPost key={thesis.address} thesis={thesis} />
                  ))}
                </div>
              )
            ) : null}
          </PageSection>
        }
        aside={
          <>
            <PageSection title={t("feed.network")}>
              <Card>
                <CardContent className="pt-4">
                  <MetricGroup columns={2}>
                    <Metric label={t("feed.theses")} value={data.length} />
                    <Metric
                      label={t("feed.openNow")}
                      value={openCount}
                      tone="brand"
                    />
                  </MetricGroup>
                  <dl className="mt-5 grid gap-2 border-t border-border pt-4">
                    <div className="flex items-baseline justify-between gap-3">
                      <dt className="font-mono text-meta uppercase tracking-label text-text-3">
                        {t("feed.factory")}
                      </dt>
                      <dd>
                        <ExplorerLink
                          kind="address"
                          value={config.factoryAddress}
                          title={t("common.viewOnExplorer")}
                          className="font-mono text-meta text-text-2"
                        >
                          {shortAddress(config.factoryAddress)}
                        </ExplorerLink>
                      </dd>
                    </div>
                    <div className="flex items-baseline justify-between gap-3">
                      <dt className="font-mono text-meta uppercase tracking-label text-text-3">
                        {t("feed.collateral")}
                      </dt>
                      <dd>
                        <ExplorerLink
                          kind="address"
                          value={config.collateralAddress}
                          title={t("common.viewOnExplorer")}
                          className="font-mono text-meta text-text-2"
                        >
                          {shortAddress(config.collateralAddress)}
                        </ExplorerLink>
                      </dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>
            </PageSection>
            <PageSection
              title={t("feed.trackRecords")}
              action={
                <Link
                  to="/leaderboard"
                  className="font-mono text-meta uppercase tracking-label text-brand hover:text-brand-hover"
                >
                  {t("common.viewAll")}
                </Link>
              }
            >
              <Card>
                <CardHeader>
                  <h2 className="text-narrative font-semibold">
                    {t("common.realizedPnl")}
                  </h2>
                </CardHeader>
                <CardContent className="pt-4">
                  {leaderboard.isLoading ? (
                    <p className="text-body text-text-2">
                      {t("common.loading")}
                    </p>
                  ) : null}
                  <ol className="grid gap-3">
                    {leaderboard.data?.slice(0, 5).map((entry, index) => (
                      <li
                        key={entry.address}
                        className="flex items-baseline gap-3 border-b border-border pb-3 last:border-b-0 last:pb-0"
                      >
                        <span className="font-mono text-meta text-text-3">
                          #{index + 1}
                        </span>
                        <Link
                          to={`/profile/${entry.address}`}
                          className="min-w-0 flex-1 truncate text-body text-text-1 hover:text-brand"
                        >
                          {shortAddress(entry.address)}
                        </Link>
                        <span
                          className="font-mono text-meta text-brand"
                          data-financial
                        >
                          {formatAmount(entry.pnl)} USDG
                        </span>
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>
            </PageSection>
          </>
        }
        asidePosition="sticky"
        gap="loose"
      />
    </PageContainer>
  );
}
