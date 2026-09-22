import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ThesisSpec } from "@/components/backfade/ThesisSpec";
import type { ThesisSpecV2 } from "@/lib/api/generated/model/thesisSpecV2";
import { LocaleProvider } from "@/lib/locale-provider";

const spec: ThesisSpecV2 = {
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
};

describe("ThesisSpec", () => {
  it("renders the compiler fields and Reference origin", () => {
    render(
      <LocaleProvider>
        <ThesisSpec spec={spec} />
      </LocaleProvider>,
    );
    expect(screen.getByText(spec.narrative)).toBeInTheDocument();
    expect(screen.getByText("AMD")).toBeInTheDocument();
    expect(screen.getByText("100.00%")).toBeInTheDocument();
    expect(screen.getByText("TSLA")).toBeInTheDocument();
    expect(screen.getByText("(explicit)")).toBeInTheDocument();
  });
});
