import type { Locale } from "@/lib/i18n";

/** Onchain weights are basis points and must sum to exactly this. */
export const WEIGHTS_TOTAL_BPS = 10_000;

/** Mirrors `ThesisFactory.MAX_BASKET_ASSETS`. */
export const MAX_BASKET_ASSETS = 5;

/**
 * The scored claim: one to five weighted assets against one Reference. These are
 * exactly the fields `ThesisFactory._validate` checks, so the sentence is
 * derived from them instead of being stored as free text — the words a creator
 * bonds and the numbers that pay out cannot disagree.
 */
export interface ClaimStructure {
  basket: Array<{ symbol: string; weight_bps: number }>;
  reference: { symbol: string };
}

export type ClaimError =
  | "empty"
  | "tooMany"
  | "weightZero"
  | "weights"
  | "referenceInBasket";

/** Percent form of a weight, trailing zeros trimmed: 6000 -> "60", 3334 -> "33.34". */
export function formatWeightPercent(bps: number): string {
  return String(Number((bps / 100).toFixed(2)));
}

/**
 * The claim rendered for humans. `canonicalClaim` is the English form written
 * onchain; the feed re-derives the sentence from the structured fields, so one
 * stored record reads in every locale without parsing the string.
 */
export function claimSentence(
  structure: ClaimStructure,
  locale: Locale,
): string {
  const legs = structure.basket
    .map((asset) => `${asset.symbol} ${formatWeightPercent(asset.weight_bps)}%`)
    .join(" + ");
  return `${legs} ${locale === "zh" ? "跑赢" : "beats"} ${structure.reference.symbol}`;
}

export function canonicalClaim(structure: ClaimStructure): string {
  return claimSentence(structure, "en");
}

export function totalWeightBps(structure: ClaimStructure): number {
  return structure.basket.reduce((sum, asset) => sum + asset.weight_bps, 0);
}

/** The first reason the contract would reject this structure, or null. */
export function validateClaim(structure: ClaimStructure): ClaimError | null {
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
