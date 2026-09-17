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
    "0x49a9CF7661aAB5B658A5c19420993Fcf00841d2a",
  VITE_COLLATERAL_ADDRESS:
    process.env.VITE_COLLATERAL_ADDRESS ??
    "0x222903b08139FeeF6C0CAD921e0f2F7f5Eb81AB6",
  VITE_FACTORY_DEPLOYMENT_BLOCK:
    process.env.VITE_FACTORY_DEPLOYMENT_BLOCK ?? "120336292",
  VITE_API_BASE: process.env.VITE_API_BASE ?? "/v1",
  VITE_WALLETCONNECT_PROJECT_ID:
    process.env.VITE_WALLETCONNECT_PROJECT_ID ?? "ci-placeholder",
};

const npm = process.platform === "win32" ? "npm.cmd" : "npm";
for (const script of ["lint", "typecheck", "test", "build"]) {
  const result = spawnSync(npm, ["run", script], {
    cwd: root,
    env,
    stdio: "inherit",
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
