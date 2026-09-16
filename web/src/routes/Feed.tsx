import { Activity, RefreshCw } from "lucide-react";
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
import { stagger, staggerDelay } from "@/lib/motion";

export default function Feed() {
  const markets = useMarkets();
  const data = markets.data ?? [];
  const openMarkets = data.filter((market) => market.state === "OPEN").length;

  return (
    <PageContainer>
      <PageHeader
        eyebrow={<Status dot>Narrative market</Status>}
        title="Feed"
        lede="Bond a thesis. Let the market decide. Every outcome resolves against the chain."
        actions={<ButtonLink to="/create">Create thesis</ButtonLink>}
        aside={
          <MetricGroup columns={2}>
            <Metric
              label="Markets indexed"
              value={markets.isLoading ? "—" : data.length}
            />
            <Metric
              label="Open now"
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
              title="Live theses"
              description="Read the claim. Choose a side."
            >
              {markets.isLoading ? (
                <div
                  className="grid gap-4"
                  role="status"
                  aria-label="Loading feed"
                >
                  <Skeleton className="h-64" />
                  <Skeleton className="h-64" />
                </div>
              ) : null}

              {markets.error ? (
                <Reveal>
                  <Alert
                    title="Read failure"
                    description={formatError(
                      markets.error,
                      "Chain reads failed.",
                    )}
                    action={
                      <Button size="sm" onClick={() => void markets.refetch()}>
                        <RefreshCw size={15} aria-hidden="true" /> Retry
                      </Button>
                    }
                  />
                </Reveal>
              ) : null}

              {!markets.isLoading && !markets.error && data.length === 0 ? (
                <Reveal>
                  <EmptyState
                    title="No theses yet"
                    description="Be the first creator to publish a bonded narrative."
                    action={{ label: "Create thesis", to: "/create" }}
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
                    <MetaLabel>Chain-derived</MetaLabel>
                    <h2 className="mt-1 text-narrative font-semibold">
                      Market pulse
                    </h2>
                  </div>
                  <Activity
                    size={18}
                    className="text-brand"
                    aria-hidden="true"
                  />
                </CardHeader>
                <CardContent className="mt-4">
                  <MetricGroup columns={2}>
                    <Metric
                      label="Indexed"
                      value={markets.isLoading ? "—" : data.length}
                    />
                    <Metric
                      label="Open"
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
                                ? "Trading open"
                                : "Read thesis"}
                            </MetaLabel>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-4 text-body text-text-2">
                      Chain markets will appear here when indexed.
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
