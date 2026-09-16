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
import { useLocale } from "@/lib/locale-provider";
import { stagger, staggerDelay } from "@/lib/motion";

export default function Profile() {
  const { t } = useLocale();
  const { address: rawAddress } = useParams();
  const address =
    rawAddress && isAddress(rawAddress) ? (rawAddress as Address) : undefined;
  const query = useCreatorMarkets(address);

  if (!address)
    return (
      <EmptyState
        title={t("profile.invalidTitle")}
        description={t("profile.invalidBody")}
        action={{ label: t("empty.backToFeed"), to: "/" }}
      />
    );
  if (query.isLoading)
    return (
      <PageContainer>
        <PageHeader
          eyebrow={t("profile.eyebrow")}
          title={<Skeleton className="h-8 w-56" />}
          lede={t("profile.lede")}
        />
        <div className="mt-8">
          <PageSection title={t("profile.theses")}>
            <Skeleton className="h-64" />
          </PageSection>
        </div>
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
        eyebrow={t("profile.eyebrow")}
        title={<AddressValue value={address} />}
        lede={t("profile.lede")}
      />

      <Reveal delay={stagger.lead}>
        <Card className="mt-8">
          <MetricGroup columns={5}>
            <Metric label={t("profile.created")} value={markets.length} />
            <Metric label={t("profile.resolved")} value={resolved} />
            <Metric label={t("profile.proven")} value={proven} tone="back" />
            <Metric label={t("profile.failed")} value={failed} tone="fade" />
            <Metric
              label={t("profile.proofRate")}
              value={
                resolved ? `${Math.round((proven / resolved) * 100)}%` : "—"
              }
            />
          </MetricGroup>
          <CardFooter className="text-body text-text-2">
            {t("profile.capitalBonded")}{" "}
            <span className="font-mono text-text-1" data-financial>
              {formatAmount(capitalBonded)} USDG
            </span>
          </CardFooter>
        </Card>
      </Reveal>

      <div className="mt-8">
        <PageSection
          title={t("profile.theses")}
          description={t("profile.thesesHint")}
        >
          {query.error ? (
            <Alert
              title={t("profile.readFailure")}
              description={t("profile.readFailureBody")}
            />
          ) : markets.length === 0 ? (
            <EmptyState
              title={t("profile.emptyTitle")}
              description={t("profile.emptyBody")}
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
