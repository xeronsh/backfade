"""Single-call compiler with a deterministic development fallback."""

import json
import re
from http import HTTPStatus

import httpx
import structlog

from api.core.config import Settings, get_settings
from api.models import ThesisAsset, ThesisReference, ThesisSpecV2

logger = structlog.get_logger(__name__)

SYSTEM_PROMPT = """Compile a narrative into a Backfade ThesisSpecV2.
Rules:
- choose only supported assets from the supplied universe;
- basket has 1-5 assets and weights total exactly 10000 bps;
- Reference is one asset the narrative claims the basket will outperform;
- never invent feed addresses or feed fields;
- never decide payout, collateral, challenge, settlement, or financial truth;
- output only the requested schema.
"""


def _truncate_utf8(text: str, max_bytes: int = 280) -> str:
    encoded = text.encode("utf-8")
    if len(encoded) <= max_bytes:
        return text
    return encoded[:max_bytes].decode("utf-8", errors="ignore")


# Bilingual by necessity: the interface ships zh/en, so a Chinese opinion that
# names its own benchmark must not fall through to the keyword table. The `\b`
# guard is on the English branch only — `\b` never fires before a CJK character.
_REFERENCE_PATTERN = re.compile(
    r"(?:\b(?:outperform(?:s|ed)?|beat(?:s|ing)?|vs\.?|versus|against|relative\s+to)"
    r"|跑赢|胜过|强于|优于|打败|对比)\s*"
    r"\$?([A-Za-z][A-Za-z0-9_-]{1,11})\b",
    re.IGNORECASE,
)


def llm_enabled(settings: Settings | None = None) -> bool:
    return (settings or get_settings()).llm_enabled


def explicit_reference(text: str) -> str | None:
    match = _REFERENCE_PATTERN.search(text)
    return match.group(1).upper() if match else None


async def compile_thesis(
    text: str,
    universe: list[dict],
    client: httpx.AsyncClient | None = None,
    settings: Settings | None = None,
) -> ThesisSpecV2:
    """Compile once and retry once; development without a key uses the mock."""
    settings = settings or get_settings()
    if settings.llm_enabled:
        try:
            return await _compile_with_llm(text, universe, client, settings)
        except (
            httpx.HTTPError,
            ValueError,
            KeyError,
            TypeError,
            IndexError,
            RuntimeError,
        ) as error:
            logger.warning("llm.compile.retry", error=str(error))
        try:
            return await _compile_with_llm(text, universe, client, settings)
        except (
            httpx.HTTPError,
            ValueError,
            KeyError,
            TypeError,
            IndexError,
            RuntimeError,
        ) as error:
            raise RuntimeError(f"LLM compile failed: {error}") from error
    return mock_compile(text, universe)


async def _compile_with_llm(
    text: str,
    universe: list[dict],
    client: httpx.AsyncClient | None,
    settings: Settings,
) -> ThesisSpecV2:
    base_url = settings.llm_base_url.rstrip("/")
    api_key = settings.llm_api_key
    if not api_key:
        raise RuntimeError("LLM API key is not configured")

    schema = {
        "type": "object",
        "properties": {
            "narrative": {"type": "string"},
            "basket": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "symbol": {"type": "string"},
                        "weight_bps": {"type": "integer"},
                    },
                    "required": ["symbol", "weight_bps"],
                    "additionalProperties": False,
                },
            },
            "reference": {
                "type": "object",
                "properties": {"symbol": {"type": "string"}},
                "required": ["symbol"],
                "additionalProperties": False,
            },
        },
        "required": ["narrative", "basket", "reference"],
        "additionalProperties": False,
    }
    payload = {
        "model": settings.llm_model,
        "temperature": 0.1,
        "response_format": {
            "type": "json_schema",
            "json_schema": {"name": "thesis_spec_v2", "strict": True, "schema": schema},
        },
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {
                "role": "user",
                "content": (
                    f"Supported assets: {json.dumps([a['symbol'] for a in universe])}\n"
                    f"Narrative: {text}"
                ),
            },
        ],
    }

    if client is not None:
        response = await client.post(
            f"{base_url}/chat/completions",
            headers={"Authorization": f"Bearer {api_key}"},
            json=payload,
        )
    else:
        async with httpx.AsyncClient(timeout=settings.http_timeout) as fallback_client:
            response = await fallback_client.post(
                f"{base_url}/chat/completions",
                headers={"Authorization": f"Bearer {api_key}"},
                json=payload,
            )
    if response.status_code != HTTPStatus.OK:
        raise RuntimeError(f"LLM HTTP {response.status_code}")
    raw = json.loads(response.json()["choices"][0]["message"]["content"])
    reference_symbol = str(raw["reference"]["symbol"]).upper()
    return ThesisSpecV2(
        version=2,
        narrative=raw["narrative"],
        basket=raw["basket"],
        reference=ThesisReference(symbol=reference_symbol, feed=""),
        reference_origin=(
            "explicit" if explicit_reference(text) == reference_symbol else "suggested"
        ),
    )


def mock_compile(text: str, universe: list[dict]) -> ThesisSpecV2:
    """Deterministic fallback that never fabricates a feed address."""
    if isinstance(universe, dict):
        universe = universe.get("assets", [])
    enabled = [
        asset
        for asset in universe
        if isinstance(asset, dict) and asset.get("enabled", True)
    ]
    by_symbol = {asset["symbol"].upper(): asset for asset in enabled}
    if not by_symbol:
        raise ValueError("No enabled assets are configured")

    # Demo keyword table for the no-LLM fallback. Every symbol must exist in the
    # deployment allowlist: one that does not is filtered out, which silently
    # degrades the basket to an unrelated default. "meme" was dropped because
    # GME is not in the current registry and no listed equity stands in for it.
    keyword_map = {
        "nuclear": (["AMD", "PLTR", "NVDA"], "TSLA"),
        "energy": (["AMD", "PLTR"], "TSLA"),
        "ai": (["NVDA", "PLTR"], "TSLA"),
        "electric": (["TSLA", "COIN"], "AMD"),
        "crypto": (["COIN"], "TSLA"),
    }
    lowered = text.lower()
    chosen: tuple[list[str], str] | None = None
    for keyword, value in keyword_map.items():
        if keyword in lowered:
            chosen = value
            break

    explicit = explicit_reference(text)
    if explicit:
        reference_symbol = explicit
    elif chosen:
        reference_symbol = chosen[1]
    else:
        reference_symbol = next(iter(by_symbol))

    if chosen:
        symbols = [
            symbol.upper() for symbol in chosen[0] if symbol.upper() in by_symbol
        ]
    else:
        symbols = list(by_symbol)[:3]
    symbols = [symbol for symbol in symbols if symbol != reference_symbol]
    if not symbols:
        symbols = [symbol for symbol in by_symbol if symbol != reference_symbol][:1]
    if not symbols:
        # Keep an unsupported explicit Reference visible to the validator instead of
        # silently changing the user's comparison.
        symbols = list(by_symbol)[:1]

    base_weight = 10_000 // len(symbols)
    weights = [base_weight] * len(symbols)
    weights[-1] += 10_000 - sum(weights)
    basket = [
        ThesisAsset(symbol=symbol, feed=by_symbol[symbol]["feed"], weight_bps=weight)
        for symbol, weight in zip(symbols, weights)
    ]
    reference_feed = by_symbol.get(reference_symbol, {}).get("feed", "")
    return ThesisSpecV2(
        version=2,
        narrative=_truncate_utf8(text),
        basket=basket,
        reference=ThesisReference(symbol=reference_symbol, feed=reference_feed),
        reference_origin="explicit" if explicit else "suggested",
    )
