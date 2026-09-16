import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeAll, describe, expect, it, vi } from "vitest";
import type { MarketDetail as MarketDetailData } from "@/features/market/hooks";

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
    <MemoryRouter initialEntries={[`/market/${market.address}`]}>
      <Routes>
        <Route path="market/:address" element={node} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("MarketDetail layout", () => {
  it("puts the position aside in a sticky split column", () => {
    const { container } = renderRoute(<MarketDetail />);
    const aside = container.querySelector('[data-slot="split-aside"]');
    expect(aside).not.toBeNull();
    expect(aside).toHaveAttribute("data-aside-position", "sticky");
    expect(aside?.className).toContain("lg:sticky");
    expect(container.querySelector('[data-slot="split-main"]')).not.toBeNull();
  });

  it("renders every section through PageSection and the facts through data primitives", () => {
    renderRoute(<MarketDetail />);
    for (const name of [
      "ThesisSpec",
      "Pool summary",
      "Oracle observations",
      "Timeline & settlement",
      "Activity",
      "Lifecycle action",
    ]) {
      expect(screen.getByRole("region", { name })).toBeInTheDocument();
    }
    // Pool summary figures come from MetricGroup/DataRow, not hand-rolled markup.
    expect(screen.getByText("BACK pool")).toBeInTheDocument();
    expect(screen.getByText("100.00 USDG")).toBeInTheDocument();
    expect(screen.getByText(/Creator bond:/)).toBeInTheDocument();
  });
});
