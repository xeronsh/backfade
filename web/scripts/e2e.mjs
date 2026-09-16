import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const env = {
  ...process.env,
  VITE_CHAIN_ID: process.env.VITE_CHAIN_ID ?? "46630",
  VITE_CHAIN_NAME: process.env.VITE_CHAIN_NAME ?? "Robinhood Chain Testnet",
  VITE_RPC_URL:
    process.env.VITE_RPC_URL ?? "https://rpc.testnet.chain.robinhood.com",
  VITE_EXPLORER_URL:
    process.env.VITE_EXPLORER_URL ??
    "https://explorer.testnet.chain.robinhood.com",
  VITE_FACTORY_ADDRESS:
    process.env.VITE_FACTORY_ADDRESS ??
    "0x9a9adD5032432f9884341B536682e35179aC6474",
  VITE_COLLATERAL_ADDRESS:
    process.env.VITE_COLLATERAL_ADDRESS ??
    "0xAfDB01Bd1D89c4d24C479865948F9c36C43eC1B3",
  VITE_API_BASE: process.env.VITE_API_BASE ?? "/v1",
  VITE_WALLETCONNECT_PROJECT_ID:
    process.env.VITE_WALLETCONNECT_PROJECT_ID ?? "ci-placeholder",
};

const npm = process.platform === "win32" ? "npm.cmd" : "npm";
const result = spawnSync(
  npm,
  ["exec", "playwright", "test", ...process.argv.slice(2)],
  { cwd: root, env, stdio: "inherit" },
);
process.exit(result.status ?? 1);
