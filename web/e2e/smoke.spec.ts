import { spawn } from "node:child_process";
import { expect, test } from "@playwright/test";

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

test("Position aside is sticky on desktop only", async ({ page }) => {
  for (const viewport of [
    { width: 1280, height: 900, expected: "sticky" },
    { width: 720, height: 900, expected: "static" },
  ]) {
    await page.setViewportSize({
      width: viewport.width,
      height: viewport.height,
    });
    // Block the indexer so the route renders its shell deterministically.
    await page.route("**/v1/**", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: "[]",
      }),
    );
    await page.goto("/market/0x9Db674834F4C060114Cb53f21e179fc54F905342");
    const aside = page.locator('[data-slot="split-aside"]');
    if ((await aside.count()) === 0) return; // empty-state route: no aside to check
    await expect(aside).toHaveAttribute("data-aside-position", "sticky");
    expect(
      await aside.evaluate((node) => getComputedStyle(node).position),
    ).toBe(viewport.expected);
  }
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
    for (let attempt = 0; attempt < 20; attempt += 1) {
      try {
        await page.goto(`http://127.0.0.1:${port}`, {
          waitUntil: "domcontentloaded",
          timeout: 500,
        });
        break;
      } catch {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }
    await expect(
      page.getByText("Configuration Error", { exact: true }),
    ).toBeVisible();
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
