import { zodResolver } from "@hookform/resolvers/zod";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { type Address, decodeEventLog, isAddress, parseUnits } from "viem";
import { useAccount, usePublicClient, useSwitchChain } from "wagmi";
import { z } from "zod";
import { ThesisSpec } from "@/components/backfade/ThesisSpec";
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
import { useCompileThesis } from "@/lib/api/generated";
import type { ThesisSpecV2 } from "@/lib/api/generated/model/thesisSpecV2";
import { config } from "@/lib/config";
import { formatError } from "@/lib/format";
import { addresses } from "@/lib/web3/addresses";
import { ERC20_ABI, FACTORY_ABI } from "@/lib/web3/contracts";

const schema = z.object({
  narrative: z.string().trim().min(8).max(280),
  conviction: z.string().trim().optional(),
});
type FormValues = z.infer<typeof schema>;

export default function PostThesis() {
  const [compiled, setCompiled] = useState<ThesisSpecV2 | null>(null);
  const [referenceConfirmed, setReferenceConfirmed] = useState(false);
  const compile = useCompileThesis();
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

  async function compileNarrative(values: FormValues) {
    try {
      const result = await compile.mutateAsync({
        data: { text: values.narrative },
      });
      if (result.status !== 200)
        throw new Error("The compiler returned an invalid response.");
      setCompiled(result.data);
      setReferenceConfirmed(false);
      toast("Thesis structure ready. Confirm the Reference before posting.");
    } catch (error) {
      toast(formatError(error));
    }
  }

  async function postThesis(values: FormValues) {
    if (!compiled) return;
    if (!referenceConfirmed) {
      toast("Confirm the Reference before posting.");
      return;
    }
    if (!account) {
      openConnectModal?.();
      toast("Connect a wallet to post this Thesis.");
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
      toast("Enter a valid conviction amount.");
      return;
    }
    if (conviction <= 0n) {
      toast("Conviction must be greater than zero.");
      return;
    }

    const basket = compiled.basket.map((asset) => ({
      feed: asset.feed as Address,
      weightBps: asset.weight_bps,
    }));
    if (
      !isAddress(compiled.reference.feed) ||
      basket.some((asset) => !isAddress(asset.feed))
    ) {
      toast("The compiler returned an unapproved feed.");
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
          compiled.narrative,
          basket,
          compiled.reference.feed as Address,
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
      toast(formatError(error));
    }
  }

  return (
    <PageContainer>
      <PageHeader
        eyebrow="POST THESIS"
        title="Say it. Bond it."
        lede="Write a relative crypto opinion, confirm its Reference, and expose conviction to people willing to Fade it."
      />
      <div className="mt-8">
        <SplitLayout
          main={
            <PageSection title="1. What's your Thesis?">
              <Card>
                <form onSubmit={form.handleSubmit(compileNarrative)}>
                  <Label htmlFor="narrative">Narrative</Label>
                  <Textarea
                    id="narrative"
                    maxLength={280}
                    placeholder="HYPE will outperform BTC this week."
                    className="mt-2"
                    {...form.register("narrative")}
                  />
                  <div className="mt-2 flex justify-between text-meta text-text-3">
                    <span>
                      {form.formState.errors.narrative?.message ??
                        "Keep it clear and relative."}
                    </span>
                    <span>{form.watch("narrative").length}/280</span>
                  </div>
                  <Button
                    variant="primary"
                    type="submit"
                    className="mt-5"
                    disabled={compile.isPending}
                  >
                    {compile.isPending ? "Compiling…" : "Structure Thesis"}
                  </Button>
                </form>
              </Card>
            </PageSection>
          }
          aside={
            <PageSection title="2. Bond conviction">
              <Card>
                {compiled ? (
                  <>
                    <ThesisSpec spec={compiled} />
                    <Button
                      variant={referenceConfirmed ? "back" : "default"}
                      className="mt-5 w-full"
                      onClick={() =>
                        setReferenceConfirmed((confirmed) => !confirmed)
                      }
                      aria-pressed={referenceConfirmed}
                    >
                      {referenceConfirmed
                        ? `Reference confirmed: ${compiled.reference.symbol}`
                        : `Confirm Reference: ${compiled.reference.symbol}`}
                    </Button>
                    <form
                      onSubmit={form.handleSubmit(postThesis)}
                      className="mt-5 border-t border-border pt-5"
                    >
                      <Label htmlFor="conviction">
                        Creator Conviction (USDG)
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
                        The deployment fixes the Challenge window and settlement
                        horizon.
                      </p>
                      <Button
                        variant="primary"
                        type="submit"
                        className="mt-5 w-full"
                        disabled={transaction.isPending}
                      >
                        {transaction.isPending ? "Posting…" : "Bond & Post"}
                      </Button>
                      <TransactionFlow
                        phase={transaction.phase}
                        hash={transaction.hash}
                      />
                    </form>
                  </>
                ) : (
                  <p className="text-body text-text-2">
                    Your Thesis structure appears here before any wallet
                    transaction.
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
