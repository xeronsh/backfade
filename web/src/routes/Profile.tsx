import { useParams } from "react-router-dom";
import { type Address, isAddress } from "viem";
import { EmptyState } from "@/components/backfade/EmptyState";
import { Reveal } from "@/components/backfade/Reveal";
import { ThesisCard } from "@/components/backfade/ThesisCard";
import {
  Address as AddressValue,
  Metric,
  MetricGroup,
} from "@/components/data";
import { PageContainer, PageHeader, PageSection } from "@/components/layout";
import { Alert } from "@/components/ui/alert";
import { Card, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCreatorMarkets } from "@/features/market/hooks";
import { formatAmount } from "@/lib/format";
import { stagger, staggerDelay } from "@/lib/motion";

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
      <PageContainer>
        <Skeleton className="h-64" />
      </PageContainer>
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
    <PageContainer>
      <PageHeader
        eyebrow="Creator profile"
        title={<AddressValue value={address} />}
        lede="A chain-derived track record. No offchain reputation formula."
      />

      <Reveal delay={stagger.lead}>
        <Card className="mt-8">
          <MetricGroup columns={5}>
            <Metric label="Created" value={markets.length} />
            <Metric label="Resolved" value={resolved} />
            <Metric label="Proven" value={proven} tone="back" />
            <Metric label="Failed" value={failed} tone="fade" />
            <Metric
              label="Proof rate"
              value={
                resolved ? `${Math.round((proven / resolved) * 100)}%` : "—"
              }
            />
          </MetricGroup>
          <CardFooter className="text-body text-text-2">
            Capital bonded{" "}
            <span className="font-mono text-text-1" data-financial>
              {formatAmount(capitalBonded)} USDG
            </span>
          </CardFooter>
        </Card>
      </Reveal>

      <div className="mt-8">
        <PageSection
          title="Published theses"
          description="Read from the current factory contract."
        >
          {query.error ? (
            <Alert
              title="Read failure"
              description="Creator data could not be read from chain."
            />
          ) : markets.length === 0 ? (
            <EmptyState
              title="No theses yet"
              description="This creator has not published a thesis on the current factory."
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {markets.map((market, index) => (
                <Reveal key={market.address} delay={staggerDelay(index)}>
                  <ThesisCard market={market} />
                </Reveal>
              ))}
            </div>
          )}
        </PageSection>
      </div>
    </PageContainer>
  );
}
