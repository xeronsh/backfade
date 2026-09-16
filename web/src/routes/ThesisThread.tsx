import { useParams } from "react-router-dom";
import { toast } from "sonner";
import { type Address, isAddress } from "viem";
import { useAccount, useSwitchChain } from "wagmi";
import { ChallengeComposer } from "@/components/backfade/ChallengeComposer";
import { EmptyState } from "@/components/backfade/EmptyState";
import { TransactionFlow } from "@/components/backfade/TransactionFlow";
import { DataRow, Metric, MetricGroup } from "@/components/data";
import {
  PageContainer,
  PageHeader,
  PageSection,
  SplitLayout,
} from "@/components/layout";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useThesis, useThesisPosition } from "@/features/thesis/hooks";
import { useTransaction } from "@/features/wallet/useTransaction";
import { config } from "@/lib/config";
import {
  formatAmount,
  formatBps,
  formatDate,
  formatError,
  shortAddress,
} from "@/lib/format";
import { THESIS_ABI } from "@/lib/web3/contracts";

function AlphaBlock({ label, value }: { label: string; value?: bigint }) {
  return (
    <div className="border-y border-border py-5">
      <p className="font-mono text-meta font-semibold uppercase tracking-eyebrow text-text-3">
        {label}
      </p>
      <p
        className="mt-1 font-mono text-page-title font-semibold tabular-nums text-brand"
        data-financial
      >
        {formatBps(value)}
      </p>
      {label.startsWith("Live") ? (
        <p className="mt-1 text-meta text-text-3">
          Indicative until settlement.
        </p>
      ) : null}
    </div>
  );
}

export default function ThesisThread() {
  const rawAddress = useParams().address;
  const address =
    rawAddress && isAddress(rawAddress) ? (rawAddress as Address) : undefined;
  const query = useThesis(address);
  const position = useThesisPosition(address);
  const transaction = useTransaction();
  const { address: account, chainId } = useAccount();
  const { switchChain } = useSwitchChain();

  if (!address) {
    return (
      <EmptyState
        title="Invalid Thesis address"
        description="Use a valid onchain Thesis address."
        action={{ label: "Back to Feed", to: "/" }}
      />
    );
  }
  if (query.isLoading) {
    return (
      <PageContainer>
        <p className="text-body text-text-2">Loading Thesis…</p>
      </PageContainer>
    );
  }
  if (query.error || !query.data) {
    return (
      <PageContainer>
        <Alert
          title="Thesis unavailable"
          description={formatError(
            query.error,
            "en",
            "Chain data could not be read.",
          )}
        />
      </PageContainer>
    );
  }

  const thesis = query.data;
  const final = thesis.state === "SETTLED" || thesis.state === "CANCELLED";
  const alpha = final ? thesis.realizedAlphaBps : thesis.liveAlphaBps;

  async function action(functionName: "settle" | "cancel" | "claim") {
    if (!account) {
      toast("Connect a wallet to continue.");
      return;
    }
    if (chainId !== config.chainId) {
      switchChain({ chainId: config.chainId });
      return;
    }
    try {
      await transaction.execute({
        address: address as Address,
        abi: THESIS_ABI,
        functionName,
      });
    } catch (error) {
      toast(formatError(error));
    }
  }

  const canClaim = Boolean(
    account &&
      final &&
      (account.toLowerCase() === thesis.creator.toLowerCase() ||
        (position.data?.stake ?? 0n) > 0n),
  );

  return (
    <PageContainer>
      <PageHeader
        eyebrow="THESIS THREAD"
        title={thesis.narrative}
        lede={`${shortAddress(thesis.creator)} · ${thesis.basket.map((asset) => asset.symbol).join(" + ")} vs ${thesis.reference.symbol}`}
        actions={
          !final ? (
            <Button
              variant="primary"
              onClick={() => void action("settle")}
              disabled={transaction.isPending}
            >
              Settle Thesis
            </Button>
          ) : canClaim ? (
            <Button
              variant="back"
              onClick={() => void action("claim")}
              disabled={transaction.isPending}
            >
              Claim Payout
            </Button>
          ) : null
        }
      />
      <TransactionFlow phase={transaction.phase} hash={transaction.hash} />
      <div className="mt-8">
        <SplitLayout
          main={
            <div className="grid gap-6">
              <PageSection title="Original Thesis">
                <Card>
                  <p className="text-narrative font-semibold leading-snug text-text-1">
                    {thesis.narrative}
                  </p>
                  <p className="mt-3 font-mono text-meta uppercase tracking-label text-brand">
                    {thesis.basket
                      .map(
                        (asset) =>
                          `${asset.symbol} ${formatBps(asset.weightBps)}`,
                      )
                      .join(" · ")}{" "}
                    · Reference {thesis.reference.symbol}
                  </p>
                  <AlphaBlock
                    label={final ? "Realized Alpha" : "Live Alpha · indicative"}
                    value={alpha}
                  />
                </Card>
              </PageSection>
              <PageSection title="Challenges">
                {thesis.challengers.length === 0 ? (
                  <Card>
                    <p className="text-body text-text-2">
                      No capital-backed Challenges yet.
                    </p>
                  </Card>
                ) : (
                  <div className="grid gap-3">
                    {thesis.challengers.map((challenger) => {
                      const note = thesis.activities.find(
                        (activity) =>
                          activity.kind === "challenge" &&
                          activity.actor?.toLowerCase() ===
                            challenger.address.toLowerCase(),
                      )?.note;
                      return (
                        <Card key={challenger.address}>
                          <div className="flex items-baseline justify-between gap-3">
                            <span className="font-semibold text-text-1">
                              {shortAddress(challenger.address)}
                            </span>
                            <span
                              className="font-mono text-meta text-fade"
                              data-financial
                            >
                              FADED {formatAmount(challenger.stake)} USDG
                            </span>
                          </div>
                          <p className="mt-3 text-body text-text-2">
                            {note || "Capital-backed disagreement."}
                          </p>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </PageSection>
              <PageSection title="Capital Activity">
                <Card>
                  <ol className="grid gap-4">
                    {thesis.activities.map((activity) => (
                      <li
                        key={`${activity.transactionHash}-${activity.kind}-${activity.actor ?? ""}-${activity.amount ?? 0n}`}
                        className="border-b border-border pb-4 last:border-b-0 last:pb-0"
                      >
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <span className="font-semibold text-text-1">
                            {activity.label}
                          </span>
                          <span className="font-mono text-meta text-text-3">
                            Block {activity.blockNumber.toString()}
                          </span>
                        </div>
                        <p className="mt-1 text-body text-text-2">
                          {activity.detail}
                        </p>
                      </li>
                    ))}
                  </ol>
                </Card>
              </PageSection>
            </div>
          }
          aside={
            <div className="grid gap-4">
              <Card>
                <CardHeader>
                  <h2 className="text-narrative font-semibold">
                    Conviction Summary
                  </h2>
                </CardHeader>
                <CardContent className="pt-5">
                  <MetricGroup columns={2}>
                    <Metric
                      label="Creator Conviction"
                      value={`${formatAmount(thesis.creatorBond)} USDG`}
                    />
                    <Metric
                      label="Matched Conviction"
                      value={`${formatAmount(thesis.matchedConviction)} USDG`}
                      tone="brand"
                    />
                    <Metric
                      label="Open Bounty"
                      value={`${formatAmount(thesis.openBounty)} USDG`}
                    />
                    <Metric
                      label="Challenges"
                      value={thesis.challengers.length}
                    />
                  </MetricGroup>
                </CardContent>
              </Card>
              {thesis.state === "OPEN" ? (
                <Card>
                  <CardHeader>
                    <h2 className="text-narrative font-semibold">
                      Fade this Thesis
                    </h2>
                  </CardHeader>
                  <CardContent className="pt-5">
                    <ChallengeComposer thesis={thesis} />
                  </CardContent>
                </Card>
              ) : null}
              {final ? (
                <Card>
                  <CardHeader>
                    <h2 className="text-narrative font-semibold">Settlement</h2>
                  </CardHeader>
                  <CardContent className="pt-5">
                    <dl className="grid gap-3">
                      <DataRow label="State">{thesis.state}</DataRow>
                      <DataRow label="Realized Alpha">
                        {formatBps(thesis.realizedAlphaBps)}
                      </DataRow>
                      <DataRow label="Creator payout">
                        {formatAmount(thesis.creatorPayout)} USDG
                      </DataRow>
                      <DataRow label="Challenge pool payout">
                        {formatAmount(thesis.challengePayoutPool)} USDG
                      </DataRow>
                      <DataRow label="Settled at">
                        {formatDate(thesis.settledAt)}
                      </DataRow>
                    </dl>
                  </CardContent>
                </Card>
              ) : null}
              {!final && thesis.state === "LOCKED" ? (
                <Button
                  variant="danger"
                  onClick={() => void action("cancel")}
                  disabled={transaction.isPending}
                >
                  Cancel after unsafe window
                </Button>
              ) : null}
            </div>
          }
          asidePosition="sticky"
          gap="loose"
        />
      </div>
    </PageContainer>
  );
}
