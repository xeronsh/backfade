"""Fail-closed deterministic validator. Never trust LLM output."""

from api.models import ThesisAsset, ThesisBenchmark, ThesisRisk, ThesisSpec

WEIGHTS_TOTAL_BPS = 10_000
BASKET_MIN = 1
BASKET_MAX = 5
HURDLE_MIN_BPS = 100
HURDLE_MAX_BPS = 5_000
DURATION_MIN_DAYS = 7
DURATION_MAX_DAYS = 90
NARRATIVE_MAX_CHARS = 280


class ValidationError(Exception):
    def __init__(self, code: str, message: str):
        self.code = code
        self.message = message
        super().__init__(message)


def validate_spec(
    spec: ThesisSpec,
    symbol_to_feed: dict[str, str],
) -> ThesisSpec:
    """Validate a compiled ThesisSpec against the trusted asset universe.

    Re-anchors all feed addresses from the backend mapping — feeds never come
    from the LLM. Raises ValidationError (fail closed) on any violation.
    """
    if not (BASKET_MIN <= len(spec.basket) <= BASKET_MAX):
        raise ValidationError("THESIS_INVALID", f"Basket must have {BASKET_MIN}-{BASKET_MAX} assets.")

    symbols = [a.symbol.upper() for a in spec.basket]
    if len(set(symbols)) != len(symbols):
        raise ValidationError("THESIS_INVALID", "Basket contains duplicate symbols.")
    benchmark_symbol = spec.benchmark.symbol.upper()
    if benchmark_symbol in symbols:
        raise ValidationError("THESIS_INVALID", "Benchmark must not appear in the basket.")

    weight_sum = sum(a.weight_bps for a in spec.basket)
    if weight_sum != WEIGHTS_TOTAL_BPS:
        raise ValidationError(
            "THESIS_INVALID",
            f"The basket weights do not sum to 100% (got {weight_sum} bps).",
        )

    # re-anchor feeds from trusted mapping
    basket: list[ThesisAsset] = []
    for a in spec.basket:
        sym = a.symbol.upper()
        if sym not in symbol_to_feed:
            raise ValidationError("ASSET_UNSUPPORTED", f"Asset {sym} is not supported.")
        basket.append(ThesisAsset(symbol=sym, feed=symbol_to_feed[sym], weight_bps=a.weight_bps))

    bench_sym = spec.benchmark.symbol.upper()
    if bench_sym not in symbol_to_feed:
        raise ValidationError("ASSET_UNSUPPORTED", f"Benchmark {bench_sym} is not supported.")
    benchmark = ThesisBenchmark(symbol=bench_sym, feed=symbol_to_feed[bench_sym])

    if not (HURDLE_MIN_BPS <= spec.hurdle_bps <= HURDLE_MAX_BPS):
        raise ValidationError(
            "THESIS_INVALID",
            f"Hurdle must be between {HURDLE_MIN_BPS/100:.0f}% and {HURDLE_MAX_BPS/100:.0f}%.",
        )
    if not (DURATION_MIN_DAYS <= spec.duration_days <= DURATION_MAX_DAYS):
        raise ValidationError(
            "THESIS_INVALID",
            f"Duration must be {DURATION_MIN_DAYS}-{DURATION_MAX_DAYS} days.",
        )
    if not spec.narrative.strip():
        raise ValidationError("THESIS_INVALID", "Narrative is empty.")
    if len(spec.narrative) > NARRATIVE_MAX_CHARS:
        raise ValidationError("THESIS_INVALID", f"Narrative exceeds {NARRATIVE_MAX_CHARS} characters.")
    if not spec.human_condition.strip():
        raise ValidationError("THESIS_INVALID", "Human-readable condition is missing.")
    spec.risk.level = ThesisRisk.model_validate(spec.risk.model_dump()).level  # literal enforced

    return spec.model_copy(
        update={
            "basket": basket,
            "benchmark": benchmark,
            "narrative": spec.narrative.strip(),
        }
    )
