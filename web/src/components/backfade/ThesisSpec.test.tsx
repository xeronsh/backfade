import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ThesisSpec } from "@/components/backfade/ThesisSpec";
import type { ThesisSpec as Spec } from "@/lib/api/generated/model/thesisSpec";
import { LocaleProvider } from "@/lib/locale-provider";

const spec: Spec = {
  version: 1,
  narrative: "AI infrastructure outperforms.",
  basket: [
    {
      symbol: "AMD",
      feed: "0x0000000000000000000000000000000000000001",
      weight_bps: 6000,
    },
  ],
  benchmark: {
    symbol: "TSLA",
    feed: "0x0000000000000000000000000000000000000002",
  },
  hurdle_bps: 1000,
  duration_days: 30,
  human_condition: "AMD must beat TSLA by 10%.",
  risk: { level: "HIGH", warnings: ["Test warning"] },
};

describe("ThesisSpec", () => {
  it("renders the machine claim fields", () => {
    render(
      <LocaleProvider>
        <ThesisSpec spec={spec} />
      </LocaleProvider>,
    );
    expect(screen.getByText(spec.human_condition)).toBeInTheDocument();
    expect(screen.getByText("AMD 60%")).toBeInTheDocument();
    expect(screen.getByText("TSLA")).toBeInTheDocument();
    expect(screen.getByText("10.00%")).toBeInTheDocument();
  });
});
