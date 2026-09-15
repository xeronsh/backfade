export const Outcome = {
  Unresolved: 0,
  Back: 1,
  Fade: 2,
  Cancelled: 3,
} as const;

export type MarketState =
  | "OPEN"
  | "CLOSED"
  | "READY"
  | "CANCELLABLE"
  | "PROVEN"
  | "FAILED"
  | "CANCELLED";

export interface MarketClock {
  outcome: number;
  resolvesAt: bigint;
  settlementWindow: bigint;
  bettingEndsAt: bigint;
  now: bigint;
}

export function deriveMarketState(market: MarketClock): MarketState {
  if (market.outcome === Outcome.Back) return "PROVEN";
  if (market.outcome === Outcome.Fade) return "FAILED";
  if (market.outcome === Outcome.Cancelled) return "CANCELLED";
  if (market.now > market.resolvesAt + market.settlementWindow)
    return "CANCELLABLE";
  if (market.now >= market.resolvesAt) return "READY";
  if (market.now >= market.bettingEndsAt) return "CLOSED";
  return "OPEN";
}
