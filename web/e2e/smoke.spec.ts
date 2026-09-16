import { spawn } from "node:child_process";
import { expect, test } from "@playwright/test";
import {
  fulfillRpc,
  NARRATIVE,
  RPC_URL_PATTERN,
  THESIS_ADDRESS,
} from "./rpc-fixture";

const compiled = {
  version: 2,
  narrative: NARRATIVE,
  basket: [
    {
      symbol: "AMD",
      feed: "0x0000000000000000000000000000000000000001",
      weight_bps: 10_000,
    },
  ],
  reference: {
    symbol: "TSLA",
    feed: "0x0000000000000000000000000000000000000002",
  },
  reference_origin: "explicit",
};

test("Home loads a single-column Thesis feed", async ({ page }) => {
  await page.route(RPC_URL_PATTERN, fulfillRpc);
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Don't reply. Fade it." }),
  ).toBeVisible();
  await expect(page.getByText(NARRATIVE)).toBeVisible();
  await expect(page.getByText("Open Bounty")).toBeVisible();
  await expect(page.getByText("Fade it →")).toBeVisible();
});

test("Post flow compiles and requires Reference confirmation", async ({
  page,
}) => {
  await page.route("**/v1/thesis/compile", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(compiled),
    }),
  );
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

test("Thesis thread renders Alpha, capital, and Challenge composer", async ({
  page,
}) => {
  await page.route(RPC_URL_PATTERN, fulfillRpc);
  await page.goto(`/thesis/${THESIS_ADDRESS}`);
  await expect(page.getByText(NARRATIVE).first()).toBeVisible();
  await expect(page.getByText("Live Alpha · indicative")).toBeVisible();
  await expect(page.getByText("Conviction Summary")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Fade this Thesis" }),
  ).toBeVisible();
});

test("Leaderboard and profile use chain-derived discovery data", async ({
  page,
}) => {
  await page.route(RPC_URL_PATTERN, fulfillRpc);
  await page.goto("/leaderboard");
  await expect(
    page.getByRole("heading", { name: "Realized P&L leaderboard" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Creators" }).click();
  await expect(
    page.getByText("No resolved capital activity yet."),
  ).toBeVisible();
  await page.goto("/profile/0x1111111111111111111111111111111111111111");
  await expect(
    page.getByRole("heading", { name: "0x1111…1111" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Track Record" }),
  ).toBeVisible();
  await expect(page.getByText(NARRATIVE).first()).toBeVisible();
});

test("Primary navigation remains client-side", async ({ page }) => {
  await page.route(RPC_URL_PATTERN, fulfillRpc);
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Don't reply. Fade it." }),
  ).toBeVisible();
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
        /* server already exited */
      }
    }
  }
});
