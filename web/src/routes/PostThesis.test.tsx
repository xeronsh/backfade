import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "@/lib/locale-provider";

const mocks = vi.hoisted(() => ({
  execute: vi.fn(),
}));

vi.mock("@/lib/api/generated", () => ({
  useListAssets: () => ({
    data: {
      data: {
        assets: [
          {
            symbol: "AMD",
            name: "AMD",
            feed: "0x0000000000000000000000000000000000000001",
            enabled: true,
          },
          {
            symbol: "PLTR",
            name: "Palantir",
            feed: "0x0000000000000000000000000000000000000003",
            enabled: true,
          },
          {
            symbol: "TSLA",
            name: "Tesla",
            feed: "0x0000000000000000000000000000000000000002",
            enabled: true,
          },
        ],
      },
    },
  }),
}));
vi.mock("@/features/thesis/hooks", () => ({
  useFactoryLimits: () => ({
    data: {
      limits: {
        allowedHorizons: [300, 3_600],
        minPayoutRangeBps: 100,
        maxPayoutRangeBps: 5_000,
      },
      narrativeMaxBytes: 2_000,
    },
  }),
}));
vi.mock("@/features/wallet/useTransaction", () => ({
  useTransaction: () => ({
    phase: "IDLE",
    hash: null,
    isPending: false,
    execute: mocks.execute,
  }),
}));
vi.mock("@rainbow-me/rainbowkit", () => ({
  useConnectModal: () => ({ openConnectModal: vi.fn() }),
}));
vi.mock("wagmi", () => ({
  useAccount: () => ({ address: undefined, chainId: 46630 }),
  usePublicClient: () => undefined,
  useSwitchChain: () => ({ switchChain: vi.fn() }),
}));

import PostThesis from "./PostThesis";

function renderPage() {
  return render(
    <LocaleProvider>
      <MemoryRouter>
        <PostThesis />
      </MemoryRouter>
    </LocaleProvider>,
  );
}

describe("Post Thesis flow", () => {
  it("keeps the Thesis and the Bet as separate authored inputs", () => {
    renderPage();

    // The Bet renders from its own structured controls.
    expect(
      screen.getByText("AMD 50% + PLTR 50% beats TSLA · 5min"),
    ).toBeInTheDocument();

    // Writing the opinion must not change the Bet: the prose is never parsed.
    fireEvent.change(screen.getByLabelText("Thesis"), {
      target: { value: "I think holding NVIDIA is better than AMD." },
    });
    expect(
      screen.getByText("AMD 50% + PLTR 50% beats TSLA · 5min"),
    ).toBeInTheDocument();
  });

  it("blocks posting while the Bet is invalid", async () => {
    renderPage();
    fireEvent.change(screen.getByLabelText("Thesis"), {
      target: { value: "AMD and PLTR beat TSLA." },
    });
    const submit = screen.getByRole("button", { name: "Bond & Post" });
    expect(submit).not.toBeDisabled();

    // 40 + 50 leaves the total at 90%, which the contract would reject.
    fireEvent.change(screen.getByLabelText("AMD Weight"), {
      target: { value: "40" },
    });

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Bond & Post" }),
      ).toBeDisabled(),
    );
    fireEvent.click(screen.getByRole("button", { name: "Bond & Post" }));
    await waitFor(() => expect(mocks.execute).not.toHaveBeenCalled());
  });
});
