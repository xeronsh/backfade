import { useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import { type Address, isAddress } from "viem";
import { useAccount, useSwitchChain } from "wagmi";
import { ChallengeComposer } from "@/components/backfade/ChallengeComposer";
import { EmptyState } from "@/components/backfade/EmptyState";
import { TransactionFlow } from "@/components/backfade/TransactionFlow";
import { DataRow, ExplorerLink, Metric, MetricGroup } from "@/components/data";
import {
  PageContainer,
  PageHeader,
  PageSection,
  SplitLayout,
} from "@/components/layout";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useThesis } from "@/features/thesis/hooks";
import { useTransaction } from "@/features/wallet/useTransaction";
import { formatPayoutRange } from "@/lib/bet";
import { config } from "@/lib/config";
import {
  formatAmount,
  formatBps,
  formatDate,
  formatError,
  shortAddress,
} from "@/lib/format";
import { useLocale } from "@/lib/locale-provider";
import { THESIS_ABI } from "@/lib/web3/contracts";

/**
 * `hint` is passed explicitly rather than inferred from the label text: the
 * label is translated, so matching on a magic prefix would break in zh.
 */
function AlphaBlock({
  label,
  value,
  hint,
}: {
  label: string;
  value?: bigint;
  hint?: string;
}) {
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
      {hint ? <p className="mt-1 text-meta text-text-3">{hint}</p> : null}
    </div>
  );
}

export default function ThesisThread() {
  const { t, stateLabel, locale } = useLocale();
  const rawAddress = useParams().address;
  const address =
    rawAddress && isAddress(rawAddress) ? (rawAddress as Address) : undefined;
  const query = useThesis(address);
  const queryClient = useQueryClient();
  const transaction = useTransaction();
  const { address: account, chainId } = useAccount();
  const { switchChain } = useSwitchChain();

  if (!address) {
    return (
      <PageContainer>
        <EmptyState
          title={t("thread.invalidTitle")}
          description={t("thread.invalidBody")}
          action={{ label: t("common.backToFeed"), to: "/" }}
        />
      </PageContainer>
    );
  }
  if (query.isLoading) {
    return (
      <PageContainer>
        <p className="text-body text-text-2">{t("thread.loading")}</p>
      </PageContainer>
    );
  }
  if (query.error || !query.data) {
    return (
      <PageContainer>
        <Alert
          title={t("thread.unavailable")}
          description={formatError(query.error, locale, t("error.chainRead"))}
        />
      </PageContainer>
    );
  }

  const thesis = query.data;
  const final = thesis.state === "SETTLED" || thesis.state === "CANCELLED";
  const alpha = final ? thesis.realizedAlphaBps : thesis.liveAlphaBps;

  async function action(functionName: "settle" | "cancel" | "claim") {
    if (!account) {
      toast(t("thread.connectToContinue"));
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
      if (functionName !== "claim")
        await queryClient.refetchQueries({ queryKey: ["thesis", address] });
    } catch (error) {
      toast(formatError(error, locale));
    }
  }

  const canClaim = Boolean(
    account &&
      final &&
      (account.toLowerCase() === thesis.creator.toLowerCase() ||
        thesis.challengers.some(
          (challenger) =>
            challenger.address.toLowerCase() === account.toLowerCase(),
        )),
  );

  return (
    <PageContainer>
      <PageHeader
        eyebrow={t("thread.eyebrow")}
        title={thesis.narrative}
        lede={
          <>
            <ExplorerLink
              kind="address"
              value={thesis.creator}
              title={t("common.viewOnExplorer")}
            >
              {shortAddress(thesis.creator)}
            </ExplorerLink>
            {" · "}
            {thesis.basket.map((asset) => asset.symbol).join(" + ")} vs{" "}
            {thesis.reference.symbol}
          </>
        }
        actions={
          !final ? (
            <Button
              variant="primary"
              onClick={() => void action("settle")}
              disabled={transaction.isPending}
            >
              {t("thread.settle")}
            </Button>
          ) : canClaim ? (
            <Button
              variant="back"
              onClick={() => void action("claim")}
              disabled={transaction.isPending}
            >
              {t("thread.claim")}
            </Button>
          ) : null
        }
      />
      <TransactionFlow phase={transaction.phase} hash={transaction.hash} />
      <div className="mt-8">
        <SplitLayout
          main={
            <div className="grid gap-6">
              <PageSection title={t("thread.original")}>
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
                    · {t("bet.reference")} {thesis.reference.symbol}·{" "}
                    {t("bet.payoutRange")}{" "}
                    {formatPayoutRange(Number(thesis.payoutRangeBps))}
                  </p>
                  <AlphaBlock
                    label={
                      final ? t("common.realizedAlpha") : t("thread.liveAlpha")
                    }
                    value={alpha}
                    hint={final ? undefined : t("thread.liveAlphaHint")}
                  />
                </Card>
              </PageSection>
              <PageSection title={t("common.challenges")}>
                {thesis.challengers.length === 0 ? (
                  <Card>
                    <p className="text-body text-text-2">
                      {t("thread.noChallenges")}
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
                              {t("thread.fadedAmount", {
                                amount: formatAmount(challenger.stake),
                              })}
                            </span>
                          </div>
                          <p className="mt-3 text-body text-text-2">
                            {note || t("thread.challengesLede")}
                          </p>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </PageSection>
              <PageSection title={t("thread.activity")}>
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
                          <ExplorerLink
                            kind="tx"
                            value={activity.transactionHash}
                            title={t("common.viewOnExplorer")}
                            className="font-mono text-meta text-text-3"
                          >
                            {t("thread.block", {
                              block: activity.blockNumber.toString(),
                            })}
                          </ExplorerLink>
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
                    {t("thread.convictionSummary")}
                  </h2>
                </CardHeader>
                <CardContent className="pt-5">
                  <MetricGroup columns={2}>
                    <Metric
                      label={t("common.creatorConviction")}
                      value={`${formatAmount(thesis.creatorBond)} USDG`}
                    />
                    <Metric
                      label={t("common.matchedConviction")}
                      value={`${formatAmount(thesis.matchedConviction)} USDG`}
                      tone="brand"
                    />
                    <Metric
                      label={t("common.openBounty")}
                      value={`${formatAmount(thesis.openBounty)} USDG`}
                    />
                    <Metric
                      label={t("common.challenges")}
                      value={thesis.challengers.length}
                    />
                  </MetricGroup>
                </CardContent>
              </Card>
              {thesis.state === "OPEN" ? (
                <Card>
                  <CardHeader>
                    <h2 className="text-narrative font-semibold">
                      {t("thread.fadeTitle")}
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
                    <h2 className="text-narrative font-semibold">
                      {t("common.settlement")}
                    </h2>
                  </CardHeader>
                  <CardContent className="pt-5">
                    <dl className="grid gap-3">
                      <DataRow label={t("common.state")}>
                        {stateLabel(thesis.state)}
                      </DataRow>
                      <DataRow label={t("common.realizedAlpha")}>
                        {formatBps(thesis.realizedAlphaBps)}
                      </DataRow>
                      <DataRow label={t("common.creatorPayout")}>
                        {formatAmount(thesis.creatorPayout)} USDG
                      </DataRow>
                      <DataRow label={t("common.challengePoolPayout")}>
                        {formatAmount(thesis.challengePayoutPool)} USDG
                      </DataRow>
                      <DataRow label={t("common.settledAt")}>
                        {formatDate(thesis.settledAt, locale)}
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
                  {t("thread.cancelUnsafe")}
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
