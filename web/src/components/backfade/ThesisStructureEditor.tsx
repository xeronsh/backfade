import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  FilterBar,
  type FilterOption,
  ToggleChips,
} from "@/components/ui/filter-bar";
import { Input } from "@/components/ui/input";
import {
  type ClaimStructure,
  claimSentence,
  evenWeights,
  formatWeightPercent,
  MAX_BASKET_ASSETS,
  totalWeightBps,
  validateClaim,
  WEIGHTS_TOTAL_BPS,
} from "@/lib/claim";
import { useLocale } from "@/lib/locale-provider";

const ERROR_KEYS = {
  empty: "spec.errEmpty",
  tooMany: "spec.errTooMany",
  weightZero: "spec.errWeightZero",
  weights: "spec.errWeights",
  referenceInBasket: "spec.errReferenceInBasket",
} as const;

/**
 * Scales weights to exactly 10000 while preserving their ratios. The remainder
 * from flooring lands on the first leg so the total never drifts.
 */
function rescale(weights: number[]): number[] {
  const sum = weights.reduce((total, weight) => total + weight, 0);
  if (sum === 0) return weights;
  const scaled = weights.map((weight) =>
    Math.floor((weight * WEIGHTS_TOTAL_BPS) / sum),
  );
  scaled[0] +=
    WEIGHTS_TOTAL_BPS - scaled.reduce((total, weight) => total + weight, 0);
  return scaled;
}

/**
 * The creator authors the Thesis structure directly. The compiler only seeds it;
 * whatever ends up here is what the contract validates and scores, and the claim
 * sentence below is derived from it rather than typed.
 */
export function ThesisStructureEditor({
  structure,
  onChange,
  symbols,
  disabled = false,
}: {
  structure: ClaimStructure;
  onChange: (next: ClaimStructure) => void;
  symbols: string[];
  disabled?: boolean;
}) {
  const { t, locale } = useLocale();
  const [weightDraft, setWeightDraft] = useState<Record<string, string>>({});

  const basketSymbols = structure.basket.map((asset) => asset.symbol);
  const error = validateClaim(structure);
  const total = totalWeightBps(structure);
  // Keep the current picks visible even if the registry no longer lists them:
  // the contract, not this list, is the authority.
  const allSymbols = [
    ...new Set([...symbols, ...basketSymbols, structure.reference.symbol]),
  ];
  const option = (symbol: string): FilterOption<string> => ({
    id: symbol,
    label: symbol,
  });

  function toggleAsset(symbol: string) {
    if (basketSymbols.includes(symbol)) {
      const kept = basketSymbols.filter((entry) => entry !== symbol);
      if (kept.length === 0) return;
      const scaled = rescale(
        structure.basket
          .filter((asset) => asset.symbol !== symbol)
          .map((asset) => asset.weight_bps),
      );
      onChange({
        ...structure,
        basket: kept.map((entry, index) => ({
          symbol: entry,
          weight_bps: scaled[index],
        })),
      });
      return;
    }
    if (basketSymbols.length >= MAX_BASKET_ASSETS) return;
    const fairShare = Math.round(
      WEIGHTS_TOTAL_BPS / (basketSymbols.length + 1),
    );
    const scaled = rescale([
      ...structure.basket.map((asset) => asset.weight_bps),
      fairShare,
    ]);
    onChange({
      ...structure,
      basket: [...basketSymbols, symbol].map((entry, index) => ({
        symbol: entry,
        weight_bps: scaled[index],
      })),
    });
  }

  function setWeight(symbol: string, raw: string) {
    const parsed = Number(raw);
    const next = Number.isFinite(parsed) ? Math.round(parsed * 100) : 0;
    onChange({
      ...structure,
      basket: structure.basket.map((asset) =>
        asset.symbol === symbol ? { ...asset, weight_bps: next } : asset,
      ),
    });
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="text-narrative font-semibold">{t("spec.title")}</h2>
      </CardHeader>
      <CardContent className="pt-5">
        <div className="grid gap-2">
          <span className="text-meta uppercase tracking-label text-text-3">
            {t("spec.assets")}
          </span>
          <ToggleChips
            options={allSymbols
              .filter((symbol) => symbol !== structure.reference.symbol)
              .map(option)}
            values={basketSymbols}
            onToggle={toggleAsset}
            label={t("spec.assets")}
          />
          <span className="text-meta text-text-3">{t("spec.assetsHint")}</span>
        </div>

        {structure.basket.length > 0 ? (
          <div className="mt-5 grid gap-2">
            <span className="text-meta uppercase tracking-label text-text-3">
              {t("spec.weight")}
            </span>
            {structure.basket.map((asset) => (
              <div key={asset.symbol} className="flex items-center gap-3">
                <span className="w-16 font-mono text-meta text-text-1">
                  {asset.symbol}
                </span>
                <Input
                  type="number"
                  inputMode="decimal"
                  min="0.01"
                  max="100"
                  step="0.01"
                  disabled={disabled}
                  aria-label={`${asset.symbol} ${t("spec.weight")}`}
                  className="w-24"
                  value={
                    weightDraft[asset.symbol] ??
                    formatWeightPercent(asset.weight_bps)
                  }
                  onChange={(event) => {
                    setWeightDraft((draft) => ({
                      ...draft,
                      [asset.symbol]: event.target.value,
                    }));
                    setWeight(asset.symbol, event.target.value);
                  }}
                  onBlur={() =>
                    setWeightDraft((draft) => {
                      const next = { ...draft };
                      delete next[asset.symbol];
                      return next;
                    })
                  }
                />
                <span className="text-meta text-text-3">%</span>
              </div>
            ))}
            <div className="mt-1 flex items-center gap-4">
              <span className="font-mono text-meta text-text-2">
                {t("spec.total")} {formatWeightPercent(total)}%
              </span>
              <Button
                type="button"
                variant="ghost"
                className="min-h-9 px-2 text-meta"
                disabled={disabled}
                onClick={() =>
                  onChange({ ...structure, basket: evenWeights(basketSymbols) })
                }
              >
                {t("spec.splitEvenly")}
              </Button>
            </div>
          </div>
        ) : null}

        <div className="mt-5 grid gap-2">
          <span className="text-meta uppercase tracking-label text-text-3">
            {t("spec.reference")}
          </span>
          <FilterBar
            options={allSymbols
              .filter((symbol) => !basketSymbols.includes(symbol))
              .map(option)}
            value={structure.reference.symbol}
            onChange={(symbol) =>
              onChange({ ...structure, reference: { symbol } })
            }
            label={t("spec.reference")}
          />
        </div>

        <div className="mt-5 border-t border-border pt-5">
          <span className="text-meta uppercase tracking-label text-text-3">
            {t("spec.claim")}
          </span>
          <p className="mt-2 text-narrative font-semibold text-text-1">
            {claimSentence(structure, locale)}
          </p>
          <p className="mt-2 text-meta text-text-3">{t("spec.claimHint")}</p>
        </div>

        {error ? (
          <p className="mt-4 text-meta text-warning">{t(ERROR_KEYS[error])}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
