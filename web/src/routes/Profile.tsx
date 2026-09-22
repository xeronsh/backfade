import { useParams } from "react-router-dom";
import { type Address, isAddress } from "viem";
import { EmptyState } from "@/components/backfade/EmptyState";
import { ThesisPost } from "@/components/backfade/ThesisPost";
import { Metric, MetricGroup } from "@/components/data";
import { PageContainer, PageHeader, PageSection } from "@/components/layout";
import { Alert } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { ExplorerLink } from "@/components/data";
import { useProfile } from "@/features/thesis/hooks";
import { aggregateLeaderboard } from "@/features/thesis/stats";
import {
  formatAmount,
  formatBps,
  formatError,
  formatSignedAmount,
  shortAddress,
} from "@/lib/format";
import { useLocale } from "@/lib/locale-provider";

export default function Profile() {
  const { t, locale } = useLocale();
  const rawAddress = useParams().address;
  const address =
    rawAddress && isAddress(rawAddress) ? (rawAddress as Address) : undefined;
  const query = useProfile(address);

  if (!address) {
    return (
      <PageContainer>
        <EmptyState
          title={t("profile.invalidTitle")}
          description={t("profile.invalidBody")}
          action={{ label: t("common.backToFeed"), to: "/" }}
        />
      </PageContainer>
    );
  }
  if (query.isLoading) {
    return (
      <PageContainer>
        <p className="text-body text-text-2">{t("profile.loading")}</p>
      </PageContainer>
    );
  }
  if (query.error) {
    return (
      <PageContainer>
        <Alert
          title={t("profile.unavailable")}
          description={formatError(query.error, locale, t("error.chainRead"))}
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
        eyebrow={t("profile.eyebrow")}
        title={
          <ExplorerLink
            kind="address"
            value={address}
            title={t("common.viewOnExplorer")}
          >
            {shortAddress(address)}
          </ExplorerLink>
        }
        lede={t("profile.lede")}
      />
      <Card className="mt-8">
        <MetricGroup columns={5}>
          <Metric
            label={t("common.realizedPnl")}
            value={`${formatSignedAmount(overall?.pnl)} USDG`}
            tone="brand"
          />
          <Metric
            label={t("common.matchedConviction")}
            value={`${formatAmount(creator?.matchedCapital)} USDG`}
          />
          <Metric
            label={t("profile.resolvedTheses")}
            value={creator?.resolvedPositions ?? 0}
          />
          <Metric
            label={t("profile.creatorAlpha")}
            value={formatBps(creatorAlpha)}
            tone="brand"
          />
          <Metric
            label={t("profile.fadePnl")}
            value={`${formatSignedAmount(fader?.pnl)} USDG`}
            tone="fade"
          />
        </MetricGroup>
      </Card>
      <div className="mt-8">
        <PageSection
          title={t("profile.trackRecord")}
          description={t("profile.trackRecordLede")}
        >
          {theses.length === 0 ? (
            <EmptyState
              title={t("profile.emptyTitle")}
              description={t("profile.emptyBody")}
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
