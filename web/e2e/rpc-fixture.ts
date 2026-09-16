import type { Route } from "@playwright/test";
import {
  decodeFunctionData,
  encodeAbiParameters,
  encodeFunctionResult,
  parseAbi,
  parseAbiParameters,
  toFunctionSelector,
} from "viem";

/**
 * A minimal multicall3-aware JSON-RPC stub.
 *
 * `Feed` and `MarketDetail` read every value through `publicClient.multicall`,
 * so against a chain that cannot answer `aggregate3` the routes stay in their
 * empty state and no layout assertion can be made. This fixture answers exactly
 * the calls those routes issue, with real ABI encoding, so the loaded state is
 * deterministic and offline.
 */

export const MARKET_ADDRESS =
  "0xBf496Ef435C814C81864b5F337F23b63D4b26BB3" as const;
export const NARRATIVE = "AI infrastructure outperforms the benchmark.";

/**
 * Matches the app's configured RPC endpoint (whatever `VITE_RPC_URL` holds)
 * plus the local stub, so the fixture is hermetic without changing the build
 * environment. Playwright intercepts before the network here.
 */
export const RPC_URL_PATTERN =
  /rpc\.testnet\.chain\.robinhood\.com|127\.0\.0\.1:8599/;

const CREATOR = "0x1111111111111111111111111111111111111111" as const;
const BASKET_FEED = "0x5406fc983e7f84b544ff6fc855e06c22cf36a795" as const;
const BENCHMARK_FEED = "0x81b48ec24970aa75ae940e2492fda006071ac31b" as const;

const NOW = BigInt(Math.floor(Date.now() / 1000));

const factoryAbi = parseAbi([
  "function marketsLength() view returns (uint256)",
  "function marketAt(uint256) view returns (address)",
]);
const marketAbi = parseAbi([
  "function narrative() view returns (string)",
  "function hurdleBps() view returns (uint256)",
  "function bettingEndsAt() view returns (uint256)",
  "function resolvesAt() view returns (uint256)",
  "function settlementWindow() view returns (uint256)",
  "function creator() view returns (address)",
  "function creatorBond() view returns (uint256)",
  "function backPool() view returns (uint256)",
  "function fadePool() view returns (uint256)",
  "function outcome() view returns (uint256)",
  "function narrativeAlphaBps() view returns (int256)",
  "function basketLength() view returns (uint256)",
  "function benchmarkFeed() view returns (address)",
  "function totalClaimed() view returns (uint256)",
  "function basketAsset(uint256) view returns (address,uint256)",
  "function startPrices(uint256) view returns (uint256)",
]);
const oracleAbi = parseAbi([
  "function decimals() view returns (uint8)",
  "function latestRoundData() view returns (uint80,int256,uint256,uint256,uint80)",
]);
const multicall3Abi = parseAbi([
  "function aggregate3((address target, bool allowFailure, bytes callData)[] calls) payable returns ((bool success, bytes returnData)[])",
]);

/** selector -> the value that function returns in the fixture world. */
function buildAnswers(): Map<string, string> {
  const answers = new Map<string, string>();
  const add = (abi: readonly unknown[], name: string, result: unknown) => {
    const selector = toFunctionSelector(
      (abi as never[]).find(
        (item) => (item as { name?: string }).name === name,
      ) as never,
    );
    answers.set(
      selector,
      encodeFunctionResult({ abi, functionName: name, result } as never),
    );
  };

  add(factoryAbi, "marketsLength", 1n);
  add(factoryAbi, "marketAt", MARKET_ADDRESS);

  add(marketAbi, "narrative", NARRATIVE);
  add(marketAbi, "hurdleBps", 1000n);
  add(marketAbi, "bettingEndsAt", NOW + 1800n);
  add(marketAbi, "resolvesAt", NOW + 2_592_000n);
  add(marketAbi, "settlementWindow", 3600n);
  add(marketAbi, "creator", CREATOR);
  add(marketAbi, "creatorBond", 5n * 10n ** 17n);
  add(marketAbi, "backPool", 100n * 10n ** 18n);
  add(marketAbi, "fadePool", 50n * 10n ** 18n);
  add(marketAbi, "outcome", 0n);
  add(marketAbi, "narrativeAlphaBps", 250n);
  add(marketAbi, "basketLength", 1n);
  add(marketAbi, "benchmarkFeed", BENCHMARK_FEED);
  add(marketAbi, "totalClaimed", 0n);
  add(marketAbi, "basketAsset", [BASKET_FEED, 6000n]);
  add(marketAbi, "startPrices", 10n ** 18n);

  add(oracleAbi, "decimals", 18);
  add(oracleAbi, "latestRoundData", [
    1n,
    2_000n * 10n ** 18n,
    NOW - 3600n,
    NOW,
    1n,
  ]);

  return answers;
}

const ANSWERS = buildAnswers();
const MULTICALL3 = "0xca11bde05977b3631167028862be2a173976ca11";

function answerCall(data: string): string | null {
  return ANSWERS.get(data.slice(0, 10)) ?? null;
}

export async function fulfillRpc(route: Route) {
  const raw = route.request().postData() ?? "{}";
  let parsed: { id?: number; method?: string; params?: unknown[] };
  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = { id: 1, method: "eth_chainId" };
  }
  const single = !Array.isArray(parsed);
  const items = Array.isArray(parsed) ? parsed : [parsed];

  const responses = items.map((item) => {
    const id = item.id ?? 1;
    if (item.method === "eth_chainId")
      return { jsonrpc: "2.0", id, result: "0xb626" };
    if (item.method === "eth_blockNumber")
      return { jsonrpc: "2.0", id, result: "0x1" };
    if (item.method === "eth_getLogs")
      return { jsonrpc: "2.0", id, result: [] };
    if (item.method !== "eth_call") return { jsonrpc: "2.0", id, result: "0x" };

    const call = item.params?.[0] as { to?: string; data?: string } | undefined;
    const data = call?.data ?? "";
    const to = (call?.to ?? "").toLowerCase();

    // A direct (non-batched) read.
    if (to !== MULTICALL3) {
      return { jsonrpc: "2.0", id, result: answerCall(data) ?? "0x" };
    }

    // aggregate3: decode the inner calls and answer each one.
    let results: Array<{ success: boolean; returnData: string }>;
    try {
      const decoded = decodeFunctionData({
        abi: multicall3Abi,
        data: data as `0x${string}`,
      });
      const calls = (decoded.args as unknown[])[0] as Array<{
        callData: `0x${string}`;
      }>;
      results = calls.map((inner) => {
        const encoded = answerCall(inner.callData);
        return encoded
          ? { success: true, returnData: encoded as `0x${string}` }
          : { success: false, returnData: "0x" as `0x${string}` };
      });
    } catch {
      results = [];
    }
    const encoded = encodeAbiParameters(
      parseAbiParameters("(bool success, bytes returnData)[]"),
      [results as never],
    );
    return { jsonrpc: "2.0", id, result: encoded };
  });

  await route.fulfill({
    status: 200,
    contentType: "application/json",
    headers: { "access-control-allow-origin": "*" },
    body: JSON.stringify(single ? responses[0] : responses),
  });
}
