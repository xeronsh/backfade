import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ErrorBoundary } from "@/app/error-boundary";

function Boom(): never {
  throw new Error("Element type is invalid: got undefined");
}

describe("ErrorBoundary", () => {
  it("renders children while nothing throws", () => {
    render(
      <ErrorBoundary>
        <p>healthy</p>
      </ErrorBoundary>,
    );
    expect(screen.getByText("healthy")).toBeInTheDocument();
  });

  it("surfaces a render failure instead of unmounting to a blank page", () => {
    // React logs the caught error; keep the test output clean.
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>,
    );
    expect(screen.getByText("Backfade failed to start")).toBeInTheDocument();
    expect(screen.getByText(/Element type is invalid/)).toBeInTheDocument();
    // It must not tell the reader to edit env files for a render error.
    expect(screen.queryByText(/env\.local/)).not.toBeInTheDocument();
    spy.mockRestore();
  });
});
