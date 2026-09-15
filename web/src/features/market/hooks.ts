import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { type Address, isAddress } from "viem";
import { useAccount, usePublicClient } from "wagmi";
import { deriveMarketState, type MarketState } from "@/lib/market/state";
import { addresses } from "@/lib/web3/addresses";
import { ERC20_ABI, FACTORY_ABI, MARKET_ABI } from "@/lib/web3/contracts";

interface ContractResult {
  status: "success" | "failure";
  result?: unknown;
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

function readResult<T>(value: ContractResult | undefined): T | undefined {
  return value?.status === "success" ? (value.result as T) : undefined;
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

async function fetchMarkets(
  publicClient: NonNullable<ReturnType<typeof usePublicClient>>,
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
  const detailCalls = marketAddresses.flatMap((address) => [
    { address, abi: MARKET_ABI, functionName: "narrative" },
    { address, abi: MARKET_ABI, functionName: "hurdleBps" },
    { address, abi: MARKET_ABI, functionName: "bettingEndsAt" },
    { address, abi: MARKET_ABI, functionName: "resolvesAt" },
    { address, abi: MARKET_ABI, functionName: "settlementWindow" },
    { address, abi: MARKET_ABI, functionName: "creator" },
    { address, abi: MARKET_ABI, functionName: "creatorBond" },
    { address, abi: MARKET_ABI, functionName: "backPool" },
    { address, abi: MARKET_ABI, functionName: "fadePool" },
    { address, abi: MARKET_ABI, functionName: "outcome" },
    { address, abi: MARKET_ABI, functionName: "narrativeAlphaBps" },
  ]);
  const details = (await publicClient.multicall({
    contracts: detailCalls as never,
    allowFailure: true,
  })) as ContractResult[];
  return marketAddresses
    .map((address, index) => {
      const offset = index * 11;
      const summary = {
        address,
        narrative: readResult<string>(details[offset]) ?? "Untitled thesis",
        hurdleBps: Number(readResult<bigint>(details[offset + 1]) ?? 0n),
        bettingEndsAt: readResult<bigint>(details[offset + 2]) ?? 0n,
        resolvesAt: readResult<bigint>(details[offset + 3]) ?? 0n,
        settlementWindow: readResult<bigint>(details[offset + 4]) ?? 0n,
        creator: readResult<Address>(details[offset + 5]) ?? address,
        creatorBond: readResult<bigint>(details[offset + 6]) ?? 0n,
        backPool: readResult<bigint>(details[offset + 7]) ?? 0n,
        fadePool: readResult<bigint>(details[offset + 8]) ?? 0n,
        outcome: Number(readResult<bigint>(details[offset + 9]) ?? 0n),
        narrativeAlphaBps: readResult<bigint>(details[offset + 10]) ?? 0n,
      };
      return { ...summary, state: marketState(summary) };
    })
    .reverse();
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
    staleTime: 10_000,
  });
}

export function useMarket(address: Address | undefined) {
  const publicClient = usePublicClient();
  return useQuery({
    queryKey: ["market", address],
    queryFn: async () => {
      if (!publicClient || !address)
        throw new Error("Market address is not ready.");
      const markets = await fetchMarkets(publicClient);
      return markets.find(
        (market) => market.address.toLowerCase() === address.toLowerCase(),
      );
    },
    enabled: Boolean(publicClient && address),
    staleTime: 5_000,
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
