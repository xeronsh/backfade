import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { type Address, type Hash, isAddress } from "viem";
import { useAccount, usePublicClient } from "wagmi";
import { formatAmount, formatBps, shortAddress } from "@/lib/format";
import { deriveMarketState, type MarketState } from "@/lib/market/state";
import { addresses } from "@/lib/web3/addresses";
import {
  ERC20_ABI,
  FACTORY_ABI,
  MARKET_ABI,
  ORACLE_ABI,
} from "@/lib/web3/contracts";

interface ContractResult {
  status: "success" | "failure";
  result?: unknown;
}

type PublicClient = NonNullable<ReturnType<typeof usePublicClient>>;
type OracleLatestRound = readonly [bigint, bigint, bigint, bigint, bigint];

export interface MarketAsset {
  feed: Address;
  weightBps: bigint;
  symbol: string;
}

export interface ChainThesisSpec {
  source: "chain";
  narrative: string;
  basket: MarketAsset[];
  benchmark: { feed: Address; symbol: string };
  hurdleBps: number;
  durationSeconds: bigint;
}

export interface OracleObservation {
  feed: Address;
  symbol: string;
  decimals: number;
  roundId: bigint;
  answer: bigint;
  startedAt: bigint;
  updatedAt: bigint;
  answeredInRound: bigint;
  startPrice: bigint;
}

export type MarketActivityKind =
  | "created"
  | "position"
  | "resolved"
  | "cancelled"
  | "claimed";

export interface MarketActivity {
  kind: MarketActivityKind;
  label: string;
  detail: string;
  blockNumber: bigint;
  transactionHash: Hash;
}

export interface MarketSummary {
  address: Address;
  narrative: string;
  hurdleBps: number;
  bettingEndsAt: bigint;
  resolvesAt: bigint;
  settlementWindow: bigint;
  creator: Address;
  creatorBond: bigint;
  backPool: bigint;
  fadePool: bigint;
  outcome: number;
  narrativeAlphaBps: bigint;
  state: MarketState;
}

export interface MarketDetail extends MarketSummary {
  thesisSpec: ChainThesisSpec;
  basket: MarketAsset[];
  benchmarkFeed: Address;
  oracle: OracleObservation[];
  activity: MarketActivity[];
  totalClaimed: bigint;
}

function readResult<T>(value: ContractResult | undefined): T | undefined {
  return value?.status === "success" ? (value.result as T) : undefined;
}

export function requireContractResult<T>(
  value: ContractResult | undefined,
  label: string,
): T {
  const result = readResult<T>(value);
  if (result === undefined) {
    throw new Error(`Chain read incomplete: ${label}.`);
  }
  return result;
}

const feedSymbols: Record<string, string> = {
  "0x81b48ec24970aa75ae940e2492fda006071ac31b": "TSLA",
  "0x8d165612b0d63416141833834257386586f34224": "AMZN",
  "0x84206ed5ebf05b1519486742344d0499df875bd0": "PLTR",
  "0x5406fc983e7f84b544ff6fc855e06c22cf36a795": "AMD",
  "0xbf15aa8cb0f376db8fcb309347cb7375567bec6b": "NVDA",
  "0x7ca5707acc7a2b87c16b60848fb2582311be3b4f": "GME",
  "0x139c8342c1a138817d0a83872881cc8cec183749": "AAPL",
  "0x1f1699510abfdad90d82e2624136224b6b4ec7c8": "COIN",
  "0xa022d2d137fe6e8980666db672cb92005a8a78b9": "META",
  "0x5ca7a619217e5effd9b57ba58cc5981aece1bec6": "NFLX",
};

function feedSymbol(feed: Address) {
  return feedSymbols[feed.toLowerCase()] ?? shortAddress(feed);
}

function marketState(summary: Omit<MarketSummary, "state">): MarketState {
  return deriveMarketState({
    outcome: summary.outcome,
    resolvesAt: summary.resolvesAt,
    settlementWindow: summary.settlementWindow,
    bettingEndsAt: summary.bettingEndsAt,
    now: BigInt(Math.floor(Date.now() / 1000)),
  });
}

const summaryFunctions = [
  "narrative",
  "hurdleBps",
  "bettingEndsAt",
  "resolvesAt",
  "settlementWindow",
  "creator",
  "creatorBond",
  "backPool",
  "fadePool",
  "outcome",
  "narrativeAlphaBps",
] as const;

function summaryFromResults(
  address: Address,
  details: ContractResult[],
  offset = 0,
): Omit<MarketSummary, "state"> {
  return {
    address,
    narrative:
      requireContractResult<string>(details[offset], "narrative") ||
      "Untitled thesis",
    hurdleBps: Number(
      requireContractResult<bigint>(details[offset + 1], "hurdleBps"),
    ),
    bettingEndsAt: requireContractResult<bigint>(
      details[offset + 2],
      "bettingEndsAt",
    ),
    resolvesAt: requireContractResult<bigint>(
      details[offset + 3],
      "resolvesAt",
    ),
    settlementWindow: requireContractResult<bigint>(
      details[offset + 4],
      "settlementWindow",
    ),
    creator: requireContractResult<Address>(details[offset + 5], "creator"),
    creatorBond: requireContractResult<bigint>(
      details[offset + 6],
      "creatorBond",
    ),
    backPool: requireContractResult<bigint>(details[offset + 7], "backPool"),
    fadePool: requireContractResult<bigint>(details[offset + 8], "fadePool"),
    outcome: Number(
      requireContractResult<bigint>(details[offset + 9], "outcome"),
    ),
    narrativeAlphaBps: requireContractResult<bigint>(
      details[offset + 10],
      "narrativeAlphaBps",
    ),
  };
}

async function fetchMarkets(
  publicClient: PublicClient,
): Promise<MarketSummary[]> {
  const count = Number(
    await publicClient.readContract({
      address: addresses.factory,
      abi: FACTORY_ABI,
      functionName: "marketsLength",
    }),
  );
  if (count === 0) return [];
  const marketCalls = Array.from({ length: count }, (_, index) => ({
    address: addresses.factory,
    abi: FACTORY_ABI,
    functionName: "marketAt",
    args: [BigInt(index)],
  }));
  const marketResults = (await publicClient.multicall({
    contracts: marketCalls as never,
    allowFailure: true,
  })) as ContractResult[];
  const marketAddresses = marketResults
    .map((item) => readResult<string>(item))
    .filter((value): value is Address => Boolean(value && isAddress(value)));
  const detailCalls = marketAddresses.flatMap((address) =>
    summaryFunctions.map((functionName) => ({
      address,
      abi: MARKET_ABI,
      functionName,
    })),
  );
  const details = (await publicClient.multicall({
    contracts: detailCalls as never,
    allowFailure: true,
  })) as ContractResult[];
  return marketAddresses
    .map((address, index) => {
      const offset = index * summaryFunctions.length;
      try {
        const summary = summaryFromResults(address, details, offset);
        return { ...summary, state: marketState(summary) };
      } catch {
        return undefined;
      }
    })
    .filter((market): market is MarketSummary => Boolean(market))
    .reverse();
}

async function fetchActivity(
  publicClient: PublicClient,
  address: Address,
): Promise<MarketActivity[]> {
  const eventAbi = MARKET_ABI.filter((item) => item.type === "event");
  const logs = (await publicClient.getLogs({
    address,
    events: eventAbi as never,
  })) as Array<{
    eventName?: string;
    args?: Record<string, unknown>;
    blockNumber?: bigint;
    transactionHash?: Hash;
  }>;

  return logs
    .map((log) => {
      if (
        !log.eventName ||
        !log.args ||
        log.blockNumber === undefined ||
        !log.transactionHash
      ) {
        throw new Error("Chain activity data incomplete.");
      }
      const args = log.args;
      switch (log.eventName) {
        case "MarketCreated": {
          const creator = args.creator as Address;
          return {
            kind: "created" as const,
            label: "Market created",
            detail: `Creator ${shortAddress(creator)} bonded ${formatAmount(args.creatorBond as bigint)} USDG.`,
            blockNumber: log.blockNumber,
            transactionHash: log.transactionHash,
          };
        }
        case "PositionTaken": {
          const side = Number(args.side);
          const amount = args.amount as bigint;
          return {
            kind: "position" as const,
            label: `${side === 0 ? "BACK" : "FADE"} position`,
            detail: `${formatAmount(amount)} USDG · ${shortAddress(args.user as Address)} · pools ${formatAmount(args.backPool as bigint)} / ${formatAmount(args.fadePool as bigint)} USDG`,
            blockNumber: log.blockNumber,
            transactionHash: log.transactionHash,
          };
        }
        case "MarketResolved": {
          const outcome = Number(args.outcome);
          return {
            kind: "resolved" as const,
            label: "Market resolved",
            detail: `${outcome === 1 ? "BACK" : "FADE"} · alpha ${formatBps(args.narrativeAlphaBps as bigint)}`,
            blockNumber: log.blockNumber,
            transactionHash: log.transactionHash,
          };
        }
        case "MarketCancelled":
          return {
            kind: "cancelled" as const,
            label: "Market cancelled",
            detail: "Positions can be refunded.",
            blockNumber: log.blockNumber,
            transactionHash: log.transactionHash,
          };
        case "Claimed":
          return {
            kind: "claimed" as const,
            label: "Position claimed",
            detail: `${shortAddress(args.user as Address)} received ${formatAmount(args.payout as bigint)} USDG.`,
            blockNumber: log.blockNumber,
            transactionHash: log.transactionHash,
          };
        default:
          return undefined;
      }
    })
    .filter((activity): activity is MarketActivity => Boolean(activity))
    .sort((left, right) => (left.blockNumber > right.blockNumber ? -1 : 1));
}

async function fetchMarketDetail(
  publicClient: PublicClient,
  address: Address,
): Promise<MarketDetail> {
  const baseCalls = [
    ...summaryFunctions.map((functionName) => ({
      address,
      abi: MARKET_ABI,
      functionName,
    })),
    { address, abi: MARKET_ABI, functionName: "basketLength" },
    { address, abi: MARKET_ABI, functionName: "benchmarkFeed" },
    { address, abi: MARKET_ABI, functionName: "totalClaimed" },
  ];
  const baseResults = (await publicClient.multicall({
    contracts: baseCalls as never,
    allowFailure: true,
  })) as ContractResult[];
  const summary = summaryFromResults(address, baseResults);
  const basketLength = Number(
    requireContractResult<bigint>(
      baseResults[summaryFunctions.length],
      "basketLength",
    ),
  );
  if (basketLength < 1 || basketLength > 5) {
    throw new Error("Chain read invalid: basketLength.");
  }
  const benchmarkFeed = requireContractResult<Address>(
    baseResults[summaryFunctions.length + 1],
    "benchmarkFeed",
  );
  const totalClaimed = requireContractResult<bigint>(
    baseResults[summaryFunctions.length + 2],
    "totalClaimed",
  );

  const basketResults = (await publicClient.multicall({
    contracts: Array.from({ length: basketLength }, (_, index) => ({
      address,
      abi: MARKET_ABI,
      functionName: "basketAsset",
      args: [BigInt(index)],
    })) as never,
    allowFailure: true,
  })) as ContractResult[];
  const basket = basketResults.map((result, index) => {
    const asset = requireContractResult<readonly [Address, bigint]>(
      result,
      `basket[${index}]`,
    );
    return {
      feed: asset[0],
      weightBps: asset[1],
      symbol: feedSymbol(asset[0]),
    };
  });
  const feeds = [...basket.map((asset) => asset.feed), benchmarkFeed];
  const startPriceResults = (await publicClient.multicall({
    contracts: feeds.map((_feed, index) => ({
      address,
      abi: MARKET_ABI,
      functionName: "startPrices",
      args: [BigInt(index)],
    })) as never,
    allowFailure: true,
  })) as ContractResult[];
  const oracleResults = (await publicClient.multicall({
    contracts: feeds.flatMap((feed) => [
      { address: feed, abi: ORACLE_ABI, functionName: "decimals" },
      { address: feed, abi: ORACLE_ABI, functionName: "latestRoundData" },
    ]) as never,
    allowFailure: true,
  })) as ContractResult[];
  const oracle = feeds.map((feed, index) => {
    const decimals = Number(
      requireContractResult<bigint | number>(
        oracleResults[index * 2],
        `${feedSymbol(feed)} decimals`,
      ),
    );
    const [roundId, answer, startedAt, updatedAt, answeredInRound] =
      requireContractResult<OracleLatestRound>(
        oracleResults[index * 2 + 1],
        `${feedSymbol(feed)} latestRoundData`,
      );
    return {
      feed,
      symbol: feedSymbol(feed),
      decimals,
      roundId,
      answer,
      startedAt,
      updatedAt,
      answeredInRound,
      startPrice: requireContractResult<bigint>(
        startPriceResults[index],
        `${feedSymbol(feed)} startPrice`,
      ),
    };
  });
  const activity = await fetchActivity(publicClient, address);
  const detailSummary = { ...summary, state: marketState(summary) };
  return {
    ...detailSummary,
    thesisSpec: {
      source: "chain",
      narrative: summary.narrative,
      basket,
      benchmark: { feed: benchmarkFeed, symbol: feedSymbol(benchmarkFeed) },
      hurdleBps: summary.hurdleBps,
      durationSeconds: summary.resolvesAt - summary.bettingEndsAt,
    },
    basket,
    benchmarkFeed,
    oracle,
    activity,
    totalClaimed,
  };
}

export function useMarkets() {
  const publicClient = usePublicClient();
  return useQuery({
    queryKey: ["markets"],
    queryFn: () =>
      publicClient
        ? fetchMarkets(publicClient)
        : Promise.reject(new Error("Blockchain client is not ready.")),
    enabled: Boolean(publicClient),
    staleTime: 5_000,
    refetchInterval: 15_000,
    refetchIntervalInBackground: true,
  });
}

export function useMarket(address: Address | undefined) {
  const publicClient = usePublicClient();
  return useQuery<MarketDetail | undefined>({
    queryKey: ["market", address],
    queryFn: async () => {
      if (!publicClient || !address)
        throw new Error("Market address is not ready.");
      try {
        return await fetchMarketDetail(publicClient, address);
      } catch (error) {
        throw new Error(
          error instanceof Error
            ? error.message
            : "Chain market data is incomplete.",
        );
      }
    },
    enabled: Boolean(publicClient && address),
    staleTime: 0,
    refetchInterval: 5_000,
    refetchIntervalInBackground: true,
  });
}

export interface Position {
  backStake: bigint;
  fadeStake: bigint;
  allowance: bigint;
  balance: bigint;
}

export function useMarketPosition(market: Address | undefined) {
  const publicClient = usePublicClient();
  const { address: user } = useAccount();
  return useQuery<Position | undefined>({
    queryKey: ["position", market, user],
    queryFn: async () => {
      if (!publicClient || !market || !user)
        throw new Error("Wallet position is not ready.");
      const calls = [
        {
          address: market,
          abi: MARKET_ABI,
          functionName: "backStake",
          args: [user],
        },
        {
          address: market,
          abi: MARKET_ABI,
          functionName: "fadeStake",
          args: [user],
        },
        {
          address: addresses.collateral,
          abi: ERC20_ABI,
          functionName: "allowance",
          args: [user, market],
        },
        {
          address: addresses.collateral,
          abi: ERC20_ABI,
          functionName: "balanceOf",
          args: [user],
        },
      ];
      const results = (await publicClient.multicall({
        contracts: calls as never,
        allowFailure: true,
      })) as ContractResult[];
      return {
        backStake: readResult<bigint>(results[0]) ?? 0n,
        fadeStake: readResult<bigint>(results[1]) ?? 0n,
        allowance: readResult<bigint>(results[2]) ?? 0n,
        balance: readResult<bigint>(results[3]) ?? 0n,
      };
    },
    enabled: Boolean(publicClient && market && user),
    staleTime: 5_000,
    refetchInterval: 5_000,
    refetchIntervalInBackground: true,
  });
}

export function useCreatorMarkets(creator: Address | undefined) {
  const markets = useMarkets();
  return {
    ...markets,
    data: useMemo(
      () =>
        markets.data?.filter(
          (market) => market.creator.toLowerCase() === creator?.toLowerCase(),
        ),
      [creator, markets.data],
    ),
  };
}
