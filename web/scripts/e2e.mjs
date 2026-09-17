import { spawn, spawnSync } from "node:child_process";
import {
  closeSync,
  openSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { createServer } from "node:net";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const contractsRoot = resolve(root, "..", "contracts");
const rpcUrl = "http://127.0.0.1:8599";
const localAssetsPath = resolve(
  "/tmp",
  `backfade-e2e-assets-${process.pid}.json`,
);
const npm = process.platform === "win32" ? "npm.cmd" : "npm";

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd ?? root,
    env: options.env ?? process.env,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (result.status !== 0) {
    throw new Error(
      `${command} failed: ${result.stderr.trim() || result.stdout.trim()}`,
    );
  }
  return result.stdout.trim();
}

function stop(child) {
  if (!child?.pid) return;
  try {
    process.kill(-child.pid, "SIGTERM");
  } catch {
    try {
      child.kill("SIGTERM");
    } catch {
      // The process already exited.
    }
  }
}

function start(command, args, options = {}) {
  const outputPath = options.outputPath;
  const outputFd = outputPath ? openSync(outputPath, "w") : undefined;
  const child = spawn(command, args, {
    cwd: options.cwd ?? root,
    env: options.env ?? process.env,
    detached: true,
    stdio: outputPath
      ? ["ignore", outputFd, outputFd]
      : ["ignore", "pipe", "pipe"],
  });
  if (outputFd !== undefined) closeSync(outputFd);
  child.outputPath = outputPath;
  child.output = "";
  if (!outputPath) {
    const collect = (chunk) => {
      child.output += chunk.toString();
      if (child.output.length > 4_000)
        child.output = child.output.slice(-4_000);
    };
    child.stdout.on("data", collect);
    child.stderr.on("data", collect);
  }
  return child;
}

function redactSecrets(output) {
  return output.replace(/0x[a-fA-F0-9]{64}/g, "0x<redacted>");
}

function parseAnvil(output) {
  const keySection = output.slice(output.indexOf("Private Keys"));
  const keys = [...keySection.matchAll(/\(\d+\)\s+(0x[0-9a-fA-F]{64})/g)].map(
    ([, key]) => key,
  );
  const accountSection = output.slice(0, output.indexOf("Private Keys"));
  const accounts = [
    ...accountSection.matchAll(/\(\d+\)\s+(0x[0-9a-fA-F]{40})/g),
  ].map(([, address]) => address);
  if (accounts.length < 3 || keys.length < 3) {
    throw new Error("Could not read three ephemeral Anvil wallets.");
  }
  return { accounts, keys };
}

async function waitForAnvil(anvil) {
  if (anvil.outputPath) {
    const deadline = Date.now() + 30_000;
    while (Date.now() < deadline) {
      const output = readFileSync(anvil.outputPath, "utf8");
      if (output.includes("Private Keys")) return parseAnvil(output);
      if (anvil.exitCode !== null) {
        throw new Error(
          `Anvil exited before startup (code ${anvil.exitCode ?? "?"}).`,
        );
      }
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    throw new Error("Anvil did not start within 30 seconds.");
  }
  let output = "";
  let resolveReady;
  let rejectReady;
  const ready = new Promise((resolve, reject) => {
    resolveReady = resolve;
    rejectReady = reject;
  });
  const timer = setTimeout(
    () => rejectReady(new Error("Anvil did not start within 30 seconds.")),
    30_000,
  );
  const collect = (chunk) => {
    output += chunk.toString();
    if (output.includes("Private Keys")) {
      clearTimeout(timer);
      resolveReady(parseAnvil(output));
    }
  };
  anvil.stdout.on("data", collect);
  anvil.stderr.on("data", collect);
  anvil.once("exit", (code) => {
    clearTimeout(timer);
    rejectReady(
      new Error(`Anvil exited before startup (code ${code ?? "?"}).`),
    );
  });
  return ready;
}

async function findFreePort(start) {
  for (let port = start; port < start + 50; port += 1) {
    const server = createServer();
    const available = await new Promise((resolve) => {
      const onError = () => resolve(false);
      server.once("error", onError);
      server.listen(port, "127.0.0.1", () => {
        server.close(() => resolve(true));
      });
    });
    if (available) return port;
  }
  throw new Error(`No free port found near ${start}.`);
}

async function waitForHttp(url, child) {
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // The server is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  const output = child?.output?.trim();
  throw new Error(
    `HTTP server did not become ready: ${url}${output ? `\n${output}` : ""}`,
  );
}

async function main() {
  let anvil;
  let api;
  const anvilLogPath = resolve("/tmp", `backfade-anvil-${process.pid}.log`);
  try {
    const apiPort = await findFreePort(18000);
    const webPort = await findFreePort(4173);
    const apiUrl = `http://127.0.0.1:${apiPort}`;
    anvil = start(
      "anvil",
      [
        "--port",
        "8599",
        "--chain-id",
        "46630",
        "--accounts",
        "3",
        "--balance",
        "1000",
      ],
      { outputPath: anvilLogPath },
    );
    const { accounts, keys } = await waitForAnvil(anvil);

    run(
      "forge",
      [
        "script",
        "script/SmokeDeploy.s.sol:SmokeDeploy",
        "--rpc-url",
        rpcUrl,
        "--broadcast",
      ],
      {
        cwd: contractsRoot,
        env: {
          ...process.env,
          SMOKE_PK: keys[0],
          SMOKE_CHALLENGE_WINDOW: "120",
          SMOKE_HORIZON: "180",
          SMOKE_SETTLEMENT_WINDOW: "600",
          SMOKE_MAX_START_AGE: "600",
        },
      },
    );
    const state = JSON.parse(
      readFileSync(resolve(contractsRoot, "smoke-state.json"), "utf8"),
    );
    const multicallCode = run("cast", [
      "code",
      state.multicall,
      "--rpc-url",
      rpcUrl,
    ]);
    run("cast", [
      "rpc",
      "anvil_setCode",
      "0xcA11bde05977b3631167028862bE2a173976CA11",
      multicallCode,
      "--rpc-url",
      rpcUrl,
    ]);
    const deploymentBlock = run("cast", ["block-number", "--rpc-url", rpcUrl]);
    const localAssets = {
      assets: [
        { symbol: "AMD", name: "AMD", feed: state.amd, enabled: true },
        { symbol: "PLTR", name: "Palantir", feed: state.pltr, enabled: true },
        { symbol: "TSLA", name: "Tesla", feed: state.tsla, enabled: true },
      ],
    };
    writeFileSync(localAssetsPath, JSON.stringify(localAssets));

    const tokenAmount = "10000000000000000000000";
    for (const account of accounts) {
      run(
        "cast",
        [
          "send",
          state.usdg,
          "mint(address,uint256)",
          account,
          tokenAmount,
          "--private-key",
          keys[0],
          "--rpc-url",
          rpcUrl,
          "--quiet",
        ],
        { cwd: root },
      );
    }

    api = start(
      "uv",
      [
        "run",
        "--project",
        "api",
        "uvicorn",
        "api.main:app",
        "--host",
        "127.0.0.1",
        "--port",
        String(apiPort),
      ],
      {
        cwd: resolve(root, ".."),
        env: {
          ...process.env,
          BACKFADE_ASSETS_PATH: localAssetsPath,
          BACKFADE_CORS_ORIGINS: `http://127.0.0.1:${webPort}`,
        },
      },
    );
    await waitForHttp(`${apiUrl}/health`, api);

    const env = {
      ...process.env,
      VITE_CHAIN_ID: "46630",
      VITE_CHAIN_NAME: "Robinhood Chain Testnet",
      VITE_RPC_URL: rpcUrl,
      VITE_EXPLORER_URL: `http://127.0.0.1:${webPort}`,
      VITE_FACTORY_ADDRESS: state.factory,
      VITE_COLLATERAL_ADDRESS: state.usdg,
      VITE_FACTORY_DEPLOYMENT_BLOCK: deploymentBlock,
      VITE_API_BASE: "/v1",
      VITE_API_PROXY_TARGET: apiUrl,
      E2E_WEB_PORT: String(webPort),
      VITE_WALLETCONNECT_PROJECT_ID: "e2e-placeholder",
      E2E_RPC_URL: rpcUrl,
      E2E_DEPLOYMENT_BLOCK: deploymentBlock,
      E2E_CREATOR_ADDRESS: accounts[0],
      E2E_CREATOR_PRIVATE_KEY: keys[0],
      E2E_CHALLENGER_A_ADDRESS: accounts[1],
      E2E_CHALLENGER_A_PRIVATE_KEY: keys[1],
      E2E_CHALLENGER_B_ADDRESS: accounts[2],
      E2E_CHALLENGER_B_PRIVATE_KEY: keys[2],
      E2E_FEED_AMD: state.amd,
      E2E_FEED_PLTR: state.pltr,
      E2E_FEED_TSLA: state.tsla,
    };
    const result = spawnSync(
      npm,
      ["exec", "--", "playwright", "test", ...process.argv.slice(2)],
      { cwd: root, env, stdio: "inherit" },
    );
    if (result.status !== 0) {
      console.error(
        anvil?.outputPath
          ? redactSecrets(readFileSync(anvil.outputPath, "utf8"))
          : redactSecrets(anvil?.output ?? ""),
      );
    }
    process.exitCode = result.status ?? 1;
  } finally {
    stop(api);
    stop(anvil);
    try {
      unlinkSync(localAssetsPath);
    } catch {
      // The temporary registry was not created.
    }
    try {
      unlinkSync(anvilLogPath);
    } catch {
      // The temporary Anvil log was not created.
    }
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
