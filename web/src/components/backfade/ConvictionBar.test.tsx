import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ConvictionBar } from "@/components/backfade/ConvictionBar";

describe("ConvictionBar", () => {
  it("renders BACK and FADE text semantics", () => {
    render(<ConvictionBar back={75n} fade={25n} />);
    expect(screen.getByLabelText("BACK 75% and FADE 25%")).toBeInTheDocument();
    expect(screen.getByText("BACK 75%")).toBeInTheDocument();
    expect(screen.getByText("FADE 25%")).toBeInTheDocument();
  });
});
