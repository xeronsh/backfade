import { Badge } from "@/components/ui/badge";
import type { MarketState } from "@/lib/market/state";
import { cn } from "@/lib/utils";

const tones: Record<MarketState, string> = {
  OPEN: "border-back text-back",
  CLOSED: "border-warning text-warning",
  READY: "border-info text-info",
  CANCELLABLE: "border-warning text-warning",
  PROVEN: "border-back bg-back-soft text-back",
  FAILED: "border-fade bg-fade-soft text-fade",
  CANCELLED: "text-text-3",
};

export function MarketStatus({ state }: { state: MarketState }) {
  return <Badge className={cn(tones[state])}>{state}</Badge>;
}
