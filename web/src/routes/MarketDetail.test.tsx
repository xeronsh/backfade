import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeAll, describe, expect, it, vi } from "vitest";
import type { ThesisDetail } from "@/features/thesis/types";
import { LocaleProvider } from "@/lib/locale-provider";

const thesis: ThesisDetail = {
  address: "0x9Db674834F4C060114Cb53f21e179fc54F905342",
  narrative: "AMD will outperform TSLA.",
  creator: "0x1111111111111111111111111111111111111111",
  creatorBond: 1_000n * 10n ** 18n,
  challengePool: 500n * 10n ** 18n,
  openBounty: 500n * 10n ** 18n,
  matchedConviction: 500n * 10n ** 18n,
  challengeEndsAt: 1_800_000_000n,
  resolvesAt: 1_800_600_000n,
  settlementWindow: 1_800n,
  state: "OPEN",
  realizedAlphaBps: 0n,
  settledAt: 0n,
  creatorPayout: 0n,
  challengePayoutPool: 0n,
  payoutRangeBps: 1_000n,
  basket: [
    {
      feed: "0x0000000000000000000000000000000000000001",
      symbol: "AMD",
      weightBps: 10_000n,
    },
  ],
  reference: {
    feed: "0x0000000000000000000000000000000000000002",
    symbol: "TSLA",
    weightBps: 0n,
  },
  startPrices: [1n, 1n],
  liveAlphaBps: 250n,
  activities: [],
  challengers: [],
  totalClaimed: 0n,
};

vi.mock("@/features/thesis/hooks", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/features/thesis/hooks")>();
  return {
    ...actual,
    useThesis: () => ({ data: thesis, isLoading: false, error: null }),
    useThesisPosition: () => ({
      data: undefined,
      isLoading: false,
      error: null,
    }),
  };
});

vi.mock("@/features/wallet/useTransaction", () => ({
  useTransaction: () => ({
    phase: "IDLE",
    hash: null,
    isPending: false,
    execute: vi.fn(),
  }),
}));

vi.mock("wagmi", () => ({
  useAccount: () => ({ address: undefined, chainId: 46630 }),
  useSwitchChain: () => ({ switchChain: vi.fn() }),
  usePublicClient: () => undefined,
}));

let MarketDetail: typeof import("@/routes/MarketDetail").default;
beforeAll(async () => {
  MarketDetail = (await import("@/routes/MarketDetail")).default;
});

describe("Thesis thread", () => {
  it("renders Alpha, conviction, and Challenge CTA language", () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <LocaleProvider>
          <MemoryRouter initialEntries={[`/market/${thesis.address}`]}>
            <Routes>
              <Route path="market/:address" element={<MarketDetail />} />
            </Routes>
          </MemoryRouter>
        </LocaleProvider>
      </QueryClientProvider>,
    );
    expect(screen.getAllByText("AMD will outperform TSLA.")).not.toHaveLength(
      0,
    );
    expect(screen.getByText("Live Alpha · indicative")).toBeInTheDocument();
    expect(screen.getByText("Conviction Summary")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Fade this Thesis" }),
    ).toBeInTheDocument();
  });
});
