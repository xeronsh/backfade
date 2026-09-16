import { ArrowDown, ArrowUp, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { parseUnits } from "viem";
import { TransactionFlow } from "@/components/backfade/TransactionFlow";
import { Metric, MetricGroup } from "@/components/data";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { MarketSummary } from "@/features/market/hooks";
import { useMarketPosition } from "@/features/market/hooks";
import { useTransaction } from "@/features/wallet/useTransaction";
import { formatAmount, formatError } from "@/lib/format";
import { addresses } from "@/lib/web3/addresses";
import { ERC20_ABI, MARKET_ABI } from "@/lib/web3/contracts";

export function PositionPanel({ market }: { market: MarketSummary }) {
  const [amount, setAmount] = useState("");
  const position = useMarketPosition(market.address);
  const transaction = useTransaction();
  const value = (() => {
    try {
      return parseUnits(amount || "0", 18);
    } catch {
      return 0n;
    }
  })();
  const canTrade = market.state === "OPEN" && value > 0n;

  async function act(side: "back" | "fade") {
    if (!canTrade) return;
    try {
      if ((position.data?.allowance ?? 0n) < value) {
        toast("Approval required — confirm the exact amount in your wallet.");
        await transaction.execute(
          {
            address: addresses.collateral,
            abi: ERC20_ABI,
            functionName: "approve",
            args: [market.address, value],
          },
          true,
        );
      }
      await transaction.execute({
        address: market.address,
        abi: MARKET_ABI,
        functionName: side,
        args: [value],
      });
      toast(`${side.toUpperCase()} confirmed.`);
      setAmount("");
    } catch (error) {
      toast(formatError(error), {
        description: "No page reload was used; chain state will refresh.",
      });
    }
  }

  return (
    <Card className="h-full">
      <div className="flex items-center gap-2">
        <ShieldCheck size={18} className="text-brand" aria-hidden="true" />
        <h2 className="text-narrative font-semibold">Position</h2>
      </div>
      <MetricGroup className="mt-5" columns={2}>
        <Metric
          label="Your BACK"
          value={formatAmount(position.data?.backStake)}
          accent="back"
        />
        <Metric
          label="Your FADE"
          value={formatAmount(position.data?.fadeStake)}
          accent="fade"
        />
      </MetricGroup>
      <Label className="mt-6" htmlFor="position-amount">
        Amount <span className="text-text-3">(USDG)</span>
      </Label>
      <Input
        id="position-amount"
        inputMode="decimal"
        value={amount}
        onChange={(event) => setAmount(event.target.value)}
        placeholder="0.00"
        className="mt-2 font-mono"
      />
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button
          variant="back"
          disabled={!canTrade || transaction.isPending}
          onClick={() => void act("back")}
        >
          <ArrowUp size={16} aria-hidden="true" /> BACK
        </Button>
        <Button
          variant="fade"
          disabled={!canTrade || transaction.isPending}
          onClick={() => void act("fade")}
        >
          <ArrowDown size={16} aria-hidden="true" /> FADE
        </Button>
      </div>
      {market.state === "OPEN" ? (
        <p className="mt-3 text-meta text-text-3">
          Exact approval only. Balance: {formatAmount(position.data?.balance)}{" "}
          USDG.
        </p>
      ) : (
        <p className="mt-3 text-meta text-warning">
          Positions are closed because this market is {market.state}.
        </p>
      )}
      <TransactionFlow phase={transaction.phase} hash={transaction.hash} />
    </Card>
  );
}
