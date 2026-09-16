import { type KeyboardEvent, useRef } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
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
  OutcomeSplit,
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
import { TabButton } from "@/components/ui/tabs";
import {
  type MarketDetail as MarketDetailData,
  useMarket,
} from "@/features/market/hooks";
import { useTransaction } from "@/features/wallet/useTransaction";
import { config } from "@/lib/config";
import { formatAmount, formatError, shortAddress } from "@/lib/format";
import { useLocale } from "@/lib/locale-provider";
import { MARKET_ABI } from "@/lib/web3/contracts";

function formatOraclePrice(value: bigint, decimals: number) {
  return `${formatUnits(value, decimals)} USD`;
}

type EvidenceTab = "pool" | "oracle";
const evidenceTabs: EvidenceTab[] = ["pool", "oracle"];

function MarketConviction({ market }: { market: MarketDetailData }) {
  const { t } = useLocale();
  return (
    <PageSection
      title={t("market.conviction")}
      description={t("market.convictionHint")}
    >
      <Card>
        <OutcomeSplit
          back={market.backPool}
          fade={market.fadePool}
          size="title"
        />
      </Card>
    </PageSection>
  );
}

function PoolSummary({ market }: { market: MarketDetailData }) {
  const { t } = useLocale();
  return (
    <>
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
        {t("market.creatorBond")} {formatAmount(market.creatorBond)} USDG ·{" "}
        {t("market.creator")} <AddressValue value={market.creator} />
      </CardFooter>
    </>
  );
}

function OracleObservations({ market }: { market: MarketDetailData }) {
  const { t } = useLocale();
  if (market.oracle.length === 0) {
    return <p className="text-body text-text-3">{t("market.noOracle")}</p>;
  }
  return (
    <div className="grid gap-4">
      {market.oracle.map((observation) => (
        <div
          key={observation.feed}
          className="border-b border-border pb-4 last:border-b-0 last:pb-0"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <p className="font-semibold">{observation.symbol}</p>
              <p className="text-meta text-text-3" data-mono>
                {shortAddress(observation.feed)} · {t("market.round")}{" "}
                {observation.roundId.toString()}
              </p>
            </div>
            <Figure>
              {formatOraclePrice(observation.answer, observation.decimals)}
            </Figure>
          </div>
          <MetricGroup className="mt-3" columns={3} layout="rows">
            <DataRow label={t("market.startPrice")}>
              <Figure>{formatOraclePrice(observation.startPrice, 18)}</Figure>
            </DataRow>
            <DataRow label={t("market.updated")}>
              <Timestamp value={observation.updatedAt} />
            </DataRow>
            <DataRow label={t("market.answerRound")}>
              <Figure>{observation.answeredInRound.toString()}</Figure>
            </DataRow>
          </MetricGroup>
        </div>
      ))}
    </div>
  );
}

function MarketEvidence({ market }: { market: MarketDetailData }) {
  const { t } = useLocale();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab: EvidenceTab =
    searchParams.get("evidence") === "oracle" ? "oracle" : "pool";
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  function changeTab(tab: EvidenceTab) {
    const nextParams = new URLSearchParams(searchParams);
    if (tab === "pool") nextParams.delete("evidence");
    else nextParams.set("evidence", tab);
    setSearchParams(nextParams, { replace: true });
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    const currentIndex = evidenceTabs.indexOf(activeTab);
    let nextIndex: number | undefined;
    if (event.key === "ArrowRight") {
      nextIndex = (currentIndex + 1) % evidenceTabs.length;
    } else if (event.key === "ArrowLeft") {
      nextIndex =
        (currentIndex - 1 + evidenceTabs.length) % evidenceTabs.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = evidenceTabs.length - 1;
    }
    if (nextIndex === undefined) return;
    event.preventDefault();
    const nextTab = evidenceTabs[nextIndex];
    changeTab(nextTab);
    requestAnimationFrame(() => tabRefs.current[nextIndex]?.focus());
  }

  return (
    <PageSection
      title={t("market.evidence")}
      description={t("market.evidenceHint")}
    >
      <div className="border border-border bg-surface-1">
        <div
          className="flex overflow-x-auto border-b border-border"
          role="tablist"
          aria-label={t("market.evidence")}
        >
          {evidenceTabs.map((tab, index) => {
            const selected = activeTab === tab;
            const tabId = `market-evidence-tab-${tab}`;
            return (
              <TabButton
                active={selected}
                key={tab}
                ref={(node) => {
                  tabRefs.current[index] = node;
                }}
                id={tabId}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-controls={`market-evidence-panel-${tab}`}
                tabIndex={selected ? 0 : -1}
                onClick={() => changeTab(tab)}
                onKeyDown={handleKeyDown}
              >
                {" "}
                {tab === "pool" ? t("market.poolSummary") : t("market.oracle")}
              </TabButton>
            );
          })}
        </div>
        {evidenceTabs.map((tab) => {
          const selected = activeTab === tab;
          return (
            <div
              key={tab}
              id={`market-evidence-panel-${tab}`}
              role="tabpanel"
              aria-labelledby={`market-evidence-tab-${tab}`}
              hidden={!selected}
              className="p-5"
            >
              {tab === "pool" ? (
                <PoolSummary market={market} />
              ) : (
                <OracleObservations market={market} />
              )}
            </div>
          );
        })}
      </div>
    </PageSection>
  );
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
                <PageSection title={t("market.conviction")}>
                  <Skeleton className="h-40" />
                </PageSection>
                <PageSection title={t("market.thesisSpec")}>
                  <Skeleton className="h-64" />
                </PageSection>
                <PageSection title={t("market.evidence")}>
                  <Skeleton className="h-40" />
                </PageSection>
                <div className="grid gap-6 xl:grid-cols-2">
                  <PageSection title={t("market.timeline")}>
                    <Skeleton className="h-24" />
                  </PageSection>
                  <PageSection title={t("market.activity")}>
                    <Skeleton className="h-32" />
                  </PageSection>
                </div>
                <PageSection title={t("market.lifecycle")}>
                  <Skeleton className="h-12" />
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
              <MarketConviction market={market} />

              <PageSection
                title={t("market.thesisSpec")}
                description={t("market.thesisSpecHint")}
              >
                <ThesisSpec spec={market.thesisSpec} />
              </PageSection>

              <MarketEvidence market={market} />

              <div className="grid gap-6 xl:grid-cols-2">
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
                                <Figure>
                                  {activity.blockNumber.toString()}
                                </Figure>
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
              </div>

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
