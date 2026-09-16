import { useParams } from "react-router-dom";
import { type Address, isAddress } from "viem";
import { EmptyState } from "@/components/backfade/EmptyState";
import { ThesisPost } from "@/components/backfade/ThesisPost";
import { Metric, MetricGroup } from "@/components/data";
import { PageContainer, PageHeader, PageSection } from "@/components/layout";
import { Alert } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { useProfile } from "@/features/thesis/hooks";
import { aggregateLeaderboard } from "@/features/thesis/stats";
import {
  formatAmount,
  formatBps,
  formatError,
  formatSignedAmount,
  shortAddress,
} from "@/lib/format";

export default function Profile() {
  const rawAddress = useParams().address;
  const address =
    rawAddress && isAddress(rawAddress) ? (rawAddress as Address) : undefined;
  const query = useProfile(address);

  if (!address) {
    return (
      <EmptyState
        title="Invalid profile address"
        description="Use a valid onchain address."
        action={{ label: "Back to Feed", to: "/" }}
      />
    );
  }
  if (query.isLoading) {
    return (
      <PageContainer>
        <p className="text-body text-text-2">Loading track record…</p>
      </PageContainer>
    );
  }
  if (query.error) {
    return (
      <PageContainer>
        <Alert
          title="Profile unavailable"
          description={formatError(
            query.error,
            "en",
            "Chain data could not be read.",
          )}
        />
      </PageContainer>
    );
  }

  const theses = query.data ?? [];
  const overall = aggregateLeaderboard(theses, "overall").find(
    (entry) => entry.address.toLowerCase() === address.toLowerCase(),
  );
  const creator = aggregateLeaderboard(theses, "creators").find(
    (entry) => entry.address.toLowerCase() === address.toLowerCase(),
  );
  const fader = aggregateLeaderboard(theses, "faders").find(
    (entry) => entry.address.toLowerCase() === address.toLowerCase(),
  );
  const resolved = theses.filter(
    (thesis) => thesis.state === "SETTLED" || thesis.state === "CANCELLED",
  );
  const creatorTheses = resolved.filter(
    (thesis) => thesis.creator.toLowerCase() === address.toLowerCase(),
  );
  const matchedCapital = creatorTheses.reduce(
    (sum, thesis) => sum + thesis.matchedConviction,
    0n,
  );
  const weightedAlpha = creatorTheses.reduce(
    (sum, thesis) => sum + thesis.realizedAlphaBps * thesis.matchedConviction,
    0n,
  );
  const creatorAlpha =
    matchedCapital === 0n ? 0n : weightedAlpha / matchedCapital;

  return (
    <PageContainer>
      <PageHeader
        eyebrow="FINANCIAL IDENTITY"
        title={shortAddress(address)}
        lede="Every posted Thesis and capital-backed Challenge remains part of the track record."
      />
      <Card className="mt-8">
        <MetricGroup columns={5}>
          <Metric
            label="Realized P&L"
            value={`${formatSignedAmount(overall?.pnl)} USDG`}
            tone="brand"
          />
          <Metric
            label="Matched Conviction"
            value={`${formatAmount(creator?.matchedCapital)} USDG`}
          />
          <Metric
            label="Resolved Theses"
            value={creator?.resolvedPositions ?? 0}
          />
          <Metric
            label="Creator Alpha"
            value={formatBps(creatorAlpha)}
            tone="brand"
          />
          <Metric
            label="Fade P&L"
            value={`${formatSignedAmount(fader?.pnl)} USDG`}
            tone="fade"
          />
        </MetricGroup>
      </Card>
      <div className="mt-8">
        <PageSection
          title="Track Record"
          description="Losing history stays visible."
        >
          {theses.length === 0 ? (
            <EmptyState
              title="No track record yet"
              description="Post or Fade a Thesis to start one."
            />
          ) : (
            <div className="grid gap-4">
              {theses.map((thesis) => (
                <ThesisPost key={thesis.address} thesis={thesis} />
              ))}
            </div>
          )}
        </PageSection>
      </div>
    </PageContainer>
  );
}
