import { CalendarClock, ExternalLink, ShieldCheck } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import { type Address, formatUnits, isAddress } from "viem";
import { useAccount, useSwitchChain } from "wagmi";
import { EmptyState } from "@/components/backfade/EmptyState";
import { MarketStatus } from "@/components/backfade/MarketStatus";
import { NarrativeAlpha } from "@/components/backfade/NarrativeAlpha";
import { PositionPanel } from "@/components/backfade/PositionPanel";
import { Reveal } from "@/components/backfade/Reveal";
import { ThesisSpec } from "@/components/backfade/ThesisSpec";
import { TransactionFlow } from "@/components/backfade/TransactionFlow";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useMarket } from "@/features/market/hooks";
import { useTransaction } from "@/features/wallet/useTransaction";
import { config } from "@/lib/config";
import {
  formatAmount,
  formatDate,
  formatError,
  shortAddress,
} from "@/lib/format";
import { MARKET_ABI } from "@/lib/web3/contracts";

function formatOraclePrice(value: bigint, decimals: number) {
  return `${formatUnits(value, decimals)} USD`;
}

export default function MarketDetail() {
  const { address: rawAddress } = useParams();
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
      <div className="page-shell">
        <Skeleton className="h-96" />
      </div>
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
    <div className="page-shell market-page">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Link to="/" className="detail-breadcrumb">
          Feed
        </Link>
        <span className="text-text-3">/</span>
        <span data-mono>{shortAddress(market.address)}</span>
        <MarketStatus state={market.state} />
      </div>
      <div className="market-layout">
        <div className="detail-stack">
          <Reveal className="market-detail-hero">
            <div>
              <p className="eyebrow">Narrative / bonded claim</p>
              <h1>{market.narrative}</h1>
              <p className="page-lede">
                A bonded thesis measured against oracle prices. BACK and FADE
                remain explicit at every step.
              </p>
            </div>
            <div className="market-detail-hero__signal">
              <NarrativeAlpha value={market.narrativeAlphaBps} />
            </div>
          </Reveal>
          <section>
            <div className="mb-3 flex items-center gap-2">
              <ShieldCheck
                size={17}
                className="text-brand"
                aria-hidden="true"
              />
              <h2 className="font-semibold">ThesisSpec</h2>
            </div>
            <ThesisSpec spec={market.thesisSpec} />
          </section>
          <section>
            <h2 className="mb-3 font-semibold">Pool summary</h2>
            <Card>
              <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
                <div>
                  <dt className="text-xs text-text-3">BACK pool</dt>
                  <dd className="mt-1 font-mono" data-financial>
                    {formatAmount(market.backPool)} USDG
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-text-3">FADE pool</dt>
                  <dd className="mt-1 font-mono" data-financial>
                    {formatAmount(market.fadePool)} USDG
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-text-3">Total pooled</dt>
                  <dd className="mt-1 font-mono" data-financial>
                    {formatAmount(market.backPool + market.fadePool)} USDG
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-text-3">Claimed</dt>
                  <dd className="mt-1 font-mono" data-financial>
                    {formatAmount(market.totalClaimed)} USDG
                  </dd>
                </div>
              </dl>
              <p className="mt-4 border-t border-border pt-4 text-sm text-text-2">
                Creator bond: {formatAmount(market.creatorBond)} USDG · Creator{" "}
                <span data-mono>{shortAddress(market.creator)}</span>
              </p>
            </Card>
          </section>
          <section>
            <h2 className="mb-3 font-semibold">Oracle observations</h2>
            <Card className="space-y-4">
              {market.oracle.map((observation) => (
                <div
                  key={observation.feed}
                  className="border-b border-border pb-4 last:border-0 last:pb-0"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <div>
                      <p className="font-semibold">{observation.symbol}</p>
                      <p className="text-xs text-text-3" data-mono>
                        {shortAddress(observation.feed)} · round{" "}
                        {observation.roundId.toString()}
                      </p>
                    </div>
                    <p className="font-mono" data-financial>
                      {formatOraclePrice(
                        observation.answer,
                        observation.decimals,
                      )}
                    </p>
                  </div>
                  <dl className="mt-3 grid grid-cols-2 gap-3 text-xs text-text-3 sm:grid-cols-3">
                    <div>
                      <dt>Start price</dt>
                      <dd className="mt-1 font-mono text-text-1" data-financial>
                        {formatOraclePrice(observation.startPrice, 18)}
                      </dd>
                    </div>
                    <div>
                      <dt>Updated</dt>
                      <dd className="mt-1 text-text-1" data-financial>
                        {formatDate(observation.updatedAt)}
                      </dd>
                    </div>
                    <div>
                      <dt>Answer round</dt>
                      <dd className="mt-1 font-mono text-text-1" data-financial>
                        {observation.answeredInRound.toString()}
                      </dd>
                    </div>
                  </dl>
                </div>
              ))}
            </Card>
          </section>
          <section className="border-y border-border py-5">
            <h2 className="mb-4 font-semibold">Timeline & settlement</h2>
            <div className="grid gap-4 text-sm sm:grid-cols-3">
              <div className="flex gap-3">
                <CalendarClock
                  size={17}
                  className="mt-0.5 text-text-3"
                  aria-hidden="true"
                />
                <div>
                  <p className="text-text-3">Entry closes</p>
                  <p className="mt-1" data-financial>
                    {formatDate(market.bettingEndsAt)}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-text-3">Resolves</p>
                <p className="mt-1" data-financial>
                  {formatDate(market.resolvesAt)}
                </p>
              </div>
              <div>
                <p className="text-text-3">Settlement window</p>
                <p className="mt-1" data-financial>
                  {market.settlementWindow.toString()} seconds
                </p>
              </div>
            </div>
          </section>
          <section>
            <h2 className="mb-3 font-semibold">Activity</h2>
            <Card>
              {market.activity.length === 0 ? (
                <p className="text-sm text-text-3">No activity indexed yet.</p>
              ) : (
                <ol className="space-y-4">
                  {market.activity.map((activity) => (
                    <li
                      key={`${activity.transactionHash}-${activity.kind}`}
                      className="flex items-start justify-between gap-4 text-sm"
                    >
                      <div>
                        <p className="font-medium">{activity.label}</p>
                        <p className="mt-1 text-text-2">{activity.detail}</p>
                        <p className="mt-1 text-xs text-text-3" data-financial>
                          Block {activity.blockNumber.toString()}
                        </p>
                      </div>
                      <a
                        className="shrink-0 text-xs text-brand hover:underline"
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
          </section>
          <section>
            <h2 className="mb-3 font-semibold">Lifecycle action</h2>
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
              <p className="text-sm text-text-3">
                This market is still accepting conviction through the Position
                panel.
              </p>
            ) : null}
            <TransactionFlow
              phase={transaction.phase}
              hash={transaction.hash}
            />
          </section>
        </div>
        <PositionPanel market={market} />
      </div>
      <a
        className="mt-8 inline-flex items-center gap-2 text-xs text-text-3 hover:text-text-1"
        href={`${config.explorerUrl}/address/${market.address}`}
        target="_blank"
        rel="noreferrer"
      >
        View contract on explorer <ExternalLink size={14} aria-hidden="true" />
      </a>
    </div>
  );
}
