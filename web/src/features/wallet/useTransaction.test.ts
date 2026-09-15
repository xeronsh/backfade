import { describe, expect, it } from "vitest";
import { assertReceiptSuccess } from "@/features/wallet/useTransaction";

describe("assertReceiptSuccess", () => {
  it("accepts a successful receipt", () => {
    expect(() => assertReceiptSuccess("success")).not.toThrow();
  });

  it("rejects a reverted receipt", () => {
    expect(() => assertReceiptSuccess("reverted")).toThrow(
      "Transaction reverted onchain.",
    );
  });
});
