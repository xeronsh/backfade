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
  type BetError,
  type BetLimits,
  type BetStructure,
  betSentence,
  evenWeights,
  formatHorizon,
  formatPayoutRange,
  formatWeightPercent,
  MAX_BASKET_ASSETS,
  totalWeightBps,
  validateBet,
  WEIGHTS_TOTAL_BPS,
} from "@/lib/bet";
import { useLocale } from "@/lib/locale-provider";

const ERROR_KEYS = {
  empty: "bet.errEmpty",
  tooMany: "bet.errTooMany",
  weightZero: "bet.errWeightZero",
  weights: "bet.errWeights",
  referenceInBasket: "bet.errReferenceInBasket",
  horizon: "bet.errHorizon",
  payoutRange: "bet.errPayoutRange",
} as const satisfies Record<BetError, string>;

/// Presets spanning the factory's legal range. Anything outside the deployed
/// bounds is dropped, and the current value is kept visible even if it is not a
/// preset, so a bound change can never hide the selected range.
const PAYOUT_PRESETS = [100, 500, 1_000, 2_500, 5_000];

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
 * The creator authors the Bet directly: what is held, against what, over how
 * long, and how much Alpha moves the pool. The compiler is not involved — the
 * thesis is prose, the Bet is precise, and the two are written separately.
 */
export function BetEditor({
  bet,
  onChange,
  symbols,
  limits,
  disabled = false,
}: {
  bet: BetStructure;
  onChange: (next: BetStructure) => void;
  symbols: string[];
  limits: BetLimits;
  disabled?: boolean;
}) {
  const { t, locale } = useLocale();
  const [weightDraft, setWeightDraft] = useState<Record<string, string>>({});

  const basketSymbols = bet.basket.map((asset) => asset.symbol);
  const error = validateBet(bet, limits);
  const total = totalWeightBps(bet);
  // Keep the current picks visible even if the registry no longer lists them:
  // the contract, not this list, is the authority.
  const allSymbols = [
    ...new Set([...symbols, ...basketSymbols, bet.reference.symbol]),
  ];
  const option = (symbol: string): FilterOption<string> => ({
    id: symbol,
    label: symbol,
  });
  const payoutOptions = [
    ...new Set([
      ...PAYOUT_PRESETS.filter(
        (bps) =>
          bps >= limits.minPayoutRangeBps && bps <= limits.maxPayoutRangeBps,
      ),
      bet.payoutRangeBps,
    ]),
  ].sort((a, b) => a - b);

  function toggleAsset(symbol: string) {
    if (basketSymbols.includes(symbol)) {
      const kept = basketSymbols.filter((entry) => entry !== symbol);
      if (kept.length === 0) return;
      const scaled = rescale(
        bet.basket
          .filter((asset) => asset.symbol !== symbol)
          .map((asset) => asset.weight_bps),
      );
      onChange({
        ...bet,
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
      ...bet.basket.map((asset) => asset.weight_bps),
      fairShare,
    ]);
    onChange({
      ...bet,
      basket: [...basketSymbols, symbol].map((entry, index) => ({
        symbol: entry,
        weight_bps: scaled[index],
      })),
    });
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="text-narrative font-semibold">{t("bet.title")}</h2>
      </CardHeader>
      <CardContent className="pt-5">
        <div className="grid gap-2">
          <span className="text-meta uppercase tracking-label text-text-3">
            {t("bet.assets")}
          </span>
          <ToggleChips
            options={allSymbols
              .filter((symbol) => symbol !== bet.reference.symbol)
              .map(option)}
            values={basketSymbols}
            onToggle={toggleAsset}
            label={t("bet.assets")}
          />
          <span className="text-meta text-text-3">{t("bet.assetsHint")}</span>
        </div>

        {bet.basket.length > 0 ? (
          <div className="mt-5 grid gap-2">
            <span className="text-meta uppercase tracking-label text-text-3">
              {t("bet.weight")}
            </span>
            {bet.basket.map((asset) => (
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
                  aria-label={`${asset.symbol} ${t("bet.weight")}`}
                  className="w-24"
                  value={
                    weightDraft[asset.symbol] ??
                    formatWeightPercent(asset.weight_bps)
                  }
                  onChange={(event) => {
                    const raw = event.target.value;
                    setWeightDraft((draft) => ({
                      ...draft,
                      [asset.symbol]: raw,
                    }));
                    const parsed = Number(raw);
                    onChange({
                      ...bet,
                      basket: bet.basket.map((entry) =>
                        entry.symbol === asset.symbol
                          ? {
                              ...entry,
                              weight_bps: Number.isFinite(parsed)
                                ? Math.round(parsed * 100)
                                : 0,
                            }
                          : entry,
                      ),
                    });
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
                {t("bet.total")} {formatWeightPercent(total)}%
              </span>
              <Button
                type="button"
                variant="ghost"
                className="min-h-9 px-2 text-meta"
                disabled={disabled}
                onClick={() =>
                  onChange({ ...bet, basket: evenWeights(basketSymbols) })
                }
              >
                {t("bet.splitEvenly")}
              </Button>
            </div>
          </div>
        ) : null}

        <div className="mt-5 grid gap-2">
          <span className="text-meta uppercase tracking-label text-text-3">
            {t("bet.reference")}
          </span>
          <FilterBar
            options={allSymbols
              .filter((symbol) => !basketSymbols.includes(symbol))
              .map(option)}
            value={bet.reference.symbol}
            onChange={(symbol) => onChange({ ...bet, reference: { symbol } })}
            label={t("bet.reference")}
          />
        </div>

        <div className="mt-5 grid gap-2">
          <span className="text-meta uppercase tracking-label text-text-3">
            {t("bet.horizon")}
          </span>
          <FilterBar
            options={limits.allowedHorizons.map((seconds) => ({
              id: String(seconds),
              label: formatHorizon(seconds, locale),
            }))}
            value={String(bet.horizonSeconds)}
            onChange={(next) =>
              onChange({ ...bet, horizonSeconds: Number(next) })
            }
            label={t("bet.horizon")}
          />
        </div>

        <div className="mt-5 grid gap-2">
          <span className="text-meta uppercase tracking-label text-text-3">
            {t("bet.payoutRange")}
          </span>
          <FilterBar
            options={payoutOptions.map((bps) => ({
              id: String(bps),
              label: formatPayoutRange(bps),
            }))}
            value={String(bet.payoutRangeBps)}
            onChange={(next) =>
              onChange({ ...bet, payoutRangeBps: Number(next) })
            }
            label={t("bet.payoutRange")}
          />
          <span className="text-meta text-text-3">
            {t("bet.payoutRangeHint")}
          </span>
        </div>

        <div className="mt-5 border-t border-border pt-5">
          <span className="text-meta uppercase tracking-label text-text-3">
            {t("bet.summary")}
          </span>
          <p className="mt-2 text-narrative font-semibold text-text-1">
            {betSentence(bet, locale)}
          </p>
          <p className="mt-2 text-meta text-text-3">{t("bet.summaryHint")}</p>
        </div>

        {error ? (
          <p className="mt-4 text-meta text-warning">{t(ERROR_KEYS[error])}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
