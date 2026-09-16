import { useConnectModal } from "@rainbow-me/rainbowkit";
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
import { config } from "@/lib/config";
import { formatAmount, formatError } from "@/lib/format";
import { addresses } from "@/lib/web3/addresses";
import { ERC20_ABI, THESIS_ABI } from "@/lib/web3/contracts";

export function ChallengeComposer({ thesis }: { thesis: ThesisDetail }) {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const transaction = useTransaction();
  const position = useThesisPosition(thesis.address);
  const { address: account, chainId } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { switchChain } = useSwitchChain();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (thesis.state !== "OPEN") {
      toast("The Challenge window is closed.");
      return;
    }
    if (!account) {
      openConnectModal?.();
      toast("Connect a wallet to Fade this Thesis.");
      return;
    }
    if (chainId !== config.chainId) {
      switchChain({ chainId: config.chainId });
      return;
    }
    if (!note.trim() || new TextEncoder().encode(note).length > 280) {
      toast("Challenge note must be 1–280 UTF-8 bytes.");
      return;
    }
    let stake: bigint;
    try {
      stake = parseUnits(amount, 18);
    } catch {
      toast("Enter a valid Fade amount.");
      return;
    }
    if (stake <= 0n) {
      toast("Fade amount must be greater than zero.");
      return;
    }
    if (stake > thesis.openBounty) {
      toast("Fade amount cannot exceed the Open Bounty.");
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
    } catch (error) {
      toast(formatError(error));
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-4">
      <div>
        <Label htmlFor="challenge-note">Write your Challenge</Label>
        <Textarea
          id="challenge-note"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          maxLength={280}
          placeholder="Unlock pressure is underestimated."
          className="mt-2 min-h-28"
        />
        <p className="mt-2 text-meta text-text-3">
          {new TextEncoder().encode(note).length}/280 UTF-8 bytes
        </p>
      </div>
      <div>
        <Label htmlFor="fade-amount">Fade amount (USDG)</Label>
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
        <span className="text-text-3">Open Bounty</span>
        <span className="font-mono font-semibold text-brand" data-financial>
          {formatAmount(thesis.openBounty)} USDG
        </span>
      </div>
      <Button variant="fade" type="submit" disabled={transaction.isPending}>
        {transaction.isPending ? "Fading…" : "Fade this Thesis"}
      </Button>
      <TransactionFlow phase={transaction.phase} hash={transaction.hash} />
    </form>
  );
}
