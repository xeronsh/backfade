import type { Locale } from "@/lib/i18n";

/** Onchain weights are basis points and must sum to exactly this. */
export const WEIGHTS_TOTAL_BPS = 10_000;

/** Mirrors `MAX_BASKET_ASSETS` in ProtocolLimits.sol. */
export const MAX_BASKET_ASSETS = 5;

/**
 * The Bet: the short, deterministic half of a Thesis. The opinion is free prose
 * stored as `narrative`; this structure is what the contract validates and
 * settles. The two are authored separately and never derived from each other,
 * because an opinion says more than any single bet can encode.
 */
export interface BetStructure {
  basket: Array<{ symbol: string; weight_bps: number }>;
  reference: { symbol: string };
  /** Chosen from the factory's horizon allowlist. */
  horizonSeconds: number;
  /** Alpha that maps to a full Challenge Pool transfer. Bounded by the factory. */
  payoutRangeBps: number;
}

export interface BetLimits {
  minPayoutRangeBps: number;
  maxPayoutRangeBps: number;
  allowedHorizons: number[];
}

export type BetError =
  | "empty"
  | "tooMany"
  | "weightZero"
  | "weights"
  | "referenceInBasket"
  | "horizon"
  | "payoutRange";

/** Percent form of a weight, trailing zeros trimmed: 6000 -> "60", 3334 -> "33.34". */
export function formatWeightPercent(bps: number): string {
  return String(Number((bps / 100).toFixed(2)));
}

/** A duration in the largest unit that divides it, so any allowlist renders. */
export function formatHorizon(seconds: number, locale: Locale): string {
  const zh = locale === "zh";
  if (seconds < 60) return zh ? `${seconds} 秒` : `${seconds}s`;
  if (seconds < 3_600) {
    const minutes = seconds / 60;
    return zh ? `${minutes} 分钟` : `${minutes}min`;
  }
  if (seconds < 86_400) {
    const hours = seconds / 3_600;
    return zh ? `${hours} 小时` : `${hours}h`;
  }
  const days = seconds / 86_400;
  return zh ? `${days} 天` : `${days}d`;
}

/** The settlement band, shown as the Alpha that fully transfers the pool. */
export function formatPayoutRange(bps: number): string {
  return `±${formatWeightPercent(bps)}%`;
}

/**
 * The Bet rendered for humans: what it claims and over what window. This is
 * derived from the structure, never typed, so it cannot disagree with the
 * numbers that pay out.
 */
export function betSentence(structure: BetStructure, locale: Locale): string {
  const legs = structure.basket
    .map((asset) => `${asset.symbol} ${formatWeightPercent(asset.weight_bps)}%`)
    .join(" + ");
  const beats = locale === "zh" ? "跑赢" : "beats";
  const horizon = formatHorizon(structure.horizonSeconds, locale);
  return `${legs} ${beats} ${structure.reference.symbol} · ${horizon}`;
}

export function totalWeightBps(structure: BetStructure): number {
  return structure.basket.reduce((sum, asset) => sum + asset.weight_bps, 0);
}

/** The first reason the contract would reject this Bet, or null. */
export function validateBet(
  structure: BetStructure,
  limits: BetLimits,
): BetError | null {
  if (structure.basket.length === 0) return "empty";
  if (structure.basket.length > MAX_BASKET_ASSETS) return "tooMany";
  if (structure.basket.some((asset) => asset.weight_bps <= 0))
    return "weightZero";
  if (totalWeightBps(structure) !== WEIGHTS_TOTAL_BPS) return "weights";
  if (
    structure.basket.some(
      (asset) => asset.symbol === structure.reference.symbol,
    )
  )
    return "referenceInBasket";
  if (!limits.allowedHorizons.includes(structure.horizonSeconds))
    return "horizon";
  if (
    structure.payoutRangeBps < limits.minPayoutRangeBps ||
    structure.payoutRangeBps > limits.maxPayoutRangeBps
  )
    return "payoutRange";
  return null;
}

/**
 * Equal split with the division remainder on the first leg, so the total is
 * exact without a normalisation pass.
 */
export function evenWeights(symbols: string[]) {
  const base = Math.floor(WEIGHTS_TOTAL_BPS / symbols.length);
  return symbols.map((symbol, index) => ({
    symbol,
    weight_bps:
      index === 0 ? base + (WEIGHTS_TOTAL_BPS - base * symbols.length) : base,
  }));
}
