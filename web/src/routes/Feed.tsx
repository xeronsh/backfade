import { Link } from "react-router-dom";
import { EmptyState } from "@/components/backfade/EmptyState";
import { Reveal } from "@/components/backfade/Reveal";
import { ThesisCard } from "@/components/backfade/ThesisCard";
import { MetaLabel, Metric, MetricGroup, Status } from "@/components/data";
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
import { Skeleton } from "@/components/ui/skeleton";
import { useMarkets } from "@/features/market/hooks";
import { formatError } from "@/lib/format";
import { useLocale } from "@/lib/locale-provider";
import { stagger, staggerDelay } from "@/lib/motion";

export default function Feed() {
  const { t, locale } = useLocale();
  const markets = useMarkets();
  const data = markets.data ?? [];
  const openMarkets = data.filter((market) => market.state === "OPEN").length;

  return (
    <PageContainer>
      <PageHeader
        eyebrow={<Status dot>{t("feed.eyebrow")}</Status>}
        title={t("feed.title")}
        lede={t("feed.lede")}
        actions={<ButtonLink to="/create">{t("feed.create")}</ButtonLink>}
        aside={
          <MetricGroup columns={2}>
            <Metric
              label={t("feed.indexed")}
              value={markets.isLoading ? "—" : data.length}
            />
            <Metric
              label={t("feed.openNow")}
              value={markets.isLoading ? "—" : openMarkets}
              tone="back"
            />
          </MetricGroup>
        }
      />

      <div className="mt-8">
        <SplitLayout
          main={
            <PageSection
              title={t("feed.liveTheses")}
              description={t("feed.liveThesesHint")}
            >
              {markets.isLoading ? (
                <div
                  className="grid gap-4"
                  role="status"
                  aria-label={t("feed.loading")}
                >
                  <Skeleton className="h-64" />
                  <Skeleton className="h-64" />
                </div>
              ) : null}

              {markets.error ? (
                <Reveal>
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
                </Reveal>
              ) : null}

              {!markets.isLoading && !markets.error && data.length === 0 ? (
                <Reveal>
                  <EmptyState
                    title={t("feed.emptyTitle")}
                    description={t("feed.emptyBody")}
                    action={{ label: t("feed.create"), to: "/create" }}
                  />
                </Reveal>
              ) : null}

              {data.length ? (
                <div className="grid gap-4">
                  {data.map((market, index) => (
                    <Reveal key={market.address} delay={staggerDelay(index)}>
                      <ThesisCard market={market} />
                    </Reveal>
                  ))}
                </div>
              ) : null}
            </PageSection>
          }
          aside={
            <Reveal delay={stagger.aside}>
              <Card>
                <CardHeader>
                  <div className="min-w-0 flex-1">
                    <MetaLabel>{t("feed.pulseEyebrow")}</MetaLabel>
                    <h2 className="mt-1 text-narrative font-semibold">
                      {t("feed.pulseTitle")}
                    </h2>
                  </div>
                </CardHeader>
                <CardContent className="mt-4">
                  <MetricGroup columns={2}>
                    <Metric
                      label={t("feed.pulseIndexed")}
                      value={markets.isLoading ? "—" : data.length}
                    />
                    <Metric
                      label={t("feed.pulseOpen")}
                      value={markets.isLoading ? "—" : openMarkets}
                      tone="back"
                    />
                  </MetricGroup>
                  {data.length ? (
                    <ul className="mt-4 grid gap-3">
                      {data.slice(0, 3).map((market) => (
                        <li
                          key={market.address}
                          className="border-t border-border pt-3"
                        >
                          <Link
                            to={`/market/${market.address}`}
                            className="grid gap-1 transition-colors duration-standard hover:text-brand"
                          >
                            <Status dot>{market.state}</Status>
                            <strong className="truncate text-body font-semibold">
                              {market.narrative}
                            </strong>
                            <MetaLabel>
                              {market.state === "OPEN"
                                ? t("feed.tradingOpen")
                                : t("feed.readThesis")}
                            </MetaLabel>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-4 text-body text-text-2">
                      {t("feed.pulseEmpty")}
                    </p>
                  )}
                </CardContent>
              </Card>
            </Reveal>
          }
        />
      </div>
    </PageContainer>
  );
}
