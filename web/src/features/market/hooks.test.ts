import { describe, expect, it } from "vitest";
import { requireContractResult } from "@/features/market/hooks";

describe("requireContractResult", () => {
  it("returns successful chain reads", () => {
    expect(
      requireContractResult<bigint>({ status: "success", result: 7n }, "value"),
    ).toBe(7n);
  });

  it("fails closed on partial reads", () => {
    expect(() =>
      requireContractResult({ status: "failure" }, "basket[0]"),
    ).toThrow("Chain read incomplete: basket[0].");
  });
});
