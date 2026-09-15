// ABI smoke test. Drives approve + createMarket through generated frontend ABIs against Anvil.

import { readFileSync, writeFileSync } from "node:fs";
import { build } from "esbuild";
import {
  createPublicClient,
  createWalletClient,
  defineChain,
  encodeFunctionData,
  http,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";

const ROOT = new URL("..", import.meta.url).pathname;
const RPC = process.env.ANVIL_RPC_URL ?? "http://127.0.0.1:8546";
const ANVIL_PK = process.env.ANVIL_PRIVATE_KEY;
if (!ANVIL_PK)
  throw new Error("Set ANVIL_PRIVATE_KEY in the environment for ABI smoke.");

// Bundle the generated Foundry ABI output with the project's own esbuild.
await build({
  stdin: {
    contents: readFileSync(`${ROOT}/web/src/generated/contracts.ts`, "utf8"),
    resolveDir: `${ROOT}/web/src`,
    loader: "ts",
  },
  define: { "import.meta.env": "{}" },
  format: "esm",
  bundle: true,
  outfile: "/tmp/contracts.bundle.mjs",
  logLevel: "error",
});
const { ERC20_ABI, FACTORY_ABI, MARKET_ABI } = await import(
  "/tmp/contracts.bundle.mjs"
);

const s = JSON.parse(
  readFileSync(`${ROOT}/contracts/smoke-state.json`, "utf8"),
);
const chain = defineChain({
  id: 31337,
  name: "anvil",
  nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: RPC } },
});
const account = privateKeyToAccount(ANVIL_PK);
const wallet = createWalletClient({ account, chain, transport: http(RPC) });
const pub = createPublicClient({ chain, transport: http(RPC) });
const send = async (to, abi, fn, args) => {
  const h = await wallet.sendTransaction({
    to,
    data: encodeFunctionData({ abi, functionName: fn, args }),
  });
  const rc = await pub.waitForTransactionReceipt({ hash: h });
  if (rc.status !== "success") {
    console.error(`REVERTED: ${fn}`);
    process.exit(1);
  }
  return rc;
};

await send(s.usdg, ERC20_ABI, "mint", [account.address, 10n ** 22n]);
await send(s.usdg, ERC20_ABI, "approve", [s.factory, 10n ** 30n]);
console.log("1/4 mint + approve via web-style ERC20 encoding: ok");

// Time semantics use unix seconds only; no timezone strings.
const now = BigInt(Math.floor(Date.now() / 1000));
const params = {
  narrative: "AI infrastructure keeps outperforming.",
  basket: [
    { feed: s.amd, weightBps: 6000 },
    { feed: s.pltr, weightBps: 4000 },
  ],
  benchmarkFeed: s.tsla,
  hurdleBps: 1000,
  bettingEndsAt: now + 1800n,
  resolvesAt: now + 3600n,
  collateral: s.usdg,
};
const rc = await send(s.factory, FACTORY_ABI, "createMarket", [
  params,
  500n * 10n ** 18n,
]);
console.log(
  `2/4 createMarket via FACTORY_ABI: ${rc.status}, gas ${rc.gasUsed}`,
);

const len = await pub.readContract({
  address: s.factory,
  abi: FACTORY_ABI,
  functionName: "marketsLength",
});
const market = await pub.readContract({
  address: s.factory,
  abi: FACTORY_ABI,
  functionName: "marketAt",
  args: [len - 1n],
});
console.log(`3/4 marketAt(${len - 1n}) -> ${market}`);

const read = (fn) =>
  pub.readContract({ address: market, abi: MARKET_ABI, functionName: fn });
const [sw, msa, bp, nar] = await Promise.all([
  read("settlementWindow"),
  read("maxStartAge"),
  read("backPool"),
  read("narrative"),
]);
console.log(
  `4/4 MARKET_ABI reads: settlementWindow=${sw} maxStartAge=${msa} backPool=${bp}`,
);
console.log(`    narrative roundtrip: "${nar}"`);
writeFileSync("/tmp/smoke-market.txt", market);
console.log("ABI SMOKE PASS");
