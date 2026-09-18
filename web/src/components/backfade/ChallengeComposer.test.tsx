import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ThesisDetail } from "@/features/thesis/types";
import { LocaleProvider } from "@/lib/locale-provider";

const mocks = vi.hoisted(() => ({ toast: vi.fn() }));
vi.mock("sonner", () => ({ toast: mocks.toast }));
vi.mock("@/features/thesis/hooks", () => ({
  useThesisPosition: () => ({ data: undefined }),
}));
vi.mock("@/features/wallet/useTransaction", () => ({
  useTransaction: () => ({
    phase: "IDLE",
    hash: null,
    isPending: false,
    execute: vi.fn(),
  }),
}));
vi.mock("@rainbow-me/rainbowkit", () => ({
  useConnectModal: () => ({ openConnectModal: vi.fn() }),
}));
vi.mock("wagmi", () => ({
  useAccount: () => ({
    address: "0x0000000000000000000000000000000000000001",
    chainId: 46630,
  }),
  useSwitchChain: () => ({ switchChain: vi.fn() }),
}));

import { ChallengeComposer } from "./ChallengeComposer";

const thesis: ThesisDetail = {
  address: "0x0000000000000000000000000000000000000010",
  narrative: "AMD will outperform TSLA.",
  creator: "0x0000000000000000000000000000000000000001",
  creatorBond: 1_000n * 10n ** 18n,
  challengePool: 500n * 10n ** 18n,
  openBounty: 500n * 10n ** 18n,
  matchedConviction: 500n * 10n ** 18n,
  challengeEndsAt: 1n,
  resolvesAt: 2n,
  settlementWindow: 3n,
  state: "OPEN",
  realizedAlphaBps: 0n,
  settledAt: 0n,
  creatorPayout: 0n,
  challengePayoutPool: 0n,
  basket: [],
  reference: {
    feed: "0x0000000000000000000000000000000000000002",
    symbol: "TSLA",
    weightBps: 0n,
  },
  startPrices: [],
  activities: [],
  challengers: [],
  totalClaimed: 0n,
};

describe("ChallengeComposer", () => {
  it("requires text and capital within Open Bounty", () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <LocaleProvider>
          <ChallengeComposer thesis={thesis} />
        </LocaleProvider>
      </QueryClientProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Fade this Thesis" }));
    expect(mocks.toast).toHaveBeenCalledWith(
      "Challenge note must be 1–280 UTF-8 bytes.",
    );

    fireEvent.change(screen.getByLabelText("Write your Challenge"), {
      target: { value: "Too much capital" },
    });
    fireEvent.change(screen.getByLabelText("Fade amount (USDG)"), {
      target: { value: "501" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Fade this Thesis" }));
    expect(mocks.toast).toHaveBeenCalledWith(
      "Fade amount cannot exceed the Open Bounty.",
    );
  });
});
