import type { Address } from "viem";
import { describe, expect, it } from "vitest";
import { aggregateLeaderboard, calculateAlphaBps } from "./stats";
import type { ChallengerPosition, ThesisDetail } from "./types";

const creator = "0x0000000000000000000000000000000000000001" as const;
const faderA = "0x0000000000000000000000000000000000000002" as const;
const faderB = "0x0000000000000000000000000000000000000003" as const;

function challenger(
  address: Address,
  stake: bigint,
  payout: bigint,
): ChallengerPosition {
  return { address, stake, payout };
}

function thesis(overrides: Partial<ThesisDetail> = {}): ThesisDetail {
  return {
    address: "0x0000000000000000000000000000000000000010",
    narrative: "AMD will outperform TSLA.",
    creator,
    creatorBond: 1_000n,
    challengePool: 500n,
    openBounty: 500n,
    matchedConviction: 500n,
    challengeEndsAt: 1n,
    resolvesAt: 2n,
    settlementWindow: 3n,
    state: "SETTLED",
    realizedAlphaBps: 500n,
    settledAt: 2n,
    creatorPayout: 1_200n,
    challengePayoutPool: 300n,
    basket: [],
    reference: {
      feed: "0x0000000000000000000000000000000000000004",
      symbol: "TSLA",
      weightBps: 0n,
    },
    startPrices: [],
    activities: [],
    challengers: [
      challenger(faderA, 100n, 150n),
      challenger(faderB, 400n, 150n),
    ],
    totalClaimed: 0n,
    ...overrides,
  };
}

describe("leaderboard math", () => {
  it("aggregates creator and fader positive/negative P&L", () => {
    const rows = aggregateLeaderboard([thesis()]);
    expect(rows.map((row) => [row.address, row.pnl])).toEqual([
      [creator, 200n],
      [faderA, 50n],
      [faderB, -250n],
    ]);
  });

  it("splits creators and faders and uses matched capital for creator ROI", () => {
    const creators = aggregateLeaderboard([thesis()], "creators");
    const faders = aggregateLeaderboard([thesis()], "faders");
    expect(creators).toHaveLength(1);
    expect(creators[0].matchedCapital).toBe(500n);
    expect(creators[0].roiBps).toBe(4_000n);
    expect(faders).toHaveLength(2);
    expect(faders[0].address).toBe(faderA);
  });

  it("aggregates a wallet that creates and Fades", () => {
    const second = thesis({
      address: "0x0000000000000000000000000000000000000011",
      creator: faderA,
      creatorBond: 200n,
      matchedConviction: 100n,
      creatorPayout: 100n,
      challengers: [challenger(faderB, 50n, 75n)],
    });
    const row = aggregateLeaderboard([thesis(), second]).find(
      (item) => item.address === faderA,
    );
    expect(row?.pnl).toBe(-50n);
    expect(row?.resolvedPositions).toBe(2);
    expect(row?.counterparties).toBe(2);
  });

  it("keeps cancelled and unmatched positions at zero P&L and ROI", () => {
    const cancelled = thesis({
      state: "CANCELLED",
      creatorPayout: 1_000n,
      challengePayoutPool: 500n,
      challengers: [challenger(faderA, 500n, 500n)],
    });
    const unmatched = thesis({
      address: "0x0000000000000000000000000000000000000012",
      creator: "0x0000000000000000000000000000000000000013",
      matchedConviction: 0n,
      creatorPayout: 1_000n,
      challengers: [],
    });
    const rows = aggregateLeaderboard([cancelled, unmatched], "creators");
    expect(rows[0].pnl).toBe(0n);
    expect(rows[0].roiBps).toBe(0n);
    expect(rows[1].matchedCapital).toBe(0n);
    expect(rows[1].roiBps).toBe(0n);
  });

  it("calculates relative Alpha with bigint-only arithmetic", () => {
    expect(
      calculateAlphaBps(
        [{ startPrice: 100n, endPrice: 110n, weightBps: 10_000n }],
        { startPrice: 100n, endPrice: 100n },
      ),
    ).toBe(1_000n);
  });
});
