// Market lifecycle state derivation.
//
// Kept separate from the page so the branch logic — which decides whether a user sees
// Resolve, Claim, Cancel or Refund — is directly testable. Getting this wrong is how a user
// ends up staring at a button that can only revert.
import type { MarketState } from "./components/MarketStatus";

/// Onchain `Outcome` enum. Keep in sync with contracts/src/ThesisMarket.sol.
export const Outcome = {
  Unresolved: 0,
  Back: 1,
  Fade: 2,
  Cancelled: 3,
} as const;

export interface MarketClock {
  outcome: number;
  resolvesAt: bigint;
  settlementWindow: bigint;
  bettingEndsAt: bigint;
  now: bigint;
}

export function marketState(m: MarketClock): MarketState {
  if (m.outcome === Outcome.Back) return "PROVEN";
  if (m.outcome === Outcome.Fade) return "FAILED";
  if (m.outcome === Outcome.Cancelled) return "CANCELLED";

  // Past the settlement window no acceptable oracle print can exist any more, so resolve()
  // can never succeed. Offering "Resolve" here would only produce a revert; the market is
  // cancellable, which refunds everyone.
  if (m.now > m.resolvesAt + m.settlementWindow) return "CANCELLABLE";
  if (m.now >= m.resolvesAt) return "READY";
  if (m.now >= m.bettingEndsAt) return "CLOSED";
  return "OPEN";
}
