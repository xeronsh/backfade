import { useState } from "react";
import { Link } from "react-router-dom";
import { EmptyState } from "@/components/backfade/EmptyState";
import { FeaturedMarket, MarketCard } from "@/components/backfade/MarketCard";
import { Reveal } from "@/components/backfade/Reveal";
import { Metric, MetricGroup } from "@/components/data";
import {
  PageContainer,
  PageHeader,
  PageSection,
  SplitLayout,
} from "@/components/layout";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { FilterBar } from "@/components/ui/filter-bar";
import { Skeleton } from "@/components/ui/skeleton";
import { useMarkets } from "@/features/market/hooks";
import { formatError } from "@/lib/format";
import { useLocale } from "@/lib/locale-provider";
import { stagger, staggerDelay } from "@/lib/motion";

type Filter = "all" | "open" | "resolved";

export default function Feed() {
  const { t, locale } = useLocale();
  const [filter, setFilter] = useState<Filter>("all");
  const markets = useMarkets();
  const data = markets.data ?? [];
  const openMarkets = data.filter((market) => market.state === "OPEN").length;

  const visible = data.filter((market) => {
    if (filter === "open") return market.state === "OPEN";
    if (filter === "resolved")
      return market.state === "PROVEN" || market.state === "FAILED";
    return true;
  });
  // Promote an open market to the hero slot; a closed or cancelled market makes
  // a poor headline. The hero is removed from the grid so it never repeats.
  const featured =
    visible.find((market) => market.state === "OPEN") ?? visible[0];
  const rest = visible.filter((market) => market !== featured);

  const filters: Array<{ id: Filter; label: string }> = [
    { id: "all", label: t("feed.filterAll") },
    { id: "open", label: t("feed.filterOpen") },
    { id: "resolved", label: t("feed.filterResolved") },
  ];

  return (
    <PageContainer>
      {markets.isLoading ? (
        <div role="status" aria-label={t("feed.loading")}>
          <Skeleton className="h-40" />
        </div>
      ) : null}

      {markets.error ? (
        <Alert
          title={t("feed.readFailure")}
          description={formatError(
            markets.error,
            locale,
            t("feed.chainReadsFailed"),
          )}
          action={
            <Button size="sm" onClick={() => void markets.refetch()}>
              {t("feed.retry")}
            </Button>
          }
        />
      ) : null}

      {!markets.isLoading && !markets.error ? (
        <>
          <PageHeader
            title={t("feed.title")}
            lede={t("feed.lede")}
            actions={<ButtonLink to="/create">{t("feed.create")}</ButtonLink>}
            aside={
              <MetricGroup columns={2}>
                <Metric label={t("feed.indexed")} value={data.length} />
                <Metric
                  label={t("feed.openNow")}
                  value={openMarkets}
                  tone="back"
                />
              </MetricGroup>
            }
          />

          {featured ? (
            <div className="mt-10">
              <Reveal>
                <FeaturedMarket market={featured} />
              </Reveal>
            </div>
          ) : null}

          <div className="mt-10">
            <SplitLayout
              main={
                <PageSection
                  title={t("feed.browse")}
                  action={
                    <FilterBar
                      label={t("feed.browse")}
                      options={filters}
                      value={filter}
                      onChange={setFilter}
                    />
                  }
                >
                  {visible.length === 0 ? (
                    <EmptyState
                      title={t("feed.emptyTitle")}
                      description={t("feed.emptyBody")}
                      action={{ label: t("feed.create"), to: "/create" }}
                    />
                  ) : rest.length === 0 ? (
                    <p className="text-body text-text-3">
                      {t("feed.pulseEmpty")}
                    </p>
                  ) : (
                    <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
                      {rest.map((market, index) => (
                        <Reveal
                          key={market.address}
                          delay={staggerDelay(index)}
                        >
                          <MarketCard market={market} />
                        </Reveal>
                      ))}
                    </div>
                  )}
                </PageSection>
              }
              aside={
                <Reveal delay={stagger.aside}>
                  <Card>
                    <CardHeader>
                      <h2 className="text-narrative font-semibold">
                        {t("feed.pulseTitle")}
                      </h2>
                    </CardHeader>
                    <CardContent className="mt-4">
                      {data.length ? (
                        <ul className="grid gap-3">
                          {data.slice(0, 5).map((market) => {
                            const total = market.backPool + market.fadePool;
                            const backBps =
                              total === 0n
                                ? 5000
                                : Number((market.backPool * 10000n) / total);
                            return (
                              <li
                                key={market.address}
                                className="border-b border-border pb-3 last:border-b-0 last:pb-0"
                              >
                                <Link
                                  to={`/market/${market.address}`}
                                  className="flex items-baseline justify-between gap-3 transition-colors duration-standard hover:text-brand"
                                >
                                  <span className="line-clamp-2 text-body text-text-2">
                                    {market.narrative}
                                  </span>
                                  <span
                                    className="shrink-0 font-mono font-semibold tabular-nums text-back"
                                    data-financial
                                  >
                                    {Math.round(backBps / 100)}%
                                  </span>
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      ) : (
                        <p className="text-body text-text-2">
                          {t("feed.pulseEmpty")}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </Reveal>
              }
            />
          </div>
        </>
      ) : null}
    </PageContainer>
  );
}
