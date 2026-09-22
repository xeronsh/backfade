import { describe, expect, it } from "vitest";
import {
  type BetLimits,
  type BetStructure,
  betSentence,
  evenWeights,
  formatHorizon,
  formatPayoutRange,
  totalWeightBps,
  validateBet,
  WEIGHTS_TOTAL_BPS,
} from "@/lib/bet";

const limits: BetLimits = {
  minPayoutRangeBps: 100,
  maxPayoutRangeBps: 5_000,
  allowedHorizons: [300, 3_600, 28_800, 86_400, 604_800],
};

const bet: BetStructure = {
  basket: [
    { symbol: "AMD", weight_bps: 6000 },
    { symbol: "PLTR", weight_bps: 4000 },
  ],
  reference: { symbol: "TSLA" },
  horizonSeconds: 28_800,
  payoutRangeBps: 1_000,
};

describe("betSentence", () => {
  it("derives the claim and its window from the structure alone", () => {
    expect(betSentence(bet, "en")).toBe("AMD 60% + PLTR 40% beats TSLA · 8h");
  });

  it("renders the same structure in Chinese", () => {
    expect(betSentence(bet, "zh")).toBe(
      "AMD 60% + PLTR 40% 跑赢 TSLA · 8 小时",
    );
  });

  it("trims trailing zeros on split weights", () => {
    expect(
      betSentence(
        { ...bet, basket: [{ symbol: "AMD", weight_bps: 3334 }] },
        "en",
      ),
    ).toBe("AMD 33.34% beats TSLA · 8h");
  });
});

describe("formatHorizon", () => {
  it("picks the largest dividing unit so any allowlist renders", () => {
    expect(formatHorizon(300, "en")).toBe("5min");
    expect(formatHorizon(3_600, "en")).toBe("1h");
    expect(formatHorizon(86_400, "zh")).toBe("1 天");
    expect(formatHorizon(604_800, "zh")).toBe("7 天");
    expect(formatHorizon(45, "en")).toBe("45s");
  });
});

describe("formatPayoutRange", () => {
  it("reads as the Alpha that fully transfers the pool", () => {
    expect(formatPayoutRange(1_000)).toBe("±10%");
    expect(formatPayoutRange(100)).toBe("±1%");
    expect(formatPayoutRange(250)).toBe("±2.5%");
  });
});

describe("validateBet", () => {
  it("accepts a well-formed bet", () => {
    expect(validateBet(bet, limits)).toBeNull();
  });

  it("rejects each contract-level violation", () => {
    expect(validateBet({ ...bet, basket: [] }, limits)).toBe("empty");
    expect(
      validateBet(
        {
          ...bet,
          basket: Array.from({ length: 6 }, (_, i) => ({
            symbol: `S${i}`,
            weight_bps: 1667,
          })),
        },
        limits,
      ),
    ).toBe("tooMany");
    expect(
      validateBet(
        { ...bet, basket: [{ symbol: "AMD", weight_bps: 0 }] },
        limits,
      ),
    ).toBe("weightZero");
    expect(
      validateBet(
        { ...bet, basket: [{ symbol: "AMD", weight_bps: 5000 }] },
        limits,
      ),
    ).toBe("weights");
    expect(validateBet({ ...bet, reference: { symbol: "AMD" } }, limits)).toBe(
      "referenceInBasket",
    );
  });

  it("rejects a horizon the factory does not allow", () => {
    expect(validateBet({ ...bet, horizonSeconds: 10_800 }, limits)).toBe(
      "horizon",
    );
  });

  it("rejects a payout range outside the factory bounds", () => {
    expect(validateBet({ ...bet, payoutRangeBps: 99 }, limits)).toBe(
      "payoutRange",
    );
    expect(validateBet({ ...bet, payoutRangeBps: 5_001 }, limits)).toBe(
      "payoutRange",
    );
  });
});

describe("evenWeights", () => {
  it("sums to exactly 10000 for every basket size the contract accepts", () => {
    for (let count = 1; count <= 5; count += 1) {
      const basket = evenWeights(
        Array.from({ length: count }, (_, i) => `S${i}`),
      );
      expect(
        totalWeightBps({
          ...bet,
          basket,
        }),
      ).toBe(WEIGHTS_TOTAL_BPS);
    }
  });
});
