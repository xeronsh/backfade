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
import { useLocale } from "@/lib/locale-provider";
import { addresses } from "@/lib/web3/addresses";
import { ERC20_ABI, MARKET_ABI } from "@/lib/web3/contracts";

export function PositionPanel({ market }: { market: MarketSummary }) {
  const { t, locale } = useLocale();
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
      toast(formatError(error, locale), {
        description: "No page reload was used; chain state will refresh.",
      });
    }
  }

  return (
    <Card className="h-full">
      <h2 className="text-narrative font-semibold">{t("position.title")}</h2>
      <MetricGroup className="mt-5" columns={2}>
        <Metric
          label={t("position.yourBack")}
          value={formatAmount(position.data?.backStake)}
          accent="back"
        />
        <Metric
          label={t("position.yourFade")}
          value={formatAmount(position.data?.fadeStake)}
          accent="fade"
        />
      </MetricGroup>
      <Label className="mt-6" htmlFor="position-amount">
        {t("position.amount")} <span className="text-text-3">(USDG)</span>
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
          BACK
        </Button>
        <Button
          variant="fade"
          disabled={!canTrade || transaction.isPending}
          onClick={() => void act("fade")}
        >
          FADE
        </Button>
      </div>
      {market.state === "OPEN" ? (
        <p className="mt-3 text-meta text-text-3">
          {t("position.exactApproval", {
            amount: formatAmount(position.data?.balance),
          })}
        </p>
      ) : (
        <p className="mt-3 text-meta text-warning">
          {t("position.closed", { state: market.state })}
        </p>
      )}
      <TransactionFlow phase={transaction.phase} hash={transaction.hash} />
    </Card>
  );
}
