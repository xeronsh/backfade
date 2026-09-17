import { spawn } from "node:child_process";
import { expect, type Page, test } from "@playwright/test";
import {
  createPublicClient,
  defineChain,
  encodeFunctionData,
  type Hash,
  http,
  parseAbi,
} from "viem";
import { installWallet, switchWalletAccount } from "./wallet";

const RPC_URL = process.env.E2E_RPC_URL ?? "http://127.0.0.1:8599";
const CREATOR = process.env.E2E_CREATOR_ADDRESS ?? "";
const CHALLENGER_A = process.env.E2E_CHALLENGER_A_ADDRESS ?? "";
const CHALLENGER_B = process.env.E2E_CHALLENGER_B_ADDRESS ?? "";
const FEED_AMD = process.env.E2E_FEED_AMD ?? "";
const FEED_PLTR = process.env.E2E_FEED_PLTR ?? "";
const FEED_TSLA = process.env.E2E_FEED_TSLA ?? "";
const COLLATERAL = process.env.VITE_COLLATERAL_ADDRESS ?? "";
const NARRATIVE = "AMD will outperform TSLA.";

const chain = defineChain({
  id: 46630,
  name: "Robinhood Chain Testnet",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: [RPC_URL] } },
});
const publicClient = createPublicClient({ chain, transport: http(RPC_URL) });
const feedUpdateAbi = parseAbi(["function updateAnswer(int256)"]);
const erc20WriteAbi = parseAbi(["function approve(address,uint256)"]);
const challengeAbi = parseAbi(["function challenge(uint256,string)"]);
const settleAbi = parseAbi(["function settle()"]);
const claimAbi = parseAbi(["function claim()"]);
const thesisReadAbi = parseAbi([
  "function state() view returns (uint8)",
  "function totalClaimed() view returns (uint256)",
  "function creatorPayout() view returns (uint256)",
  "function challengePayoutPool() view returns (uint256)",
]);
const erc20ReadAbi = parseAbi([
  "function balanceOf(address) view returns (uint256)",
]);
const thesisEventsAbi = parseAbi([
  "event ThesisSettled(int256 realizedAlphaBps, uint256 transferAmount, uint256 creatorPayout, uint256 challengePayoutPool, uint64 settledAt)",
  "event Claimed(address indexed claimant, uint256 amount)",
]);

function shortAddress(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

function requireAddress(value: string, name: string) {
  if (!value) throw new Error(`Missing ${name} from the E2E environment.`);
  return value as `0x${string}`;
}

async function connectWallet(page: Page) {
  const account = page.getByRole("button", { name: /Wallet 0x/ });
  if (!(await account.isVisible())) {
    const connect = page.getByRole("button", { name: "Connect wallet" });
    if (await connect.isVisible()) {
      try {
        await connect.click({ timeout: 5_000 });
      } catch {
        // An injected wallet may auto-connect while the button is being clicked.
      }
    }
    const injected = page.getByRole("button", { name: "Browser Wallet" });
    if (await injected.isVisible()) await injected.click();
  }
  await expect(account).toBeVisible();
  const closeModal = page
    .getByRole("dialog")
    .getByRole("button", { name: "Close" });
  if (await closeModal.isVisible()) await closeModal.click();
}

async function walletRequest(
  page: Page,
  method: string,
  params: unknown[] = [],
) {
  return page.evaluate(
    ({ method: requestMethod, params: requestParams }) => {
      const provider = (
        window as typeof window & {
          ethereum?: {
            request(args: {
              method: string;
              params?: unknown[];
            }): Promise<unknown>;
          };
        }
      ).ethereum;
      if (!provider) throw new Error("E2E wallet is not installed");
      return provider.request({ method: requestMethod, params: requestParams });
    },
    { method, params },
  );
}

async function sendWalletTransaction(
  page: Page,
  from: string,
  to: string,
  data: `0x${string}`,
) {
  const hash = (await walletRequest(page, "eth_sendTransaction", [
    { from, to, data },
  ])) as Hash;
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  if (receipt.status !== "success") {
    throw new Error(`Wallet transaction reverted: ${hash}`);
  }
}

async function setLocalTimeAfterExpiry(page: Page) {
  await walletRequest(page, "evm_increaseTime", [240]);
  await walletRequest(page, "evm_mine");
}

test.describe.configure({ mode: "serial" });

test("Home loads the Thesis feed from the local chain", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Don't reply. Fade it." }),
  ).toBeVisible();
  await expect(page.getByText("Post a Thesis").first()).toBeVisible();
});

test("Post flow uses the live compiler and requires Reference confirmation", async ({
  page,
}) => {
  await page.goto("/post");
  await expect(
    page.getByRole("heading", { name: "Say it. Bond it." }),
  ).toBeVisible();
  await page.getByRole("textbox", { name: "Narrative" }).fill(NARRATIVE);
  await page.getByRole("button", { name: "Structure Thesis" }).click();
  await expect(
    page.getByRole("button", { name: "Confirm Reference: TSLA" }),
  ).toBeVisible();
  await expect(page.getByText("(explicit)")).toBeVisible();
  await expect(page.getByLabel("Creator Conviction (USDG)")).toBeVisible();
  await page.getByRole("button", { name: "Confirm Reference: TSLA" }).click();
  await expect(
    page.getByRole("button", { name: "Reference confirmed: TSLA" }),
  ).toBeVisible();
});

test("Legacy and invalid routes remain safe", async ({ page }) => {
  await page.goto("/create");
  await expect(page).toHaveURL(/\/post$/);
  await page.goto("/market/not-an-address");
  await expect(
    page.getByRole("heading", { name: "Invalid Thesis address" }),
  ).toBeVisible();
  await page.goto("/profile/not-an-address");
  await expect(
    page.getByRole("heading", { name: "Invalid profile address" }),
  ).toBeVisible();
});

test("Wallet-backed Creator to Challenger settlement and claims", async ({
  page,
}, testInfo) => {
  test.setTimeout(120_000);
  const creator = requireAddress(CREATOR, "E2E_CREATOR_ADDRESS");
  const challengerA = requireAddress(CHALLENGER_A, "E2E_CHALLENGER_A_ADDRESS");
  const challengerB = requireAddress(CHALLENGER_B, "E2E_CHALLENGER_B_ADDRESS");
  const feeds = [
    requireAddress(FEED_AMD, "E2E_FEED_AMD"),
    requireAddress(FEED_PLTR, "E2E_FEED_PLTR"),
    requireAddress(FEED_TSLA, "E2E_FEED_TSLA"),
  ];

  const collateral = requireAddress(COLLATERAL, "VITE_COLLATERAL_ADDRESS");
  await installWallet(page, RPC_URL, [creator, challengerA, challengerB]);
  await page.goto("/post");
  await connectWallet(page);
  await page.getByRole("textbox", { name: "Narrative" }).fill(NARRATIVE);
  await page.getByRole("button", { name: "Structure Thesis" }).click();
  await page.getByRole("button", { name: "Confirm Reference: TSLA" }).click();
  await page.getByLabel("Creator Conviction (USDG)").fill("1000");
  await page.getByRole("button", { name: "Bond & Post" }).click();
  await expect(page).toHaveURL(/\/thesis\/0x[0-9a-fA-F]{40}$/);
  const thesisAddress = new URL(page.url()).pathname
    .split("/")
    .at(-1) as `0x${string}`;
  const webOrigin = new URL(page.url()).origin;
  const context = page.context();
  const transactionPage = await context.newPage();
  await page.close();
  await installWallet(transactionPage, RPC_URL, [
    creator,
    challengerA,
    challengerB,
  ]);
  page = transactionPage;
  await page.goto(`${webOrigin}/favicon.svg`);

  for (const [account, amount, note] of [
    [challengerA, 300n, "Unlock pressure is underestimated."],
    [challengerB, 200n, "Funding already looks crowded."],
  ] as const) {
    await switchWalletAccount(page, account);
    await sendWalletTransaction(
      page,
      account,
      collateral,
      encodeFunctionData({
        abi: erc20WriteAbi,
        functionName: "approve",
        args: [thesisAddress, amount * 10n ** 18n],
      }),
    );
    await sendWalletTransaction(
      page,
      account,
      thesisAddress,
      encodeFunctionData({
        abi: challengeAbi,
        functionName: "challenge",
        args: [amount * 10n ** 18n, note],
      }),
    );
  }

  await switchWalletAccount(page, creator);
  await setLocalTimeAfterExpiry(page);
  const updatePrices = [51_450_000_000n, 18_060_000_000n, 35_900_000_000n];
  for (const [feed, price] of feeds.map(
    (feed, index) => [feed, updatePrices[index]] as const,
  )) {
    await sendWalletTransaction(
      page,
      creator,
      feed,
      encodeFunctionData({
        abi: feedUpdateAbi,
        functionName: "updateAnswer",
        args: [price],
      }),
    );
  }

  await sendWalletTransaction(
    page,
    creator,
    thesisAddress,
    encodeFunctionData({ abi: settleAbi, functionName: "settle" }),
  );
  for (const account of [creator, challengerA, challengerB]) {
    await switchWalletAccount(page, account);
    await sendWalletTransaction(
      page,
      account,
      thesisAddress,
      encodeFunctionData({ abi: claimAbi, functionName: "claim" }),
    );
  }

  const finalPage = await context.newPage();
  await installWallet(finalPage, RPC_URL, [creator, challengerA, challengerB]);
  page = finalPage;
  await page.goto(`/thesis/${thesisAddress}`);
  await connectWallet(page);
  await expect(page.getByText("SETTLED", { exact: true })).toBeVisible({
    timeout: 15_000,
  });
  await expect(
    page.getByText("Realized Alpha", { exact: true }).first(),
  ).toBeVisible();
  await expect(
    page
      .getByRole("region", { name: "Challenges" })
      .getByText("Unlock pressure is underestimated.", { exact: true }),
  ).toBeVisible();
  await expect(
    page
      .getByRole("region", { name: "Challenges" })
      .getByText("Funding already looks crowded.", { exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath("social-alpha-thread.png"),
    fullPage: true,
  });

  const [state, totalClaimed, creatorPayout, challengePayoutPool, balance] =
    await Promise.all([
      publicClient.readContract({
        address: thesisAddress,
        abi: thesisReadAbi,
        functionName: "state",
      }),
      publicClient.readContract({
        address: thesisAddress,
        abi: thesisReadAbi,
        functionName: "totalClaimed",
      }),
      publicClient.readContract({
        address: thesisAddress,
        abi: thesisReadAbi,
        functionName: "creatorPayout",
      }),
      publicClient.readContract({
        address: thesisAddress,
        abi: thesisReadAbi,
        functionName: "challengePayoutPool",
      }),
      publicClient.readContract({
        address: process.env.VITE_COLLATERAL_ADDRESS as `0x${string}`,
        abi: erc20ReadAbi,
        functionName: "balanceOf",
        args: [thesisAddress],
      }),
    ]);
  expect(Number(state)).toBe(2);
  expect(totalClaimed).toBe(creatorPayout + challengePayoutPool);
  expect(totalClaimed).toBe(1_500n * 10n ** 18n);
  expect(balance).toBe(0n);

  const fromBlock = BigInt(process.env.E2E_DEPLOYMENT_BLOCK ?? "0");
  const toBlock = await publicClient.getBlockNumber();
  const [settledLogs, claimedLogs] = await Promise.all([
    publicClient.getLogs({
      address: thesisAddress,
      event: thesisEventsAbi[0],
      fromBlock,
      toBlock,
    }),
    publicClient.getLogs({
      address: thesisAddress,
      event: thesisEventsAbi[1],
      fromBlock,
      toBlock,
    }),
  ]);
  expect(settledLogs).toHaveLength(1);
  expect(claimedLogs).toHaveLength(3);
  expect(
    new Set(claimedLogs.map((log) => log.args.claimant?.toLowerCase())),
  ).toEqual(
    new Set(
      [creator, challengerA, challengerB].map((account) =>
        account.toLowerCase(),
      ),
    ),
  );

  await page.goto("/");
  await expect(
    page.getByRole("link", { name: "Open thread →" }).first(),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Fade it →" })).toHaveCount(0);
  await page.screenshot({
    path: testInfo.outputPath("social-alpha-feed.png"),
    fullPage: true,
  });
});

test("Leaderboard and profile use settled chain data", async ({ page }, testInfo) => {
  await page.goto("/leaderboard");
  await expect(
    page.getByRole("heading", { name: "Realized P&L leaderboard" }),
  ).toBeVisible();
  await expect(page.getByText("Matched Capital").first()).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath("social-alpha-leaderboard.png"),
    fullPage: true,
  });
  await page.goto(`/profile/${requireAddress(CREATOR, "E2E_CREATOR_ADDRESS")}`);
  await expect(
    page.getByRole("heading", { name: shortAddress(CREATOR) }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Track Record" }),
  ).toBeVisible();
  await expect(page.getByText(NARRATIVE).first()).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath("social-alpha-profile.png"),
    fullPage: true,
  });
});

test("Primary navigation remains client-side", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => {
    (window as unknown as { marker?: boolean }).marker = true;
  });
  const nav = page.getByRole("navigation", { name: "Primary navigation" });
  for (const label of ["Post", "Leaderboard", "Feed"]) {
    await nav.getByRole("link", { name: label }).click();
    await expect(
      page.getByRole("link", { name: "Backfade home" }),
    ).toBeVisible();
    await expect
      .poll(() =>
        page.evaluate(() => (window as unknown as { marker?: boolean }).marker),
      )
      .toBe(true);
  }
});

test("Wrong configuration fails visibly", async ({ browser }, testInfo) => {
  const port = testInfo.project.name === "firefox" ? 5211 : 5210;
  const server = spawn(
    "npm",
    ["run", "dev", "--", "--host", "127.0.0.1", "--port", String(port)],
    {
      env: { ...process.env, VITE_FORCE_CONFIG_ERROR: "1" },
      stdio: "ignore",
      detached: true,
    },
  );
  const page = await browser.newPage();
  try {
    await expect(async () => {
      await page.goto(`http://127.0.0.1:${port}`, {
        waitUntil: "domcontentloaded",
        timeout: 5_000,
      });
      await expect(
        page.getByText("Configuration error", { exact: true }),
      ).toBeVisible({ timeout: 5_000 });
    }).toPass({ timeout: 60_000, intervals: [500, 1_000, 2_000] });
  } finally {
    await page.close();
    if (server.pid) {
      try {
        process.kill(-server.pid, "SIGTERM");
      } catch {
        // server already exited
      }
    }
  }
});
