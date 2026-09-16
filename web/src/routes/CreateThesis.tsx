import { zodResolver } from "@hookform/resolvers/zod";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { type Address, decodeEventLog, isAddress, parseUnits } from "viem";
import { useAccount, usePublicClient, useSwitchChain } from "wagmi";
import { z } from "zod";
import { Reveal } from "@/components/backfade/Reveal";
import { ThesisSpec } from "@/components/backfade/ThesisSpec";
import { TransactionFlow } from "@/components/backfade/TransactionFlow";
import { DataRow, MetaLabel, MetricGroup } from "@/components/data";
import {
  PageContainer,
  PageHeader,
  PageSection,
  SplitLayout,
  Stepper,
} from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useTransaction } from "@/features/wallet/useTransaction";
import { useCompileThesis } from "@/lib/api/generated";
import type { ThesisSpec as GeneratedThesisSpec } from "@/lib/api/generated/model/thesisSpec";
import { config } from "@/lib/config";
import { formatBps, formatError } from "@/lib/format";
import { reveal, revealTransition, stagger } from "@/lib/motion";
import { addresses } from "@/lib/web3/addresses";
import { ERC20_ABI, FACTORY_ABI } from "@/lib/web3/contracts";

const ENTRY_WINDOW_SECONDS = 1800n;
const SECONDS_PER_DAY = 86_400n;

const schema = z.object({
  narrative: z
    .string()
    .trim()
    .min(12, "Write at least 12 characters.")
    .max(280, "Keep the narrative under 280 characters."),
  conviction: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

export default function CreateThesis() {
  const [compiled, setCompiled] = useState<GeneratedThesisSpec | null>(null);
  const reducedMotion = useReducedMotion();
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
        data: { text: values.narrative, preferred_duration_days: 30 },
      });
      if (result.status !== 200)
        throw new Error("The compiler returned an invalid response.");
      setCompiled(result.data);
      toast("Narrative compiled into a financial claim.");
    } catch (error) {
      toast(formatError(error, "Compiler unavailable. Try again."));
    }
  }

  async function launch() {
    if (!compiled) return;
    if (!account) {
      openConnectModal?.();
      toast("Connect a wallet to launch this thesis.");
      return;
    }
    if (chainId !== config.chainId) {
      switchChain({ chainId: config.chainId });
      return;
    }
    if (!publicClient) return;
    let conviction: bigint;
    try {
      conviction = parseUnits(form.getValues("conviction") ?? "", 18);
    } catch {
      toast("Enter a valid decimal amount.");
      return;
    }
    if (conviction <= 0n) {
      toast("Conviction must be greater than zero.");
      return;
    }
    const basket = compiled.basket
      .filter((asset) => isAddress(asset.feed))
      .map((asset) => ({
        feed: asset.feed as Address,
        weightBps: asset.weight_bps,
      }));
    if (basket.length !== compiled.basket.length) {
      toast("Compiler returned an invalid feed address.");
      return;
    }
    const now = BigInt(Math.floor(Date.now() / 1000));
    const params = {
      narrative: compiled.narrative,
      basket,
      benchmarkFeed: compiled.benchmark.feed as Address,
      hurdleBps: compiled.hurdle_bps,
      bettingEndsAt: now + ENTRY_WINDOW_SECONDS,
      resolvesAt: now + BigInt(compiled.duration_days) * SECONDS_PER_DAY,
      collateral: addresses.collateral,
    };
    try {
      const allowance = await publicClient.readContract({
        address: addresses.collateral,
        abi: ERC20_ABI,
        functionName: "allowance",
        args: [account, addresses.factory],
      });
      if (allowance < conviction) {
        toast("Approval required — confirm the exact amount in your wallet.");
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
        functionName: "createMarket",
        args: [params, conviction],
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
          if (event.eventName === "MarketCreated" && "market" in event.args) {
            navigate(`/market/${event.args.market}`);
            return;
          }
        } catch {
          /* unrelated log */
        }
      }
      toast(
        "Thesis confirmed, but the market address was not found in the receipt.",
      );
    } catch (error) {
      toast(formatError(error));
    }
  }

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Human narrative → financial claim"
        title="Create thesis"
        lede="Write the narrative. The compiler makes the claim explicit before you bond it."
        aside={
          <Stepper
            label="Thesis launch steps"
            steps={[
              "Frame the narrative",
              "Compile the claim",
              "Bond the conviction",
            ]}
          />
        }
      />
      <div className="mt-8">
        <SplitLayout
          asideWidth="wide"
          main={
            <PageSection
              title="Human narrative"
              description="Write the thesis in plain language."
            >
              <Reveal>
                <Card>
                  <form onSubmit={form.handleSubmit(compileNarrative)}>
                    <Label htmlFor="narrative">Narrative</Label>
                    <Textarea
                      id="narrative"
                      maxLength={280}
                      placeholder="AI infrastructure keeps outperforming…"
                      className="mt-2"
                      {...form.register("narrative")}
                    />
                    <div className="mt-2 flex justify-between text-meta text-text-3">
                      <span>
                        {form.formState.errors.narrative?.message ??
                          "Be precise. The market will measure this."}
                      </span>
                      <span>{form.watch("narrative").length}/280</span>
                    </div>
                    <Button
                      variant="primary"
                      type="submit"
                      className="mt-5"
                      disabled={compile.isPending}
                    >
                      {compile.isPending ? "Compiling…" : "Compile thesis"}
                    </Button>
                  </form>
                </Card>
              </Reveal>
            </PageSection>
          }
          aside={
            <PageSection title="Machine financial claim">
              <Reveal className="grid gap-4" delay={stagger.panel}>
                <AnimatePresence mode="wait" initial={false}>
                  {compiled ? (
                    <motion.div
                      key="compiled-claim"
                      variants={reveal}
                      initial={reducedMotion ? false : "hidden"}
                      animate="visible"
                      exit={reducedMotion ? undefined : "hidden"}
                      transition={revealTransition}
                    >
                      <ThesisSpec spec={compiled} />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="empty-claim"
                      initial={reducedMotion ? false : { opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={reducedMotion ? undefined : { opacity: 0 }}
                      transition={revealTransition}
                    >
                      <Card className="min-h-64 border-dashed bg-surface-2">
                        <MetaLabel>Compiled claim</MetaLabel>
                        <p className="mt-3 text-text-2">
                          Your ThesisSpec will appear here before any wallet
                          action.
                        </p>
                      </Card>
                    </motion.div>
                  )}
                </AnimatePresence>
                {compiled ? (
                  <Card>
                    <MetaLabel>Bond terms</MetaLabel>
                    <MetricGroup className="mt-4" columns={2} layout="rows">
                      <DataRow label="Entry closes">
                        {Number(ENTRY_WINDOW_SECONDS) / 60} minutes after launch
                      </DataRow>
                      <DataRow label="Resolves">
                        {compiled.duration_days} days after launch
                      </DataRow>
                      <DataRow label="Hurdle">
                        <span className="font-mono" data-financial>
                          {formatBps(compiled.hurdle_bps)}
                        </span>
                      </DataRow>
                      <DataRow label="Benchmark">
                        {compiled.benchmark.symbol}
                      </DataRow>
                    </MetricGroup>
                    <Label className="mt-6" htmlFor="conviction">
                      Creator conviction{" "}
                      <span className="text-text-3">(USDG)</span>
                    </Label>
                    <Input
                      id="conviction"
                      inputMode="decimal"
                      placeholder="500"
                      className="mt-2 font-mono"
                      {...form.register("conviction")}
                    />
                    <p className="mt-2 text-meta text-text-3">
                      Exact approval only. No infinite allowance.
                    </p>
                    <Button
                      variant="primary"
                      className="mt-5 w-full"
                      onClick={() => void launch()}
                      disabled={transaction.isPending}
                    >
                      {transaction.isPending
                        ? "Waiting for wallet…"
                        : "Launch thesis"}
                    </Button>
                    <TransactionFlow
                      phase={transaction.phase}
                      hash={transaction.hash}
                    />
                  </Card>
                ) : null}
              </Reveal>
            </PageSection>
          }
        />
      </div>
    </PageContainer>
  );
}
