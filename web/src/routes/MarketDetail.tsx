import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import { type Address, formatUnits, isAddress } from "viem";
import { useAccount, useSwitchChain } from "wagmi";
import { EmptyState } from "@/components/backfade/EmptyState";
import { MarketStatus } from "@/components/backfade/MarketStatus";
import { NarrativeAlpha } from "@/components/backfade/NarrativeAlpha";
import { PositionPanel } from "@/components/backfade/PositionPanel";
import { ThesisSpec } from "@/components/backfade/ThesisSpec";
import { TransactionFlow } from "@/components/backfade/TransactionFlow";
import {
  DataRow,
  Figure,
  Metric,
  MetricGroup,
  Timestamp,
} from "@/components/data";
import { Address as AddressValue } from "@/components/data/value";
import {
  PageContainer,
  PageHeader,
  PageSection,
  SplitLayout,
} from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useMarket } from "@/features/market/hooks";
import { useTransaction } from "@/features/wallet/useTransaction";
import { config } from "@/lib/config";
import { formatAmount, formatError, shortAddress } from "@/lib/format";
import { useLocale } from "@/lib/locale-provider";
import { MARKET_ABI } from "@/lib/web3/contracts";

function formatOraclePrice(value: bigint, decimals: number) {
  return `${formatUnits(value, decimals)} USD`;
}

export default function MarketDetail() {
  const { t, locale } = useLocale();
  const { address: rawAddress } = useParams<{ address: string }>();
  const address =
    rawAddress && isAddress(rawAddress) ? (rawAddress as Address) : undefined;
  const marketQuery = useMarket(address);
  const transaction = useTransaction();
  const { address: account, chainId } = useAccount();
  const { switchChain } = useSwitchChain();

  if (!address)
    return (
      <EmptyState
        title={t("market.invalidTitle")}
        description={t("market.invalidBody")}
        action={{ label: t("market.backToFeed"), to: "/" }}
      />
    );
  if (marketQuery.isLoading)
    return (
      <PageContainer>
        <PageHeader
          eyebrow={t("market.eyebrow")}
          title={<Skeleton className="h-8 w-3/5" />}
          lede={<Skeleton className="h-5 w-2/3" />}
          aside={<Skeleton className="h-16 w-full" />}
        />
        <div className="mt-8">
          <SplitLayout
            asidePosition="sticky"
            aside={<Skeleton className="h-80" />}
            main={
              <>
                <PageSection title={t("market.thesisSpec")}>
                  <Skeleton className="h-64" />
                </PageSection>
                <PageSection title={t("market.poolSummary")}>
                  <Skeleton className="h-40" />
                </PageSection>
              </>
            }
          />
        </div>
      </PageContainer>
    );
  if (marketQuery.error || !marketQuery.data)
    return (
      <EmptyState
        title={t("market.unavailableTitle")}
        description={formatError(
          marketQuery.error,
          locale,
          t("market.unavailableBody"),
        )}
        action={{ label: t("market.backToFeed"), to: "/" }}
      />
    );

  const market = marketQuery.data;

  async function action(
    functionName: "resolve" | "cancelAfterDeadline" | "claim" | "refund",
  ) {
    if (!account) {
      toast(t("tx.connectFirst"));
      return;
    }
    if (chainId !== config.chainId) {
      switchChain({ chainId: config.chainId });
      return;
    }
    try {
      await transaction.execute({
        address: market.address,
        abi: MARKET_ABI,
        functionName,
      });
      toast(t("tx.notConfirmed", { fn: functionName }));
    } catch (error) {
      toast(formatError(error, locale));
    }
  }

  return (
    <PageContainer>
      <div className="mb-6 flex flex-wrap items-center gap-3 font-mono text-meta text-text-3">
        <Link
          to="/"
          className="transition-colors duration-standard hover:text-brand"
        >
          {t("market.breadcrumb")}
        </Link>
        <span aria-hidden="true">/</span>
        <AddressValue value={market.address} />
        <MarketStatus state={market.state} />
      </div>

      <PageHeader
        eyebrow={t("market.eyebrow")}
        title={market.narrative}
        lede={t("market.lede")}
        aside={<NarrativeAlpha value={market.narrativeAlphaBps} />}
      />

      <div className="mt-8">
        <SplitLayout
          asidePosition="sticky"
          aside={<PositionPanel market={market} />}
          main={
            <>
              <PageSection
                title={t("market.thesisSpec")}
                description={t("market.thesisSpecHint")}
              >
                <ThesisSpec spec={market.thesisSpec} />
              </PageSection>

              <PageSection title={t("market.poolSummary")}>
                <Card>
                  <MetricGroup columns={4}>
                    <Metric
                      label={t("market.backPool")}
                      value={`${formatAmount(market.backPool)} USDG`}
                    />
                    <Metric
                      label={t("market.fadePool")}
                      value={`${formatAmount(market.fadePool)} USDG`}
                    />
                    <Metric
                      label={t("market.totalPooled")}
                      value={`${formatAmount(market.backPool + market.fadePool)} USDG`}
                    />
                    <Metric
                      label={t("market.claimed")}
                      value={`${formatAmount(market.totalClaimed)} USDG`}
                    />
                  </MetricGroup>
                  <CardFooter className="text-body text-text-2">
                    {t("market.creatorBond")} {formatAmount(market.creatorBond)}{" "}
                    USDG · {t("market.creator")}{" "}
                    <AddressValue value={market.creator} />
                  </CardFooter>
                </Card>
              </PageSection>

              <PageSection title={t("market.oracle")}>
                <Card className="grid gap-4">
                  {market.oracle.map((observation) => (
                    <div
                      key={observation.feed}
                      className="border-b border-border pb-4 last:border-b-0 last:pb-0"
                    >
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <div>
                          <p className="font-semibold">{observation.symbol}</p>
                          <p className="text-meta text-text-3" data-mono>
                            {shortAddress(observation.feed)} ·{" "}
                            {t("market.round")} {observation.roundId.toString()}
                          </p>
                        </div>
                        <Figure>
                          {formatOraclePrice(
                            observation.answer,
                            observation.decimals,
                          )}
                        </Figure>
                      </div>
                      <MetricGroup className="mt-3" columns={3} layout="rows">
                        <DataRow label={t("market.startPrice")}>
                          <Figure>
                            {formatOraclePrice(observation.startPrice, 18)}
                          </Figure>
                        </DataRow>
                        <DataRow label={t("market.updated")}>
                          <Timestamp value={observation.updatedAt} />
                        </DataRow>
                        <DataRow label={t("market.answerRound")}>
                          <Figure>
                            {observation.answeredInRound.toString()}
                          </Figure>
                        </DataRow>
                      </MetricGroup>
                    </div>
                  ))}
                </Card>
              </PageSection>

              <PageSection title={t("market.timeline")} divided>
                <MetricGroup columns={3}>
                  <Metric
                    label={t("market.entryCloses")}
                    value={<Timestamp value={market.bettingEndsAt} />}
                  />
                  <Metric
                    label={t("thesis.resolves")}
                    value={<Timestamp value={market.resolvesAt} />}
                  />
                  <Metric
                    label={t("market.settlementWindow")}
                    value={`${market.settlementWindow} ${t("market.seconds")}`}
                  />
                </MetricGroup>
              </PageSection>

              <PageSection title={t("market.activity")}>
                <Card>
                  {market.activity.length === 0 ? (
                    <p className="text-body text-text-3">
                      {t("market.noActivity")}
                    </p>
                  ) : (
                    <ol className="grid gap-4">
                      {market.activity.map((activity) => (
                        <li
                          key={`${activity.transactionHash}-${activity.kind}`}
                          className="flex items-start justify-between gap-4 text-body"
                        >
                          <div>
                            <p className="font-medium">{activity.label}</p>
                            <p className="mt-1 text-text-2">
                              {activity.detail}
                            </p>
                            <p className="mt-1 text-meta text-text-3">
                              {t("market.block")}{" "}
                              <Figure>{activity.blockNumber.toString()}</Figure>
                            </p>
                          </div>
                          <a
                            className="shrink-0 text-meta text-brand hover:underline"
                            href={`${config.explorerUrl}/tx/${activity.transactionHash}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {t("market.explorer")}
                          </a>
                        </li>
                      ))}
                    </ol>
                  )}
                </Card>
              </PageSection>

              <PageSection title={t("market.lifecycle")}>
                {market.state === "READY" ? (
                  <Button
                    variant="primary"
                    disabled={transaction.isPending}
                    onClick={() => void action("resolve")}
                  >
                    {t("market.resolve")}
                  </Button>
                ) : null}
                {market.state === "CANCELLABLE" ? (
                  <Button
                    variant="default"
                    disabled={transaction.isPending}
                    onClick={() => void action("cancelAfterDeadline")}
                  >
                    {t("market.cancelRefund")}
                  </Button>
                ) : null}
                {market.state === "PROVEN" || market.state === "FAILED" ? (
                  <Button
                    variant="primary"
                    disabled={transaction.isPending}
                    onClick={() => void action("claim")}
                  >
                    {t("market.claim")}
                  </Button>
                ) : null}
                {market.state === "CANCELLED" ? (
                  <Button
                    variant="default"
                    disabled={transaction.isPending}
                    onClick={() => void action("refund")}
                  >
                    {t("market.refund")}
                  </Button>
                ) : null}
                {["OPEN", "CLOSED"].includes(market.state) ? (
                  <p className="text-body text-text-3">
                    {t("market.stillOpen")}
                  </p>
                ) : null}
                <TransactionFlow
                  phase={transaction.phase}
                  hash={transaction.hash}
                />
              </PageSection>
            </>
          }
        />
      </div>

      <a
        className="mt-8 inline-flex items-center gap-2 text-meta text-text-3 transition-colors duration-standard hover:text-text-1"
        href={`${config.explorerUrl}/address/${market.address}`}
        target="_blank"
        rel="noreferrer"
      >
        {t("market.viewContract")}
      </a>
    </PageContainer>
  );
}
