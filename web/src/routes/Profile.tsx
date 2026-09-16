import { useParams } from "react-router-dom";
import { type Address, isAddress } from "viem";
import { EmptyState } from "@/components/backfade/EmptyState";
import { Reveal } from "@/components/backfade/Reveal";
import { ThesisCard } from "@/components/backfade/ThesisCard";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCreatorMarkets } from "@/features/market/hooks";
import { formatAmount, shortAddress } from "@/lib/format";

export default function Profile() {
  const { address: rawAddress } = useParams();
  const address =
    rawAddress && isAddress(rawAddress) ? (rawAddress as Address) : undefined;
  const query = useCreatorMarkets(address);
  if (!address)
    return (
      <EmptyState
        title="Invalid profile address"
        description="Use a 20-byte wallet address from a thesis card."
        action={{ label: "Back to Feed", to: "/" }}
      />
    );
  if (query.isLoading)
    return (
      <div className="page-shell">
        <Skeleton className="h-64" />
      </div>
    );
  const markets = query.data ?? [];
  const proven = markets.filter((market) => market.state === "PROVEN").length;
  const failed = markets.filter((market) => market.state === "FAILED").length;
  const resolved = proven + failed;
  const capitalBonded = markets.reduce(
    (total, market) => total + market.creatorBond,
    0n,
  );
  return (
    <div className="page-shell profile-page">
      <Reveal className="profile-hero">
        <p className="eyebrow">Creator profile</p>
        <h1 className="page-title profile-address font-mono" data-mono>
          {shortAddress(address)}
        </h1>
        <p className="page-lede">
          A chain-derived track record. No offchain reputation formula.
        </p>
      </Reveal>
      <Reveal delay={0.06}>
        <Card className="profile-stats mb-8">
          <dl className="profile-stats__grid">
            <div>
              <dt className="text-xs text-text-3">Created</dt>
              <dd className="mt-1 text-xl font-semibold" data-financial>
                {markets.length}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-text-3">Resolved</dt>
              <dd className="mt-1 text-xl font-semibold" data-financial>
                {resolved}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-text-3">Proven</dt>
              <dd
                className="mt-1 text-xl font-semibold text-back"
                data-financial
              >
                {proven}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-text-3">Failed</dt>
              <dd
                className="mt-1 text-xl font-semibold text-fade"
                data-financial
              >
                {failed}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-text-3">Proof rate</dt>
              <dd className="mt-1 text-xl font-semibold" data-financial>
                {resolved ? `${Math.round((proven / resolved) * 100)}%` : "—"}
              </dd>
            </div>
          </dl>
          <p className="mt-5 border-t border-border pt-4 text-sm text-text-2">
            Capital bonded{" "}
            <span className="font-mono text-text-1" data-financial>
              {formatAmount(capitalBonded)} USDG
            </span>
          </p>
        </Card>
      </Reveal>
      {query.error ? (
        <p className="border-y border-fade bg-fade-soft px-5 py-5 text-sm text-fade">
          Creator data could not be read from chain.
        </p>
      ) : markets.length === 0 ? (
        <EmptyState
          title="No theses yet"
          description="This creator has not published a thesis on the current factory."
        />
      ) : (
        <div className="market-grid">
          {markets.map((market, index) => (
            <Reveal key={market.address} delay={Math.min(index * 0.06, 0.24)}>
              <ThesisCard market={market} />
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}
