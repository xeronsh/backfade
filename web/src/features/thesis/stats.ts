import type { Address } from "viem";
import type { ThesisDetail, ThesisState } from "./types";

export type LeaderboardMode = "overall" | "creators" | "faders";

export interface LeaderboardEntry {
  address: Address;
  pnl: bigint;
  roiBps: bigint;
  matchedCapital: bigint;
  resolvedPositions: number;
  counterparties: number;
}

type MutableEntry = LeaderboardEntry & { counterpartySet: Set<string> };

function isResolved(state: ThesisState) {
  return state === "SETTLED" || state === "CANCELLED";
}

function getEntry(
  entries: Map<string, MutableEntry>,
  address: Address,
): MutableEntry {
  const key = address.toLowerCase();
  const current = entries.get(key);
  if (current) return current;
  const created: MutableEntry = {
    address,
    pnl: 0n,
    roiBps: 0n,
    matchedCapital: 0n,
    resolvedPositions: 0,
    counterparties: 0,
    counterpartySet: new Set(),
  };
  entries.set(key, created);
  return created;
}

function addPosition(
  entries: Map<string, MutableEntry>,
  address: Address,
  pnl: bigint,
  capital: bigint,
  counterparty?: Address,
) {
  const entry = getEntry(entries, address);
  entry.pnl += pnl;
  entry.matchedCapital += capital;
  entry.resolvedPositions += 1;
  if (counterparty) entry.counterpartySet.add(counterparty.toLowerCase());
  entry.counterparties = entry.counterpartySet.size;
}

export function aggregateLeaderboard(
  theses: ThesisDetail[],
  mode: LeaderboardMode = "overall",
): LeaderboardEntry[] {
  const entries = new Map<string, MutableEntry>();
  for (const thesis of theses) {
    if (!isResolved(thesis.state)) continue;
    if (mode === "overall" || mode === "creators") {
      const creator = getEntry(entries, thesis.creator);
      creator.pnl += thesis.creatorPayout - thesis.creatorBond;
      creator.matchedCapital += thesis.matchedConviction;
      creator.resolvedPositions += 1;
      for (const challenger of thesis.challengers) {
        creator.counterpartySet.add(challenger.address.toLowerCase());
      }
      creator.counterparties = creator.counterpartySet.size;
    }
    if (mode === "overall" || mode === "faders") {
      for (const challenger of thesis.challengers) {
        addPosition(
          entries,
          challenger.address,
          challenger.payout - challenger.stake,
          challenger.stake,
          thesis.creator,
        );
      }
    }
  }

  return [...entries.values()]
    .map(({ counterpartySet: _counterpartySet, ...entry }) => ({
      ...entry,
      roiBps:
        entry.matchedCapital === 0n
          ? 0n
          : (entry.pnl * 10_000n) / entry.matchedCapital,
    }))
    .sort((left, right) => {
      if (left.pnl !== right.pnl) return left.pnl > right.pnl ? -1 : 1;
      return left.address
        .toLowerCase()
        .localeCompare(right.address.toLowerCase());
    });
}

const PRICE_SCALE = 1_000_000_000_000_000_000n;

function returnBps(startPrice: bigint, endPrice: bigint) {
  return (
    (((endPrice * PRICE_SCALE) / startPrice - PRICE_SCALE) * 10_000n) /
    PRICE_SCALE
  );
}

export function calculateAlphaBps(
  basket: Array<{ startPrice: bigint; endPrice: bigint; weightBps: bigint }>,
  reference: { startPrice: bigint; endPrice: bigint },
): bigint {
  const weightedBasketReturn = basket.reduce(
    (sum, asset) =>
      sum + returnBps(asset.startPrice, asset.endPrice) * asset.weightBps,
    0n,
  );
  const basketReturn = weightedBasketReturn / 10_000n;
  return basketReturn - returnBps(reference.startPrice, reference.endPrice);
}
