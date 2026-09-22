import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useQueryClient } from "@tanstack/react-query";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import { parseUnits } from "viem";
import { useAccount, useSwitchChain } from "wagmi";
import { TransactionFlow } from "@/components/backfade/TransactionFlow";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useThesisPosition } from "@/features/thesis/hooks";
import type { ThesisDetail } from "@/features/thesis/types";
import { useTransaction } from "@/features/wallet/useTransaction";
import { formatPayoutRange } from "@/lib/bet";
import { config } from "@/lib/config";
import { formatAmount, formatError } from "@/lib/format";
import { useLocale } from "@/lib/locale-provider";
import { addresses } from "@/lib/web3/addresses";
import { ERC20_ABI, THESIS_ABI } from "@/lib/web3/contracts";

export function ChallengeComposer({ thesis }: { thesis: ThesisDetail }) {
  const { t, locale } = useLocale();
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const transaction = useTransaction();
  const queryClient = useQueryClient();
  const position = useThesisPosition(thesis.address);
  const { address: account, chainId } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { switchChain } = useSwitchChain();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (thesis.state !== "OPEN") {
      toast(t("challenge.closed"));
      return;
    }
    if (!account) {
      openConnectModal?.();
      toast(t("challenge.connect"));
      return;
    }
    if (chainId !== config.chainId) {
      switchChain({ chainId: config.chainId });
      return;
    }
    if (!note.trim() || new TextEncoder().encode(note).length > 280) {
      toast(t("challenge.noteError"));
      return;
    }
    let stake: bigint;
    try {
      stake = parseUnits(amount, 18);
    } catch {
      toast(t("challenge.amountInvalid"));
      return;
    }
    if (stake <= 0n) {
      toast(t("challenge.amountZero"));
      return;
    }
    if (stake > thesis.openBounty) {
      toast(t("challenge.amountExceeds"));
      return;
    }

    try {
      if ((position.data?.allowance ?? 0n) < stake) {
        await transaction.execute(
          {
            address: addresses.collateral,
            abi: ERC20_ABI,
            functionName: "approve",
            args: [thesis.address, stake],
          },
          true,
        );
      }
      await transaction.execute({
        address: thesis.address,
        abi: THESIS_ABI,
        functionName: "challenge",
        args: [stake, note.trim()],
      });
      setAmount("");
      setNote("");
      await queryClient.refetchQueries({
        queryKey: ["thesis", thesis.address],
      });
    } catch (error) {
      toast(formatError(error, locale));
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-4">
      <div>
        <Label htmlFor="challenge-note">{t("challenge.write")}</Label>
        <Textarea
          id="challenge-note"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          maxLength={280}
          placeholder={t("challenge.placeholder")}
          className="mt-2 min-h-28"
        />
        <p className="mt-2 text-meta text-text-3">
          {t("challenge.noteBytes", {
            used: new TextEncoder().encode(note).length,
          })}
        </p>
      </div>
      <div>
        <Label htmlFor="fade-amount">{t("challenge.amountLabel")}</Label>
        <Input
          id="fade-amount"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          inputMode="decimal"
          placeholder={formatAmount(thesis.openBounty, 18, 0)}
          className="mt-2"
        />
      </div>
      <div className="flex items-baseline justify-between border-y border-border py-3 text-body">
        <span className="text-text-3">{t("challenge.openBounty")}</span>
        <span className="font-mono font-semibold text-brand" data-financial>
          {formatAmount(thesis.openBounty)} USDG
        </span>
      </div>
      <div className="flex items-baseline justify-between border-b border-border pb-3 text-body">
        <span className="text-text-3">{t("challenge.terms")}</span>
        <span className="font-mono font-semibold text-text-1" data-financial>
          {formatPayoutRange(Number(thesis.payoutRangeBps))}
        </span>
      </div>
      <Button variant="fade" type="submit" disabled={transaction.isPending}>
        {transaction.isPending ? t("challenge.fading") : t("challenge.submit")}
      </Button>
      <TransactionFlow phase={transaction.phase} hash={transaction.hash} />
    </form>
  );
}
