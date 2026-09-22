import { describe, expect, it } from "vitest";
import {
  canonicalClaim,
  claimSentence,
  evenWeights,
  totalWeightBps,
  validateClaim,
  WEIGHTS_TOTAL_BPS,
} from "@/lib/claim";

const structure = {
  basket: [
    { symbol: "AMD", weight_bps: 6000 },
    { symbol: "PLTR", weight_bps: 4000 },
  ],
  reference: { symbol: "TSLA" },
};

describe("claimSentence", () => {
  it("derives the sentence from structure alone", () => {
    expect(canonicalClaim(structure)).toBe("AMD 60% + PLTR 40% beats TSLA");
  });

  it("renders the same structure in Chinese", () => {
    expect(claimSentence(structure, "zh")).toBe("AMD 60% + PLTR 40% 跑赢 TSLA");
  });

  it("trims trailing zeros on split weights", () => {
    expect(
      canonicalClaim({
        basket: [{ symbol: "AMD", weight_bps: 3334 }],
        reference: { symbol: "TSLA" },
      }),
    ).toBe("AMD 33.34% beats TSLA");
  });
});

describe("validateClaim", () => {
  it("accepts a well-formed structure", () => {
    expect(validateClaim(structure)).toBeNull();
  });

  it("rejects each contract-level violation", () => {
    expect(validateClaim({ ...structure, basket: [] })).toBe("empty");
    expect(
      validateClaim({
        basket: Array.from({ length: 6 }, (_, i) => ({
          symbol: `S${i}`,
          weight_bps: 1667,
        })),
        reference: { symbol: "TSLA" },
      }),
    ).toBe("tooMany");
    expect(
      validateClaim({
        basket: [{ symbol: "AMD", weight_bps: 0 }],
        reference: { symbol: "TSLA" },
      }),
    ).toBe("weightZero");
    expect(
      validateClaim({
        basket: [{ symbol: "AMD", weight_bps: 5000 }],
        reference: { symbol: "TSLA" },
      }),
    ).toBe("weights");
    expect(
      validateClaim({
        basket: [{ symbol: "AMD", weight_bps: WEIGHTS_TOTAL_BPS }],
        reference: { symbol: "AMD" },
      }),
    ).toBe("referenceInBasket");
  });
});

describe("evenWeights", () => {
  it("sums to exactly 10000 for every basket size the contract accepts", () => {
    for (let count = 1; count <= 5; count += 1) {
      const basket = evenWeights(
        Array.from({ length: count }, (_, i) => `S${i}`),
      );
      expect(totalWeightBps({ basket, reference: { symbol: "REF" } })).toBe(
        WEIGHTS_TOTAL_BPS,
      );
    }
  });
});
