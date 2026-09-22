import type { Address, Hash } from "viem";

export type ThesisState = "OPEN" | "LOCKED" | "SETTLED" | "CANCELLED";

export interface ThesisAsset {
  feed: Address;
  symbol: string;
  weightBps: bigint;
}

export interface ChallengerPosition {
  address: Address;
  stake: bigint;
  payout: bigint;
}

export type ThesisActivityKind =
  | "created"
  | "raised"
  | "challenge"
  | "settled"
  | "cancelled"
  | "claimed";

export interface ThesisActivity {
  kind: ThesisActivityKind;
  actor?: Address;
  amount?: bigint;
  note?: string;
  label: string;
  detail: string;
  blockNumber: bigint;
  transactionHash: Hash;
}

export interface ThesisSummary {
  address: Address;
  narrative: string;
  creator: Address;
  creatorBond: bigint;
  challengePool: bigint;
  openBounty: bigint;
  matchedConviction: bigint;
  challengeEndsAt: bigint;
  resolvesAt: bigint;
  settlementWindow: bigint;
  state: ThesisState;
  realizedAlphaBps: bigint;
  settledAt: bigint;
  creatorPayout: bigint;
  challengePayoutPool: bigint;
  /** Alpha that maps to a full Challenge Pool transfer; the creator's own terms. */
  payoutRangeBps: bigint;
}

export interface ThesisDetail extends ThesisSummary {
  basket: ThesisAsset[];
  reference: ThesisAsset;
  startPrices: bigint[];
  liveAlphaBps?: bigint;
  activities: ThesisActivity[];
  challengers: ChallengerPosition[];
  totalClaimed: bigint;
}
