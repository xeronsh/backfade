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
    .getByLabel("Narrative")
    .fill("AI infrastructure outperforms the benchmark.");
  await page.getByRole("button", { name: "Compile thesis" }).click();
  await expect(page.getByText("AMD 100%")).toBeVisible();
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
