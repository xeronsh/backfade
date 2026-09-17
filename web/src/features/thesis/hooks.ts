import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { type Address, type Hash, isAddress } from "viem";
import { useAccount, usePublicClient } from "wagmi";
import {
  type ContractResult,
  readContractResult,
  requireContractResult,
} from "@/features/thesis/chainReads";
import { config } from "@/lib/config";
import { formatAmount, formatBps, shortAddress } from "@/lib/format";
import { addresses } from "@/lib/web3/addresses";
import {
  ERC20_ABI,
  FACTORY_ABI,
  ORACLE_ABI,
  THESIS_ABI,
} from "@/lib/web3/contracts";
import {
  aggregateLeaderboard,
  calculateAlphaBps,
  type LeaderboardEntry,
  type LeaderboardMode,
} from "./stats";
import type {
  ChallengerPosition,
  ThesisActivity,
  ThesisDetail,
  ThesisState,
  ThesisSummary,
} from "./types";

export type PublicClient = NonNullable<ReturnType<typeof usePublicClient>>;
type RoundData = readonly [bigint, bigint, bigint, bigint, bigint];

async function readContracts(
  publicClient: PublicClient,
  contracts: readonly unknown[],
): Promise<ContractResult[]> {
  if (!config.disableMulticall) {
    return (await publicClient.multicall({
      contracts: contracts as never,
      allowFailure: true,
    })) as ContractResult[];
  }
  const results: ContractResult[] = [];
  for (const contract of contracts) {
    try {
      const result = await publicClient.readContract(contract as never);
      results.push({
        status: "success",
        result,
      });
    } catch {
      results.push({ status: "failure" });
    }
  }
  return results;
}

const feedSymbols: Record<string, string> = {
  "0x81b48ec24970aa75ae940e2492fda006071ac31b": "TSLA",
  "0x84206ed5ebf05b1519486742344d0499df875bd0": "PLTR",
  "0x5406fc983e7f84b544ff6fc855e06c22cf36a795": "AMD",
  "0xbf15aa8cb0f376db8fcb309347cb7375567bec6b": "NVDA",
  "0x7ca5707acc7a2b87c16b60848fb2582311be3b4f": "GME",
  "0x139c8342c1a138817d0a83872881cc8cec183749": "AAPL",
  "0x1f1699510abfdad90d82e2624136224b6b4ec7c8": "COIN",
};

function feedSymbol(feed: Address) {
  return feedSymbols[feed.toLowerCase()] ?? shortAddress(feed);
}

function stateName(value: bigint): ThesisState {
  const state = (["OPEN", "LOCKED", "SETTLED", "CANCELLED"] as const)[
    Number(value)
  ];
  if (!state) throw new Error("Chain read invalid: thesis state.");
  return state;
}

const summaryFunctions = [
  "narrative",
  "creator",
  "creatorBond",
  "challengePool",
  "openBounty",
  "matchedConviction",
  "challengeEndsAt",
  "resolvesAt",
  "settlementWindow",
  "state",
  "realizedAlphaBps",
  "settledAt",
  "creatorPayout",
  "challengePayoutPool",
] as const;

function summaryFromResults(
  address: Address,
  results: ContractResult[],
  offset = 0,
): ThesisSummary {
  return {
    address,
    narrative: requireContractResult<string>(results[offset], "narrative"),
    creator: requireContractResult<Address>(results[offset + 1], "creator"),
    creatorBond: requireContractResult<bigint>(
      results[offset + 2],
      "creatorBond",
    ),
    challengePool: requireContractResult<bigint>(
      results[offset + 3],
      "challengePool",
    ),
    openBounty: requireContractResult<bigint>(
      results[offset + 4],
      "openBounty",
    ),
    matchedConviction: requireContractResult<bigint>(
      results[offset + 5],
      "matchedConviction",
    ),
    challengeEndsAt: requireContractResult<bigint>(
      results[offset + 6],
      "challengeEndsAt",
    ),
    resolvesAt: requireContractResult<bigint>(
      results[offset + 7],
      "resolvesAt",
    ),
    settlementWindow: requireContractResult<bigint>(
      results[offset + 8],
      "settlementWindow",
    ),
    state: stateName(
      requireContractResult<bigint>(results[offset + 9], "state"),
    ),
    realizedAlphaBps: requireContractResult<bigint>(
      results[offset + 10],
      "realizedAlphaBps",
    ),
    settledAt: requireContractResult<bigint>(results[offset + 11], "settledAt"),
    creatorPayout: requireContractResult<bigint>(
      results[offset + 12],
      "creatorPayout",
    ),
    challengePayoutPool: requireContractResult<bigint>(
      results[offset + 13],
      "challengePayoutPool",
    ),
  };
}

async function fetchSummary(publicClient: PublicClient, address: Address) {
  const results = await readContracts(
    publicClient,
    summaryFunctions.map((functionName) => ({
      address,
      abi: THESIS_ABI,
      functionName,
    })),
  );
  return summaryFromResults(address, results);
}

function normalizePrice(answer: bigint, decimals: bigint) {
  const decimalCount = Number(decimals);
  if (decimalCount <= 18) return answer * 10n ** BigInt(18 - decimalCount);
  return answer / 10n ** BigInt(decimalCount - 18);
}

async function fetchActivities(
  publicClient: PublicClient,
  address: Address,
): Promise<ThesisActivity[]> {
  const eventAbi = THESIS_ABI.filter((item) => item.type === "event");
  const latestBlock = await publicClient.getBlockNumber({ cacheTime: 0 });
  const fromBlock = BigInt(config.factoryDeploymentBlock);
  if (latestBlock < fromBlock) return [];
  const logs = (await publicClient.getLogs({
    address,
    events: eventAbi as never,
    fromBlock,
    toBlock: latestBlock,
  })) as Array<{
    eventName?: string;
    args?: Record<string, unknown>;
    blockNumber?: bigint;
    transactionHash?: Hash;
  }>;

  return logs
    .map((log): ThesisActivity | undefined => {
      if (
        !log.eventName ||
        !log.args ||
        log.blockNumber === undefined ||
        !log.transactionHash
      ) {
        return undefined;
      }
      const args = log.args;
      const blockNumber = log.blockNumber;
      const transactionHash = log.transactionHash;
      switch (log.eventName) {
        case "ThesisCreated": {
          const creator = args.creator as Address;
          return {
            kind: "created" as const,
            actor: creator,
            amount: args.creatorBond as bigint,
            label: "Thesis posted",
            detail: `${shortAddress(creator)} bonded ${formatAmount(args.creatorBond as bigint)} USDG.`,
            blockNumber,
            transactionHash,
          };
        }
        case "ConvictionRaised":
          return {
            kind: "raised" as const,
            actor: args.creator as Address,
            amount: args.amount as bigint,
            note: args.note as string,
            label: "Conviction raised",
            detail: `${formatAmount(args.amount as bigint)} USDG · ${args.note as string}`,
            blockNumber,
            transactionHash,
          };
        case "ChallengePosted":
          return {
            kind: "challenge" as const,
            actor: args.challenger as Address,
            amount: args.amount as bigint,
            note: args.note as string,
            label: "Capital-backed Challenge",
            detail: `${shortAddress(args.challenger as Address)} Faded ${formatAmount(args.amount as bigint)} USDG · ${args.note as string}`,
            blockNumber,
            transactionHash,
          };
        case "ThesisSettled":
          return {
            kind: "settled" as const,
            amount: args.transferAmount as bigint,
            label: "Thesis settled",
            detail: `Realized Alpha ${formatBps(args.realizedAlphaBps as bigint)} · transfer ${formatAmount(args.transferAmount as bigint)} USDG.`,
            blockNumber,
            transactionHash,
          };
        case "ThesisCancelled":
          return {
            kind: "cancelled" as const,
            label: "Thesis cancelled",
            detail: "Principal is available to claim.",
            blockNumber,
            transactionHash,
          };
        case "Claimed":
          return {
            kind: "claimed" as const,
            actor: args.claimant as Address,
            amount: args.amount as bigint,
            label: "Claimed",
            detail: `${shortAddress(args.claimant as Address)} claimed ${formatAmount(args.amount as bigint)} USDG.`,
            blockNumber,
            transactionHash,
          };
        default:
          return undefined;
      }
    })
    .filter((activity): activity is ThesisActivity => activity !== undefined)
    .sort((left, right) => (left.blockNumber > right.blockNumber ? -1 : 1));
}

async function fetchDetail(
  publicClient: PublicClient,
  address: Address,
): Promise<ThesisDetail> {
  const summary = await fetchSummary(publicClient, address);
  const baseResults = await readContracts(publicClient, [
    { address, abi: THESIS_ABI, functionName: "basketLength" },
    { address, abi: THESIS_ABI, functionName: "referenceFeed" },
    { address, abi: THESIS_ABI, functionName: "totalClaimed" },
  ]);
  const basketLength = Number(
    requireContractResult<bigint>(baseResults[0], "basketLength"),
  );
  if (basketLength < 1 || basketLength > 5)
    throw new Error("Chain read invalid: basketLength.");
  const referenceFeed = requireContractResult<Address>(
    baseResults[1],
    "referenceFeed",
  );
  const totalClaimed = requireContractResult<bigint>(
    baseResults[2],
    "totalClaimed",
  );

  const basketResults = await readContracts(
    publicClient,
    Array.from({ length: basketLength }, (_, index) => ({
      address,
      abi: THESIS_ABI,
      functionName: "basketAsset",
      args: [BigInt(index)],
    })),
  );
  const basket = basketResults.map((result, index) => {
    const [feed, weightBps] = requireContractResult<
      readonly [Address, number | bigint]
    >(result, `basket[${index}]`);
    return { feed, weightBps: BigInt(weightBps), symbol: feedSymbol(feed) };
  });

  const feeds = [...basket.map((asset) => asset.feed), referenceFeed];
  const startResults = await readContracts(
    publicClient,
    feeds.map((_, index) => ({
      address,
      abi: THESIS_ABI,
      functionName: "startPrices",
      args: [BigInt(index)],
    })),
  );
  const startPrices = startResults.map((result, index) =>
    requireContractResult<bigint>(result, `startPrice[${index}]`),
  );

  const oracleResults = await readContracts(
    publicClient,
    feeds.flatMap((feed) => [
      { address: feed, abi: ORACLE_ABI, functionName: "decimals" },
      { address: feed, abi: ORACLE_ABI, functionName: "latestRoundData" },
    ]),
  );
  const endPrices = feeds.map((_feed, index) => {
    const decimals = readContractResult<bigint>(oracleResults[index * 2]);
    const round = readContractResult<RoundData>(oracleResults[index * 2 + 1]);
    if (!decimals || !round || round[1] <= 0n) return undefined;
    return normalizePrice(round[1], decimals);
  });
  const alphaInputs = endPrices.every(
    (price): price is bigint => price !== undefined,
  )
    ? endPrices
    : undefined;
  const liveAlphaBps = alphaInputs
    ? calculateAlphaBps(
        basket.map((asset, index) => ({
          startPrice: startPrices[index],
          endPrice: alphaInputs[index],
          weightBps: asset.weightBps,
        })),
        {
          startPrice: startPrices[basket.length],
          endPrice: alphaInputs[basket.length],
        },
      )
    : undefined;

  const activities = await fetchActivities(publicClient, address);
  const challengerAddresses = [
    ...new Set(
      activities
        .filter((activity) => activity.kind === "challenge" && activity.actor)
        .map((activity) => activity.actor as Address),
    ),
  ];
  const challengerResults = challengerAddresses.length
    ? await readContracts(
        publicClient,
        challengerAddresses.flatMap((challenger) => [
          {
            address,
            abi: THESIS_ABI,
            functionName: "challengerStake",
            args: [challenger],
          },
          {
            address,
            abi: THESIS_ABI,
            functionName: "challengerPayout",
            args: [challenger],
          },
        ]),
      )
    : [];
  const challengers: ChallengerPosition[] = challengerAddresses.map(
    (challenger, index) => ({
      address: challenger,
      stake: readContractResult<bigint>(challengerResults[index * 2]) ?? 0n,
      payout:
        readContractResult<bigint>(challengerResults[index * 2 + 1]) ?? 0n,
    }),
  );

  return {
    ...summary,
    basket,
    reference: {
      feed: referenceFeed,
      symbol: feedSymbol(referenceFeed),
      weightBps: 0n,
    },
    startPrices,
    liveAlphaBps,
    activities,
    challengers,
    totalClaimed,
  };
}

export async function fetchThesisDetails(
  publicClient: PublicClient,
): Promise<ThesisDetail[]> {
  const count = Number(
    await publicClient.readContract({
      address: addresses.factory,
      abi: FACTORY_ABI,
      functionName: "thesesLength",
    }),
  );
  if (count === 0) return [];
  const addressResults = await readContracts(
    publicClient,
    Array.from({ length: count }, (_, index) => ({
      address: addresses.factory,
      abi: FACTORY_ABI,
      functionName: "thesisAt",
      args: [BigInt(index)],
    })),
  );
  const thesisAddresses = addressResults
    .map((result) => readContractResult<string>(result))
    .filter((value): value is Address => Boolean(value && isAddress(value)));
  const details = await Promise.all(
    thesisAddresses.map((address) =>
      fetchDetail(publicClient, address).catch(() => undefined),
    ),
  );
  return details
    .filter((detail): detail is ThesisDetail => Boolean(detail))
    .reverse();
}

export function useTheses() {
  const publicClient = usePublicClient();
  return useQuery({
    queryKey: ["theses"],
    queryFn: () =>
      publicClient
        ? fetchThesisDetails(publicClient)
        : Promise.reject(new Error("Blockchain client is not ready.")),
    enabled: Boolean(publicClient),
    staleTime: 5_000,
    refetchInterval: config.disableMulticall ? false : 15_000,
    refetchIntervalInBackground: !config.disableMulticall,
  });
}

export function useThesis(address: Address | undefined) {
  const publicClient = usePublicClient();
  return useQuery<ThesisDetail | undefined>({
    queryKey: ["thesis", address],
    queryFn: () =>
      publicClient && address
        ? fetchDetail(publicClient, address)
        : Promise.reject(new Error("Thesis address is not ready.")),
    enabled: Boolean(publicClient && address),
    staleTime: 5_000,
    refetchInterval: config.disableMulticall ? false : 5_000,
    refetchIntervalInBackground: !config.disableMulticall,
  });
}

export interface ThesisPosition {
  stake: bigint;
  payout: bigint;
  allowance: bigint;
  balance: bigint;
}

export function useThesisPosition(address: Address | undefined) {
  const publicClient = usePublicClient();
  const { address: user } = useAccount();
  return useQuery<ThesisPosition | undefined>({
    queryKey: ["thesis-position", address, user],
    queryFn: async () => {
      if (!publicClient || !address || !user)
        throw new Error("Wallet position is not ready.");
      const results = await readContracts(publicClient, [
        {
          address,
          abi: THESIS_ABI,
          functionName: "challengerStake",
          args: [user],
        },
        {
          address,
          abi: THESIS_ABI,
          functionName: "challengerPayout",
          args: [user],
        },
        {
          address: addresses.collateral,
          abi: ERC20_ABI,
          functionName: "allowance",
          args: [user, address],
        },
        {
          address: addresses.collateral,
          abi: ERC20_ABI,
          functionName: "balanceOf",
          args: [user],
        },
      ]);
      return {
        stake: readContractResult<bigint>(results[0]) ?? 0n,
        payout: readContractResult<bigint>(results[1]) ?? 0n,
        allowance: readContractResult<bigint>(results[2]) ?? 0n,
        balance: readContractResult<bigint>(results[3]) ?? 0n,
      };
    },
    enabled: Boolean(publicClient && address && user),
    staleTime: 5_000,
    refetchInterval: config.disableMulticall ? false : 5_000,
    refetchIntervalInBackground: !config.disableMulticall,
  });
}

export function useLeaderboard(mode: LeaderboardMode = "overall") {
  const publicClient = usePublicClient();
  return useQuery<LeaderboardEntry[]>({
    queryKey: ["leaderboard", mode],
    queryFn: async () => {
      if (!publicClient) throw new Error("Blockchain client is not ready.");
      return aggregateLeaderboard(await fetchThesisDetails(publicClient), mode);
    },
    enabled: Boolean(publicClient),
    staleTime: 15_000,
    refetchInterval: config.disableMulticall ? false : 30_000,
    refetchIntervalInBackground: !config.disableMulticall,
  });
}

export function useProfile(address: Address | undefined) {
  const theses = useTheses();
  return {
    ...theses,
    data: useMemo(
      () =>
        theses.data?.filter(
          (thesis) =>
            thesis.creator.toLowerCase() === address?.toLowerCase() ||
            thesis.challengers.some(
              (challenger) =>
                challenger.address.toLowerCase() === address?.toLowerCase(),
            ),
        ),
      [address, theses.data],
    ),
  };
}
