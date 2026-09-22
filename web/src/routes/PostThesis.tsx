import { zodResolver } from "@hookform/resolvers/zod";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { type Address, decodeEventLog, isAddress, parseUnits } from "viem";
import { useAccount, usePublicClient, useSwitchChain } from "wagmi";
import { z } from "zod";
import { BetEditor } from "@/components/backfade/BetEditor";
import { TransactionFlow } from "@/components/backfade/TransactionFlow";
import {
  PageContainer,
  PageHeader,
  PageSection,
  SplitLayout,
} from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useFactoryLimits } from "@/features/thesis/hooks";
import { useTransaction } from "@/features/wallet/useTransaction";
import { useListAssets } from "@/lib/api/generated";
import {
  type BetLimits,
  type BetStructure,
  evenWeights,
  validateBet,
} from "@/lib/bet";
import { config } from "@/lib/config";
import { formatError } from "@/lib/format";
import { useLocale } from "@/lib/locale-provider";
import { addresses } from "@/lib/web3/addresses";
import { ERC20_ABI, FACTORY_ABI } from "@/lib/web3/contracts";

const schema = z.object({
  conviction: z.string().trim().optional(),
});
type FormValues = z.infer<typeof schema>;

interface RegistryAsset {
  symbol: string;
  feed: string;
}

/**
 * The allowlist is the contract's, not this list's, but the editor should only
 * offer assets the factory will accept. The payload is typed loosely upstream,
 * so narrow it here rather than trusting the shape.
 */
function readAssets(payload: unknown): RegistryAsset[] {
  if (!payload || typeof payload !== "object") return [];
  const assets = (payload as { assets?: unknown }).assets;
  if (!Array.isArray(assets)) return [];
  return assets
    .filter(
      (entry): entry is { symbol: string; feed?: string; enabled?: boolean } =>
        !!entry &&
        typeof entry === "object" &&
        typeof (entry as { symbol?: unknown }).symbol === "string",
    )
    .filter((entry) => entry.enabled !== false)
    .map((entry) => ({ symbol: entry.symbol, feed: entry.feed ?? "" }));
}

/**
 * A Bet is two assets against a third until the creator says otherwise. Seeding
 * it here keeps the editor controlled without an effect that could overwrite an
 * edit the moment the registry refetches.
 */
function defaultBet(symbols: string[], limits: BetLimits): BetStructure | null {
  if (symbols.length < 2 || limits.allowedHorizons.length === 0) return null;
  const basketSymbols = symbols.slice(0, Math.min(2, symbols.length - 1));
  return {
    basket: evenWeights(basketSymbols),
    reference: { symbol: symbols[basketSymbols.length] },
    horizonSeconds: limits.allowedHorizons[0],
    payoutRangeBps: Math.min(
      Math.max(1_000, limits.minPayoutRangeBps),
      limits.maxPayoutRangeBps,
    ),
  };
}

/** UTF-8 bytes, because the contract caps `narrative` in bytes and CJK is 3 each. */
function byteLength(value: string): number {
  return new TextEncoder().encode(value).length;
}

export default function PostThesis() {
  const { t, locale } = useLocale();
  const [bet, setBet] = useState<BetStructure | null>(null);
  const [thesis, setThesis] = useState("");
  const limitsQuery = useFactoryLimits();
  const assetsQuery = useListAssets();
  const transaction = useTransaction();
  const { address: account, chainId } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { switchChain } = useSwitchChain();
  const publicClient = usePublicClient();
  const navigate = useNavigate();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { conviction: "" },
  });

  const registry = readAssets(assetsQuery.data?.data);
  const limits = limitsQuery.data?.limits;
  const narrativeMaxBytes = limitsQuery.data?.narrativeMaxBytes ?? 2_000;
  const activeBet = useMemo(
    () =>
      bet ??
      (limits
        ? defaultBet(
            registry.map((a) => a.symbol),
            limits,
          )
        : null),
    [bet, limits, registry],
  );
  const feedFor = (symbol: string) =>
    registry.find((asset) => asset.symbol === symbol)?.feed ?? "";

  const thesisBytes = byteLength(thesis.trim());
  const thesisError =
    thesisBytes === 0
      ? ("empty" as const)
      : thesisBytes > narrativeMaxBytes
        ? ("long" as const)
        : null;
  const betError =
    activeBet && limits ? validateBet(activeBet, limits) : ("empty" as const);

  async function postThesis(values: FormValues) {
    if (!activeBet || betError) {
      toast(t("post.betInvalid"));
      return;
    }
    if (thesisError) return;
    if (!account) {
      openConnectModal?.();
      toast(t("post.connect"));
      return;
    }
    if (chainId !== config.chainId) {
      switchChain({ chainId: config.chainId });
      return;
    }
    if (!publicClient) return;

    let conviction: bigint;
    try {
      conviction = parseUnits(values.conviction ?? "", 18);
    } catch {
      toast(t("post.invalidConviction"));
      return;
    }
    if (conviction <= 0n) {
      toast(t("post.zeroConviction"));
      return;
    }

    const basket = activeBet.basket.map((asset) => ({
      feed: feedFor(asset.symbol) as Address,
      weightBps: asset.weight_bps,
    }));
    const referenceFeed = feedFor(activeBet.reference.symbol);
    if (!isAddress(referenceFeed) || basket.some((a) => !isAddress(a.feed))) {
      toast(t("post.betInvalid"));
      return;
    }

    try {
      const allowance = await publicClient.readContract({
        address: addresses.collateral,
        abi: ERC20_ABI,
        functionName: "allowance",
        args: [account, addresses.factory],
      });
      if (allowance < conviction) {
        await transaction.execute(
          {
            address: addresses.collateral,
            abi: ERC20_ABI,
            functionName: "approve",
            args: [addresses.factory, conviction],
          },
          true,
        );
      }
      const hash = await transaction.execute({
        address: addresses.factory,
        abi: FACTORY_ABI,
        functionName: "createThesis",
        args: [
          thesis.trim(),
          basket,
          referenceFeed as Address,
          BigInt(activeBet.horizonSeconds),
          BigInt(activeBet.payoutRangeBps),
          conviction,
        ],
      });
      const receipt = await publicClient.getTransactionReceipt({ hash });
      for (const log of receipt.logs) {
        if (log.address.toLowerCase() !== addresses.factory.toLowerCase())
          continue;
        try {
          const event = decodeEventLog({
            abi: FACTORY_ABI,
            data: log.data,
            topics: log.topics,
          });
          if (event.eventName === "ThesisCreated" && "thesis" in event.args) {
            navigate(`/thesis/${event.args.thesis}`);
            return;
          }
        } catch {
          // Ignore unrelated logs in the receipt.
        }
      }
      navigate("/");
    } catch (error) {
      toast(formatError(error, locale));
    }
  }

  return (
    <PageContainer>
      <PageHeader
        eyebrow={t("post.eyebrow")}
        title={t("post.title")}
        lede={t("post.lede")}
      />
      <div className="mt-8">
        <SplitLayout
          main={
            <PageSection title={t("post.step1")}>
              <Card className="p-5">
                <Label htmlFor="thesis">{t("post.thesis")}</Label>
                <Textarea
                  id="thesis"
                  rows={12}
                  className="mt-2"
                  placeholder={t("post.thesisPlaceholder")}
                  value={thesis}
                  onChange={(event) => setThesis(event.target.value)}
                />
                <div className="mt-2 flex justify-between gap-4 text-meta text-text-3">
                  <span>
                    {thesisError === "long"
                      ? t("post.thesisTooLong")
                      : t("post.thesisHint")}
                  </span>
                  <span
                    className={
                      thesisBytes > narrativeMaxBytes
                        ? "text-warning"
                        : undefined
                    }
                  >
                    {thesisBytes}/{narrativeMaxBytes}
                  </span>
                </div>
              </Card>
            </PageSection>
          }
          aside={
            <PageSection title={t("post.step2")}>
              {activeBet && limits ? (
                <>
                  <BetEditor
                    bet={activeBet}
                    symbols={registry.map((asset) => asset.symbol)}
                    limits={limits}
                    disabled={transaction.isPending}
                    onChange={setBet}
                  />
                  <form
                    onSubmit={form.handleSubmit(postThesis)}
                    className="mt-5"
                  >
                    <Label htmlFor="conviction">
                      {t("post.convictionLabel")}
                    </Label>
                    <Input
                      id="conviction"
                      inputMode="decimal"
                      required
                      placeholder="1000"
                      className="mt-2"
                      {...form.register("conviction")}
                    />
                    <p className="mt-2 text-meta text-text-3">
                      {t("post.fixedParams")}
                    </p>
                    <Button
                      variant="primary"
                      type="submit"
                      className="mt-5 w-full"
                      disabled={
                        transaction.isPending || !!betError || !!thesisError
                      }
                    >
                      {transaction.isPending
                        ? t("post.posting")
                        : t("post.submit")}
                    </Button>
                    <TransactionFlow
                      phase={transaction.phase}
                      hash={transaction.hash}
                    />
                  </form>
                </>
              ) : (
                <Card className="p-5">
                  <p className="text-body text-text-2">{t("post.noAssets")}</p>
                </Card>
              )}
            </PageSection>
          }
          asideWidth="wide"
          gap="loose"
        />
      </div>
    </PageContainer>
  );
}
