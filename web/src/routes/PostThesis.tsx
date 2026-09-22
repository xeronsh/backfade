import { zodResolver } from "@hookform/resolvers/zod";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { type Address, decodeEventLog, isAddress, parseUnits } from "viem";
import { useAccount, usePublicClient, useSwitchChain } from "wagmi";
import { z } from "zod";
import { ThesisStructureEditor } from "@/components/backfade/ThesisStructureEditor";
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
import { useTransaction } from "@/features/wallet/useTransaction";
import { useCompileThesis, useListAssets } from "@/lib/api/generated";
import type { ThesisSpecV2 } from "@/lib/api/generated/model/thesisSpecV2";
import { canonicalClaim, validateClaim } from "@/lib/claim";
import { config } from "@/lib/config";
import { formatError } from "@/lib/format";
import { useLocale } from "@/lib/locale-provider";
import { addresses } from "@/lib/web3/addresses";
import { ERC20_ABI, FACTORY_ABI } from "@/lib/web3/contracts";

const schema = z.object({
  narrative: z.string().trim().min(8).max(280),
  conviction: z.string().trim().optional(),
});
type FormValues = z.infer<typeof schema>;

/**
 * The allowlist is the contract's, not this list's, but the editor should only
 * offer assets the factory will accept. The payload is typed loosely upstream,
 * so narrow it here rather than trusting the shape.
 */
function readAssets(payload: unknown): Array<{ symbol: string; feed: string }> {
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

export default function PostThesis() {
  const { t, locale } = useLocale();
  const [structure, setStructure] = useState<ThesisSpecV2 | null>(null);
  const [referenceConfirmed, setReferenceConfirmed] = useState(false);
  const compile = useCompileThesis();
  const assets = useListAssets();
  const transaction = useTransaction();
  const { address: account, chainId } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { switchChain } = useSwitchChain();
  const publicClient = usePublicClient();
  const navigate = useNavigate();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { narrative: "", conviction: "" },
  });

  const registry = readAssets(assets.data?.data);
  const availableSymbols = registry.map((asset) => asset.symbol);
  const feedFor = (symbol: string) =>
    registry.find((asset) => asset.symbol === symbol)?.feed ?? "";
  const structureError = structure
    ? validateClaim(structure)
    : ("empty" as const);

  async function compileNarrative(values: FormValues) {
    try {
      const result = await compile.mutateAsync({
        data: { text: values.narrative },
      });
      if (result.status !== 200) throw new Error(t("post.compilerInvalid"));
      setStructure(result.data);
      setReferenceConfirmed(false);
      toast(t("post.confirmReference"));
    } catch (error) {
      toast(formatError(error, locale));
    }
  }

  async function postThesis(values: FormValues) {
    if (!structure || structureError) return;
    if (!referenceConfirmed) {
      toast(t("post.confirmReference"));
      return;
    }
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

    const basket = structure.basket.map((asset) => ({
      feed: asset.feed as Address,
      weightBps: asset.weight_bps,
    }));
    if (
      !isAddress(structure.reference.feed) ||
      basket.some((asset) => !isAddress(asset.feed))
    ) {
      toast(t("post.compilerFeed"));
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
          canonicalClaim(structure),
          basket,
          structure.reference.feed as Address,
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
              <Card>
                <form onSubmit={form.handleSubmit(compileNarrative)}>
                  <Label htmlFor="narrative">{t("post.narrative")}</Label>
                  <Textarea
                    id="narrative"
                    maxLength={280}
                    placeholder={t("post.narrativePlaceholder")}
                    className="mt-2"
                    {...form.register("narrative")}
                  />
                  <div className="mt-2 flex justify-between text-meta text-text-3">
                    <span>
                      {form.formState.errors.narrative?.message ??
                        t("post.narrativeHint")}
                    </span>
                    <span>{form.watch("narrative").length}/280</span>
                  </div>
                  <Button
                    variant="primary"
                    type="submit"
                    className="mt-5"
                    disabled={compile.isPending}
                  >
                    {compile.isPending
                      ? t("post.compiling")
                      : t("post.structure")}
                  </Button>
                </form>
              </Card>
            </PageSection>
          }
          aside={
            <PageSection title={t("post.step2")}>
              <Card>
                {structure ? (
                  <>
                    <ThesisStructureEditor
                      structure={structure}
                      symbols={availableSymbols}
                      disabled={transaction.isPending}
                      onChange={(next) => {
                        // The editor works in symbols; feeds are resolved from the
                        // registry here so no symbol can reach the contract without one.
                        setStructure({
                          ...structure,
                          basket: next.basket.map((asset) => ({
                            ...asset,
                            feed: feedFor(asset.symbol),
                          })),
                          reference: {
                            symbol: next.reference.symbol,
                            feed: feedFor(next.reference.symbol),
                          },
                        });
                        setReferenceConfirmed(false);
                      }}
                    />
                    <Button
                      variant={referenceConfirmed ? "back" : "default"}
                      className="mt-5 w-full"
                      disabled={!!structureError}
                      onClick={() =>
                        setReferenceConfirmed((confirmed) => !confirmed)
                      }
                      aria-pressed={referenceConfirmed}
                    >
                      {referenceConfirmed
                        ? t("post.confirmedToggle", {
                            symbol: structure.reference.symbol,
                          })
                        : t("post.confirmToggle", {
                            symbol: structure.reference.symbol,
                          })}
                    </Button>
                    <form
                      onSubmit={form.handleSubmit(postThesis)}
                      className="mt-5 border-t border-border pt-5"
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
                        disabled={transaction.isPending || !!structureError}
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
                  <p className="text-body text-text-2">
                    {t("post.emptyPreview")}
                  </p>
                )}
              </Card>
            </PageSection>
          }
          asideWidth="wide"
          gap="loose"
        />
      </div>
    </PageContainer>
  );
}
