import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "@/lib/locale-provider";

const mocks = vi.hoisted(() => ({
  mutateAsync: vi.fn(),
  execute: vi.fn(),
}));

vi.mock("@/lib/api/generated", () => ({
  useCompileThesis: () => ({
    mutateAsync: mocks.mutateAsync,
    isPending: false,
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

describe("Post Thesis flow", () => {
  it("requires a confirmed Reference before the wallet step", async () => {
    mocks.mutateAsync.mockResolvedValueOnce({
      status: 200,
      data: {
        version: 2,
        narrative: "AMD will outperform TSLA.",
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
      },
    });
    render(
      <LocaleProvider>
        <MemoryRouter>
          <PostThesis />
        </MemoryRouter>
      </LocaleProvider>,
    );

    fireEvent.change(screen.getByLabelText("Narrative"), {
      target: { value: "AMD will outperform TSLA." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Structure Thesis" }));
    expect(
      await screen.findByRole("button", { name: "Confirm Reference: TSLA" }),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Creator Conviction (USDG)"), {
      target: { value: "1000" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Bond & Post" }));
    await waitFor(() => expect(mocks.execute).not.toHaveBeenCalled());

    fireEvent.click(
      screen.getByRole("button", { name: "Confirm Reference: TSLA" }),
    );
    expect(
      screen.getByRole("button", { name: "Reference confirmed: TSLA" }),
    ).toBeInTheDocument();
  });
});
