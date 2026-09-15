import { RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import { EmptyState } from "@/components/backfade/EmptyState";
import { ThesisCard } from "@/components/backfade/ThesisCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useMarkets } from "@/features/market/hooks";
import { formatError } from "@/lib/format";

export default function Feed() {
  const markets = useMarkets();
  return (
    <div className="mx-auto max-w-5xl px-5 py-10 sm:py-14">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-brand">
            Narrative market
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em]">
            Feed
          </h1>
          <p className="mt-2 max-w-xl text-text-2">
            Bond a thesis. Let the market decide. Every outcome resolves against
            the chain.
          </p>
        </div>
        <Link to="/create" className="hidden sm:block">
          <Button variant="primary">Create thesis</Button>
        </Link>
      </div>
      {markets.isLoading ? (
        <section className="space-y-4" aria-label="Loading feed">
          <Skeleton className="h-56" />
          <Skeleton className="h-56" />
        </section>
      ) : null}
      {markets.error ? (
        <section className="border-y border-fade bg-fade-soft px-5 py-8">
          <h2 className="font-semibold text-fade">Feed unavailable</h2>
          <p className="mt-2 text-sm text-text-2">
            {formatError(markets.error, "Chain reads failed.")}
          </p>
          <Button
            className="mt-4"
            size="sm"
            onClick={() => void markets.refetch()}
          >
            <RefreshCw size={15} aria-hidden="true" /> Retry
          </Button>
        </section>
      ) : null}
      {!markets.isLoading && !markets.error && markets.data?.length === 0 ? (
        <EmptyState
          title="No theses yet"
          description="Be the first creator to publish a bonded narrative."
          action={{ label: "Create thesis", to: "/create" }}
        />
      ) : null}
      {markets.data?.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {markets.data.map((market) => (
            <ThesisCard key={market.address} market={market} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
