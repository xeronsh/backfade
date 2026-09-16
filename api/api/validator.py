"""Fail-closed deterministic validator. Never trust LLM feeds or weights."""

from api.models import ThesisAsset, ThesisReference, ThesisSpecV2

WEIGHTS_TOTAL_BPS = 10_000
BASKET_MIN = 1
BASKET_MAX = 5
NARRATIVE_MAX_BYTES = 280


class ValidationError(Exception):
    def __init__(self, code: str, message: str):
        self.code = code
        self.message = message
        super().__init__(message)


def validate_spec(
    spec: ThesisSpecV2,
    symbol_to_feed: dict[str, str],
) -> ThesisSpecV2:
    """Validate a compiled spec and re-anchor every feed to the trusted registry."""
    if not (BASKET_MIN <= len(spec.basket) <= BASKET_MAX):
        raise ValidationError(
            "THESIS_INVALID", f"Basket must have {BASKET_MIN}-{BASKET_MAX} assets."
        )

    trusted = {symbol.upper(): feed for symbol, feed in symbol_to_feed.items()}
    symbols = [asset.symbol.upper() for asset in spec.basket]
    if len(set(symbols)) != len(symbols):
        raise ValidationError("THESIS_INVALID", "Basket contains duplicate symbols.")
    reference_symbol = spec.reference.symbol.upper()
    if reference_symbol in symbols:
        raise ValidationError(
            "THESIS_INVALID", "Reference must not appear in the basket."
        )

    weight_sum = sum(asset.weight_bps for asset in spec.basket)
    if any(
        asset.weight_bps < 1 or asset.weight_bps > WEIGHTS_TOTAL_BPS
        for asset in spec.basket
    ):
        raise ValidationError(
            "THESIS_INVALID", "Every basket weight must be between 1 and 10000 bps."
        )
    if weight_sum != WEIGHTS_TOTAL_BPS:
        raise ValidationError(
            "THESIS_INVALID",
            f"The basket weights do not sum to 10000 bps (got {weight_sum}).",
        )
    if not spec.narrative.strip():
        raise ValidationError("THESIS_INVALID", "Narrative is empty.")
    if len(spec.narrative.encode("utf-8")) > NARRATIVE_MAX_BYTES:
        raise ValidationError(
            "THESIS_INVALID", f"Narrative exceeds {NARRATIVE_MAX_BYTES} UTF-8 bytes."
        )

    basket: list[ThesisAsset] = []
    for asset in spec.basket:
        symbol = asset.symbol.upper()
        if symbol not in trusted:
            raise ValidationError(
                "ASSET_UNSUPPORTED", f"Asset {symbol} is not supported."
            )
        basket.append(
            ThesisAsset(
                symbol=symbol, feed=trusted[symbol], weight_bps=asset.weight_bps
            )
        )

    if reference_symbol not in trusted:
        raise ValidationError(
            "ASSET_UNSUPPORTED", f"Reference {reference_symbol} is not supported."
        )
    reference = ThesisReference(symbol=reference_symbol, feed=trusted[reference_symbol])
    return spec.model_copy(
        update={
            "basket": basket,
            "reference": reference,
            "narrative": spec.narrative.strip(),
        }
    )
