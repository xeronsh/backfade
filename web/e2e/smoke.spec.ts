import { spawn } from "node:child_process";
import { expect, test } from "@playwright/test";
import { fulfillRpc, MARKET_ADDRESS, RPC_URL_PATTERN } from "./rpc-fixture";

const compiled = {
  version: 1,
  narrative: "AI infrastructure outperforms the benchmark.",
  basket: [
    {
      symbol: "AMD",
      feed: "0x0000000000000000000000000000000000000001",
      weight_bps: 10000,
    },
  ],
  benchmark: {
    symbol: "TSLA",
    feed: "0x0000000000000000000000000000000000000002",
  },
  hurdle_bps: 1000,
  duration_days: 30,
  human_condition: "AMD must outperform TSLA by 10%.",
  risk: { level: "MEDIUM", warnings: [] },
};

test("Feed loads", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Feed" })).toBeVisible();
});

test("Create page compiles a thesis", async ({ page }) => {
  await page.route("**/v1/thesis/compile", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(compiled),
    }),
  );
  await page.goto("/create");
  await expect(
    page.getByRole("heading", { name: "Create thesis" }),
  ).toBeVisible();
  await page
    .getByRole("textbox", { name: "Narrative", exact: true })
    .fill("AI infrastructure outperforms the benchmark.");
  await page.getByRole("button", { name: "Compile thesis" }).click();
  await expect(
    page.getByText("AMD 100%", { exact: false }).first(),
  ).toBeVisible();
});

test("Create keeps two columns down to 1024px", async ({ page }) => {
  await page.route("**/v1/thesis/compile", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(compiled),
    }),
  );
  for (const width of [1100, 1024]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/create");
    await page
      .getByRole("textbox", { name: "Narrative", exact: true })
      .fill("AI infrastructure outperforms the benchmark.");
    await page.getByRole("button", { name: "Compile thesis" }).click();
    await expect(page.getByText("AMD 100%")).toBeVisible();

    const narrative = await page
      .getByRole("region", { name: "Human narrative" })
      .boundingBox();
    const claim = await page
      .getByRole("region", { name: "Machine financial claim" })
      .boundingBox();
    expect(narrative).not.toBeNull();
    expect(claim).not.toBeNull();
    if (!narrative || !claim) throw new Error("column bounding boxes missing");
    // Side by side, not stacked: the claim column starts right of the narrative.
    expect(claim.x).toBeGreaterThan(narrative.x + narrative.width - 1);
    expect(Math.abs(claim.y - narrative.y)).toBeLessThan(8);
    // The compiled preview carries the bond terms, not an empty box.
    await expect(page.getByText("Entry closes")).toBeVisible();
    await expect(page.getByText("Resolves")).toBeVisible();
  }
});

test("Position aside is sticky on desktop and static on mobile", async ({
  page,
}) => {
  // The market route renders its split layout only after chain data resolves,
  // so serve the multicall fixture instead of letting the route fall back to
  // its empty state. There is deliberately no early return here: if the aside
  // stops rendering, this test must fail rather than pass vacuously.
  await page.route(RPC_URL_PATTERN, fulfillRpc);

  for (const viewport of [
    { width: 1280, height: 900, expected: "sticky" },
    { width: 720, height: 900, expected: "static" },
  ]) {
    await page.setViewportSize({
      width: viewport.width,
      height: viewport.height,
    });
    await page.goto(`/market/${MARKET_ADDRESS}`);

    // Wait for the loaded state: while the chain read is pending the route
    // renders its own SplitLayout skeleton, so asserting early can catch a node
    // that React is about to replace.
    await expect(
      page.getByRole("region", { name: "Pool summary" }),
    ).toBeVisible();

    const aside = page.locator('[data-slot="split-aside"]');
    await expect(aside).toHaveCount(1);
    await expect(aside).toHaveAttribute("data-aside-position", "sticky");
    await expect
      .poll(() => aside.evaluate((node) => getComputedStyle(node).position), {
        message: `aside position at ${viewport.width}px`,
      })
      .toBe(viewport.expected);
  }
});

test("Market route renders every section once chain data resolves", async ({
  page,
}) => {
  await page.route(RPC_URL_PATTERN, fulfillRpc);
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(`/market/${MARKET_ADDRESS}`);

  for (const name of [
    "ThesisSpec",
    "Pool summary",
    "Oracle observations",
    "Timeline & settlement",
    "Activity",
    "Lifecycle action",
  ]) {
    await expect(page.getByRole("region", { name })).toHaveCount(1);
  }
  // Pool figures come from MetricGroup/DataRow, not hand-rolled markup.
  await expect(page.getByText("BACK pool")).toBeVisible();
  await expect(page.getByText("100.00 USDG")).toBeVisible();
});

test("Primary navigation is client-side and keeps the chrome", async ({
  page,
}) => {
  await page.route(RPC_URL_PATTERN, fulfillRpc);
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Feed" })).toBeVisible();

  // A document reload would wipe this marker.
  await page.evaluate(() => {
    (window as unknown as { __navMarker?: boolean }).__navMarker = true;
  });

  const nav = page.getByRole("navigation", { name: "Primary navigation" });
  for (const label of ["Create", "Feed", "Create", "Feed"]) {
    await nav.getByRole("link", { name: label }).click();
    // The header must still be there straight away: no blank skeleton swap.
    await expect(
      page.getByRole("link", { name: "Backfade home" }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () =>
          (window as unknown as { __navMarker?: boolean }).__navMarker === true,
      ),
      "navigation must not reload the document",
    ).toBe(true);
  }

  // Moving between routes with different content keeps the shell mounted too.
  await page.goto(`/market/${MARKET_ADDRESS}`);
  await expect(
    page.getByRole("region", { name: "Pool summary" }),
  ).toBeVisible();
  await page.evaluate(() => {
    (window as unknown as { __navMarker?: boolean }).__navMarker = true;
  });
  await nav.getByRole("link", { name: "Feed" }).click();
  await expect(page.getByRole("heading", { name: "Feed" })).toBeVisible();
  expect(
    await page.evaluate(
      () =>
        (window as unknown as { __navMarker?: boolean }).__navMarker === true,
    ),
  ).toBe(true);
});

test("Market route validates address", async ({ page }) => {
  await page.goto("/market/not-an-address");
  await expect(
    page.getByRole("heading", { name: "Invalid market address" }),
  ).toBeVisible();
});

test("Profile route validates address", async ({ page }) => {
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
    // Vite can serve index.html before it has finished compiling the module
    // graph, in which case the app never boots and nothing renders. Retry the
    // whole load until the error surface actually appears instead of breaking
    // on the first successful document load.
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
        // The server may already have exited.
      }
    }
  }
});

test("Language toggle switches the interface and persists", async ({
  page,
}) => {
  await page.route(RPC_URL_PATTERN, fulfillRpc);
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Feed" })).toBeVisible();

  // English is the default for an en-US browser.
  await expect(page.getByRole("link", { name: "Backfade home" })).toBeVisible();

  await page.getByRole("button", { name: "zh", exact: true }).click();
  await expect(page.getByRole("heading", { name: "观点流" })).toBeVisible();
  const zhNav = page.getByRole("navigation", { name: "主导航" });
  await expect(
    zhNav.getByRole("link", { name: "创建", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Backfade 首页" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.lang)).toBe(
    "zh-CN",
  );

  // The choice survives a navigation and a reload.
  await zhNav.getByRole("link", { name: "创建", exact: true }).click();
  await expect(page.getByRole("heading", { name: "创建观点" })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: "创建观点" })).toBeVisible();

  await page.getByRole("button", { name: "en", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Create thesis" }),
  ).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.lang)).toBe("en");
});

test("Switching language leaves the header geometry unchanged", async ({
  page,
}) => {
  await page.route(RPC_URL_PATTERN, fulfillRpc);
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Feed" })).toBeVisible();

  // The wallet control and the language toggle sit next to each other, so a
  // width change in either would slide its neighbour. English and Chinese copy
  // differ in length, so both must be pinned to a fixed slot.
  const header = () =>
    page.evaluate(() => {
      const slot = (element: Element | undefined) => {
        if (!element) return null;
        const rect = element.getBoundingClientRect();
        return { x: Math.round(rect.x), width: Math.round(rect.width) };
      };
      return {
        toggle: slot(
          document.querySelector("header button[aria-pressed]") ?? undefined,
        ),
        wallet: slot(
          [...document.querySelectorAll("header button")].pop() ?? undefined,
        ),
      };
    });

  const before = await header();
  expect(before.toggle).not.toBeNull();
  expect(before.wallet).not.toBeNull();

  await page.getByRole("button", { name: "zh", exact: true }).click();
  await expect(page.getByRole("heading", { name: "观点流" })).toBeVisible();

  const after = await header();
  expect(after.wallet).toEqual(before.wallet);
  expect(after.toggle).toEqual(before.toggle);
});
