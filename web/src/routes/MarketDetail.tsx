import { CalendarClock, ExternalLink, ShieldCheck } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import { type Address, isAddress } from "viem";
import { useAccount, useSwitchChain } from "wagmi";
import { EmptyState } from "@/components/backfade/EmptyState";
import { MarketStatus } from "@/components/backfade/MarketStatus";
import { NarrativeAlpha } from "@/components/backfade/NarrativeAlpha";
import { PositionPanel } from "@/components/backfade/PositionPanel";
import { TransactionFlow } from "@/components/backfade/TransactionFlow";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useMarket } from "@/features/market/hooks";
import { useTransaction } from "@/features/wallet/useTransaction";
import { config } from "@/lib/config";
import { formatDate, formatError, shortAddress } from "@/lib/format";
import { MARKET_ABI } from "@/lib/web3/contracts";

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
      <div className="mx-auto max-w-6xl px-5 py-12">
        <Skeleton className="h-96" />
      </div>
    );
  if (marketQuery.error || !marketQuery.data)
    return (
      <EmptyState
        title="Market unavailable"
        description={formatError(
          marketQuery.error,
          "This market could not be read from chain.",
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
    <div className="mx-auto max-w-6xl px-5 py-10 sm:py-14">
      <div className="mb-6 flex flex-wrap items-center gap-3 text-xs text-text-3">
        <Link to="/" className="hover:text-text-1">
          Feed
        </Link>
        <span>/</span>
        <span data-mono>{shortAddress(market.address)}</span>
        <MarketStatus state={market.state} />
      </div>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-7">
          <section>
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-brand">
              Narrative
            </p>
            <h1 className="mt-3 text-3xl font-semibold leading-tight tracking-[-0.03em] sm:text-4xl">
              {market.narrative}
            </h1>
            <p className="mt-4 text-text-2">
              A bonded thesis measured against oracle prices. BACK and FADE
              remain explicit at every step.
            </p>
          </section>
          <NarrativeAlpha value={market.narrativeAlphaBps} />
          <section>
            <div className="mb-3 flex items-center gap-2">
              <ShieldCheck
                size={17}
                className="text-brand"
                aria-hidden="true"
              />
              <h2 className="font-semibold">ThesisSpec</h2>
            </div>
            <Card>
              <p className="text-sm text-text-2">
                Basket and benchmark details are read from the compiler response
                when created. The onchain market remains the settlement source.
              </p>
              <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-xs text-text-3">Hurdle</dt>
                  <dd className="mt-1 font-mono" data-financial>
                    {market.hurdleBps / 100}%
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-text-3">Creator</dt>
                  <dd className="mt-1" data-mono>
                    {shortAddress(market.creator)}
                  </dd>
                </div>
              </dl>
            </Card>
          </section>
          <section className="border-y border-border py-5">
            <h2 className="mb-4 font-semibold">Timeline & oracle</h2>
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
