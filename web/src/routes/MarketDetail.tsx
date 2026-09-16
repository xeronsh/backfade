import { ExternalLink } from "lucide-react";
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
import { MARKET_ABI } from "@/lib/web3/contracts";

function formatOraclePrice(value: bigint, decimals: number) {
  return `${formatUnits(value, decimals)} USD`;
}

export default function MarketDetail() {
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
        title="Invalid market address"
        description="Use a 20-byte contract address from the Feed."
        action={{ label: "Back to Feed", to: "/" }}
      />
    );
  if (marketQuery.isLoading)
    return (
      <PageContainer>
        <Skeleton className="h-96" />
      </PageContainer>
    );
  if (marketQuery.error || !marketQuery.data)
    return (
      <EmptyState
        title="Market unavailable"
        description={formatError(
          marketQuery.error,
          "This market could not be read completely from chain.",
        )}
        action={{ label: "Back to Feed", to: "/" }}
      />
    );

  const market = marketQuery.data;

  async function action(
    functionName: "resolve" | "cancelAfterDeadline" | "claim" | "refund",
  ) {
    if (!account) {
      toast("Connect a wallet before signing.");
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
      toast(`${functionName} confirmed.`);
    } catch (error) {
      toast(formatError(error));
    }
  }

  return (
    <PageContainer>
      <div className="mb-6 flex flex-wrap items-center gap-3 font-mono text-meta text-text-3">
        <Link
          to="/"
          className="transition-colors duration-standard hover:text-brand"
        >
          Feed
        </Link>
        <span aria-hidden="true">/</span>
        <AddressValue value={market.address} />
        <MarketStatus state={market.state} />
      </div>

      <PageHeader
        eyebrow="Narrative / bonded claim"
        title={market.narrative}
        lede="A bonded thesis measured against oracle prices. BACK and FADE remain explicit at every step."
        aside={<NarrativeAlpha value={market.narrativeAlphaBps} />}
      />

      <div className="mt-8">
        <SplitLayout
          asidePosition="sticky"
          aside={<PositionPanel market={market} />}
          main={
            <>
              <PageSection
                title="ThesisSpec"
                description="Machine claim read from the deployed contract."
              >
                <ThesisSpec spec={market.thesisSpec} />
              </PageSection>

              <PageSection title="Pool summary">
                <Card>
                  <MetricGroup columns={4}>
                    <Metric
                      label="BACK pool"
                      value={`${formatAmount(market.backPool)} USDG`}
                    />
                    <Metric
                      label="FADE pool"
                      value={`${formatAmount(market.fadePool)} USDG`}
                    />
                    <Metric
                      label="Total pooled"
                      value={`${formatAmount(market.backPool + market.fadePool)} USDG`}
                    />
                    <Metric
                      label="Claimed"
                      value={`${formatAmount(market.totalClaimed)} USDG`}
                    />
                  </MetricGroup>
                  <CardFooter className="text-body text-text-2">
                    Creator bond: {formatAmount(market.creatorBond)} USDG ·
                    Creator <AddressValue value={market.creator} />
                  </CardFooter>
                </Card>
              </PageSection>

              <PageSection title="Oracle observations">
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
                            {shortAddress(observation.feed)} · round{" "}
                            {observation.roundId.toString()}
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
                        <DataRow label="Start price">
                          <Figure>
                            {formatOraclePrice(observation.startPrice, 18)}
                          </Figure>
                        </DataRow>
                        <DataRow label="Updated">
                          <Timestamp value={observation.updatedAt} />
                        </DataRow>
                        <DataRow label="Answer round">
                          <Figure>
                            {observation.answeredInRound.toString()}
                          </Figure>
                        </DataRow>
                      </MetricGroup>
                    </div>
                  ))}
                </Card>
              </PageSection>

              <PageSection title="Timeline & settlement" divided>
                <MetricGroup columns={3}>
                  <Metric
                    label="Entry closes"
                    value={<Timestamp value={market.bettingEndsAt} />}
                  />
                  <Metric
                    label="Resolves"
                    value={<Timestamp value={market.resolvesAt} />}
                  />
                  <Metric
                    label="Settlement window"
                    value={<>{market.settlementWindow.toString()} seconds</>}
                  />
                </MetricGroup>
              </PageSection>

              <PageSection title="Activity">
                <Card>
                  {market.activity.length === 0 ? (
                    <p className="text-body text-text-3">
                      No activity indexed yet.
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
                              Block{" "}
                              <Figure>{activity.blockNumber.toString()}</Figure>
                            </p>
                          </div>
                          <a
                            className="shrink-0 text-meta text-brand hover:underline"
                            href={`${config.explorerUrl}/tx/${activity.transactionHash}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Explorer
                          </a>
                        </li>
                      ))}
                    </ol>
                  )}
                </Card>
              </PageSection>

              <PageSection title="Lifecycle action">
                {market.state === "READY" ? (
                  <Button
                    variant="primary"
                    disabled={transaction.isPending}
                    onClick={() => void action("resolve")}
                  >
                    Resolve thesis
                  </Button>
                ) : null}
                {market.state === "CANCELLABLE" ? (
                  <Button
                    variant="default"
                    disabled={transaction.isPending}
                    onClick={() => void action("cancelAfterDeadline")}
                  >
                    Cancel and refund
                  </Button>
                ) : null}
                {market.state === "PROVEN" || market.state === "FAILED" ? (
                  <Button
                    variant="primary"
                    disabled={transaction.isPending}
                    onClick={() => void action("claim")}
                  >
                    Claim position
                  </Button>
                ) : null}
                {market.state === "CANCELLED" ? (
                  <Button
                    variant="default"
                    disabled={transaction.isPending}
                    onClick={() => void action("refund")}
                  >
                    Refund position
                  </Button>
                ) : null}
                {["OPEN", "CLOSED"].includes(market.state) ? (
                  <p className="text-body text-text-3">
                    This market is still accepting conviction through the
                    Position panel.
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
        View contract on explorer <ExternalLink size={14} aria-hidden="true" />
      </a>
    </PageContainer>
  );
}
