import { isAddress } from "viem";
import { describe, expect, it } from "vitest";

describe("configuration boundaries", () => {
  it("accepts only a 20-byte route address", () => {
    expect(isAddress("0x0000000000000000000000000000000000000001")).toBe(true);
    expect(isAddress("not-an-address")).toBe(false);
  });
});
