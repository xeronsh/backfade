import { describe, expect, it } from "vitest";
import { deriveMarketState, Outcome } from "@/lib/market/state";

const base = {
  outcome: Outcome.Unresolved,
  resolvesAt: 1_000_000n,
  settlementWindow: 1_800n,
  bettingEndsAt: 999_100n,
};

describe("deriveMarketState", () => {
  it.each([
    [999_000n, "OPEN"],
    [999_500n, "CLOSED"],
    [1_000_000n, "READY"],
    [1_001_800n, "READY"],
    [1_001_801n, "CANCELLABLE"],
  ])("derives %s at %s", (now, expected) => {
    expect(deriveMarketState({ ...base, now })).toBe(expected);
  });

  it.each([
    [Outcome.Back, "PROVEN"],
    [Outcome.Fade, "FAILED"],
    [Outcome.Cancelled, "CANCELLED"],
  ] as const)("keeps settled outcome %s", (outcome, expected) => {
    expect(deriveMarketState({ ...base, now: 2_000_000n, outcome })).toBe(
      expected,
    );
  });
});
