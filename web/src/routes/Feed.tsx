import { Activity, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import { EmptyState } from "@/components/backfade/EmptyState";
import { Reveal } from "@/components/backfade/Reveal";
import { ThesisCard } from "@/components/backfade/ThesisCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useMarkets } from "@/features/market/hooks";
import { formatError } from "@/lib/format";

export default function Feed() {
  const markets = useMarkets();
  const data = markets.data ?? [];
  const openMarkets = data.filter((market) => market.state === "OPEN").length;

  return (
    <div className="page-shell feed-page">
      <Reveal className="feed-intro">
        <div>
          <p className="eyebrow">
            <span className="status-dot" /> Narrative market
          </p>
          <h1 className="display-title">Feed</h1>
          <p className="page-lede">
            Bond a thesis. Let the market decide. Every outcome resolves against
            the chain.
          </p>
          <div className="hero-actions">
            <Link to="/create">
              <Button variant="primary" size="lg">
                Create thesis
              </Button>
            </Link>
          </div>
          <section className="hero-metrics" aria-label="Feed summary">
            <div className="hero-metric">
              <span className="hero-metric__label">Markets indexed</span>
              <strong className="hero-metric__value" data-financial>
                {markets.isLoading ? "—" : data.length}
              </strong>
            </div>
            <div className="hero-metric">
              <span className="hero-metric__label">Open now</span>
              <strong className="hero-metric__value text-back" data-financial>
                {markets.isLoading ? "—" : openMarkets}
              </strong>
            </div>
          </section>
        </div>
      </Reveal>

      <div className="feed-layout">
        <section className="feed-column" aria-labelledby="live-theses-heading">
          <Reveal delay={0.08}>
            <div className="section-heading">
              <div>
                <p>Financial-social stream</p>
                <h2 id="live-theses-heading">Live theses</h2>
              </div>
              <p>Read the claim. Choose a side.</p>
            </div>
          </Reveal>

          {markets.isLoading ? (
            <section className="feed-list" aria-label="Loading feed">
              <Skeleton className="h-64" />
              <Skeleton className="h-64" />
            </section>
          ) : null}
          {markets.error ? (
            <Reveal>
              <Card className="error-panel border-fade bg-fade-soft px-5 py-8">
                <p className="eyebrow text-fade">Read failure</p>
                <h2 className="mt-3 text-xl font-semibold">Feed unavailable</h2>
                <p className="mt-2 max-w-xl text-sm text-text-2">
                  {formatError(markets.error, "Chain reads failed.")}
                </p>
                <Button
                  className="mt-5"
                  size="sm"
                  onClick={() => void markets.refetch()}
                >
                  <RefreshCw size={15} aria-hidden="true" /> Retry
                </Button>
              </Card>
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
            <div className="feed-list">
              {data.map((market, index) => (
                <Reveal
                  key={market.address}
                  delay={Math.min(index * 0.06, 0.24)}
                >
                  <ThesisCard market={market} />
                </Reveal>
              ))}
            </div>
          ) : null}
        </section>

        <aside className="feed-aside" aria-label="Market pulse">
          <Reveal delay={0.14}>
            <Card className="pulse-panel">
              <CardHeader className="pulse-panel__header">
                <div>
                  <p>Chain-derived</p>
                  <h2>Market pulse</h2>
                </div>
                <Activity size={18} aria-hidden="true" />
              </CardHeader>
              <CardContent className="p-0">
                <dl className="pulse-stats">
                  <div>
                    <dt>Indexed</dt>
                    <dd data-financial>
                      {markets.isLoading ? "—" : data.length}
                    </dd>
                  </div>
                  <div>
                    <dt>Open</dt>
                    <dd className="text-back" data-financial>
                      {markets.isLoading ? "—" : openMarkets}
                    </dd>
                  </div>
                </dl>
                {data.length ? (
                  <ul className="pulse-list">
                    {data.slice(0, 3).map((market) => (
                      <li key={market.address}>
                        <Link to={`/market/${market.address}`}>
                          <span className="pulse-list__state">
                            <span className="status-dot" /> {market.state}
                          </span>
                          <strong>{market.narrative}</strong>
                          <span className="pulse-list__meta">
                            {market.state === "OPEN"
                              ? "Trading open"
                              : "Read thesis"}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-text-2">
                    Chain markets will appear here when indexed.
                  </p>
                )}
              </CardContent>
            </Card>
          </Reveal>
        </aside>
      </div>
    </div>
  );
}
