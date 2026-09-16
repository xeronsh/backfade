import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeAll, describe, expect, it, vi } from "vitest";
import type { MarketDetail as MarketDetailData } from "@/features/market/hooks";
import { LocaleProvider } from "@/lib/locale-provider";

const market: MarketDetailData = {
  address: "0x9Db674834F4C060114Cb53f21e179fc54F905342",
  narrative: "AI infrastructure outperforms the benchmark.",
  hurdleBps: 1000,
  bettingEndsAt: 1_800_000_000n,
  resolvesAt: 1_800_600_000n,
  settlementWindow: 3600n,
  creator: "0x1111111111111111111111111111111111111111",
  creatorBond: 5n * 10n ** 17n,
  backPool: 100n * 10n ** 18n,
  fadePool: 50n * 10n ** 18n,
  outcome: 0,
  narrativeAlphaBps: 250n,
  state: "OPEN",
  thesisSpec: {
    source: "chain",
    narrative: "AI infrastructure outperforms the benchmark.",
    basket: [
      {
        feed: "0x5406fc983e7f84b544ff6fc855e06c22cf36a795",
        weightBps: 6000n,
        symbol: "AMD",
      },
    ],
    benchmark: {
      feed: "0x81b48ec24970aa75ae940e2492fda006071ac31b",
      symbol: "TSLA",
    },
    hurdleBps: 1000,
    durationSeconds: 2_592_000n,
  },
  basket: [
    {
      feed: "0x5406fc983e7f84b544ff6fc855e06c22cf36a795",
      weightBps: 6000n,
      symbol: "AMD",
    },
  ],
  benchmarkFeed: "0x81b48ec24970aa75ae940e2492fda006071ac31b",
  oracle: [],
  activity: [],
  totalClaimed: 0n,
};

vi.mock("@/features/market/hooks", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/features/market/hooks")>();
  return {
    ...actual,
    useMarket: () => ({ data: market, isLoading: false, error: null }),
    useMarketPosition: () => ({ data: undefined }),
  };
});

vi.mock("@/features/wallet/useTransaction", () => ({
  useTransaction: () => ({ phase: "IDLE", hash: null, isPending: false }),
}));

vi.mock("wagmi", () => ({
  useAccount: () => ({ address: undefined, chainId: 46630 }),
  useSwitchChain: () => ({ switchChain: vi.fn() }),
}));

let MarketDetail: typeof import("@/routes/MarketDetail").default;

beforeAll(async () => {
  MarketDetail = (await import("@/routes/MarketDetail")).default;
});

function renderRoute(node: React.ReactElement) {
  return render(
    <LocaleProvider>
      <MemoryRouter initialEntries={[`/market/${market.address}`]}>
        <Routes>
          <Route path="market/:address" element={node} />
        </Routes>
      </MemoryRouter>
    </LocaleProvider>,
  );
}

describe("MarketDetail layout", () => {
  it("puts the position aside in a sticky split column", () => {
    const { container } = renderRoute(<MarketDetail />);
    const aside = container.querySelector('[data-slot="split-aside"]');
    expect(aside).not.toBeNull();
    expect(aside).toHaveAttribute("data-aside-position", "sticky");
    // jsdom does not apply stylesheets, so assert the class the sticky state
    // compiles to; the real desktop-sticky/mobile-static behaviour is proven by
    // the Playwright test that reads getComputedStyle at both viewports.
    const classes = aside?.className ?? "";
    expect(classes).toContain("lg:sticky");
    expect(classes).toContain("lg:top-24");
    expect(container.querySelector('[data-slot="split-main"]')).not.toBeNull();
  });

  it("renders the conviction chart and keyboard-ready evidence tabs", () => {
    renderRoute(<MarketDetail />);
    for (const name of [
      "Market conviction",
      "ThesisSpec",
      "Evidence",
      "Timeline & settlement",
      "Activity",
      "Lifecycle action",
    ]) {
      expect(screen.getByRole("region", { name })).toBeInTheDocument();
    }
    expect(screen.getByRole("tab", { name: "Pool summary" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(
      screen.getByRole("tab", { name: "Oracle observations" }),
    ).toHaveAttribute("aria-selected", "false");
    expect(screen.getByRole("tabpanel")).toBeInTheDocument();
    // Pool summary figures come from MetricGroup/DataRow, not hand-rolled markup.
    expect(screen.getByText("BACK pool")).toBeInTheDocument();
    expect(screen.getByText("100.00 USDG")).toBeInTheDocument();
    expect(screen.getByText(/Creator bond:/)).toBeInTheDocument();
  });
});
