"""LLM client: OpenAI-compatible structured output, with deterministic mock fallback.

BACKFADE_LLM_BASE_URL / BACKFADE_LLM_API_KEY / BACKFADE_LLM_MODEL configure the client.
With no key set, the deterministic mock compiler is used so the demo never breaks.
"""

import json
import os
from http import HTTPStatus

import httpx

from api.models import ThesisSpec

TIMEOUT_SECONDS = 20.0

SYSTEM_PROMPT = """You compile market narratives into structured financial theses.
Rules:
- choose only supported assets (from the provided universe);
- basket max 5 assets;
- weights total exactly 10000 bps;
- benchmark must represent the thesis comparison;
- use a conservative hurdle (100-5000 bps);
- never invent feed addresses or feed fields;
- output only schema fields;
- never determine the market outcome.
"""


def llm_enabled() -> bool:
    return bool(os.environ.get("BACKFADE_LLM_API_KEY"))


async def compile_thesis(text: str, preferred_duration_days: int | None, universe: list[dict]) -> ThesisSpec:
    """Single LLM call with structured output; one retry max; falls back to mock."""
    if llm_enabled():
        try:
            return await _compile_with_llm(text, preferred_duration_days, universe)
        except Exception:
            pass  # one retry
        try:
            return await _compile_with_llm(text, preferred_duration_days, universe)
        except Exception as e:
            raise RuntimeError(f"LLM compile failed: {e}") from e
    return mock_compile(text, preferred_duration_days, universe)


async def _compile_with_llm(
    text: str, preferred_duration_days: int | None, universe: list[dict]
) -> ThesisSpec:
    base_url = os.environ.get("BACKFADE_LLM_BASE_URL", "https://api.openai.com/v1").rstrip("/")
    api_key = os.environ["BACKFADE_LLM_API_KEY"]
    model = os.environ.get("BACKFADE_LLM_MODEL", "gpt-4o-mini")
    duration = preferred_duration_days or 30

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
            "benchmark": {
                "type": "object",
                "properties": {"symbol": {"type": "string"}},
                "required": ["symbol"],
                "additionalProperties": False,
            },
            "hurdle_bps": {"type": "integer"},
            "duration_days": {"type": "integer"},
            "human_condition": {"type": "string"},
            "risk": {
                "type": "object",
                "properties": {
                    "level": {"type": "string", "enum": ["LOW", "MEDIUM", "HIGH"]},
                    "warnings": {"type": "array", "items": {"type": "string"}},
                },
                "required": ["level", "warnings"],
                "additionalProperties": False,
            },
        },
        "required": [
            "narrative",
            "basket",
            "benchmark",
            "hurdle_bps",
            "duration_days",
            "human_condition",
            "risk",
        ],
        "additionalProperties": False,
    }

    payload = {
        "model": model,
        "temperature": 0.1,
        "response_format": {
            "type": "json_schema",
            "json_schema": {"name": "thesis_spec", "strict": True, "schema": schema},
        },
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {
                "role": "user",
                "content": (
                    f"Supported assets: {json.dumps([a['symbol'] for a in universe])}\n"
                    f"Narrative: {text}\n"
                    f"Preferred duration: {duration} days."
                ),
            },
        ],
    }

    async with httpx.AsyncClient(timeout=TIMEOUT_SECONDS) as client:
        resp = await client.post(
            f"{base_url}/chat/completions",
            headers={"Authorization": f"Bearer {api_key}"},
            json=payload,
        )
        if resp.status_code != HTTPStatus.OK:
            raise RuntimeError(f"LLM HTTP {resp.status_code}")
        content = resp.json()["choices"][0]["message"]["content"]
        raw = json.loads(content)

    # feeds are attached by the backend, never by the LLM
    return ThesisSpec(
        version=1,
        narrative=raw["narrative"],
        basket=raw["basket"],
        benchmark=raw["benchmark"],
        hurdle_bps=raw["hurdle_bps"],
        duration_days=raw.get("duration_days") or duration,
        human_condition=raw["human_condition"],
        risk=raw["risk"],
    )


def mock_compile(text: str, preferred_duration_days: int | None, universe: list[dict]) -> ThesisSpec:
    """Deterministic fallback: keywords -> basket. Keeps the demo loop alive without a key."""
    duration = preferred_duration_days or 30
    enabled = [a for a in universe if a.get("enabled")]
    by_symbol = {a["symbol"]: a for a in enabled}

    keyword_map = {
        "nuclear": (["CEG", "VST", "GEV"], [4000, 3500, 2500], "NVDA"),
        "energy": (["CEG", "VST", "GEV"], [4000, 3500, 2500], "NVDA"),
        "ai": (["NVDA", "PLTR"], [6000, 4000], "SPY"),
        "crypto": (["COIN", "HOOD"], [5000, 5000], "SPY"),
        "meme": (["GME", "AMC"], [5000, 5000], "SPY"),
    }
    lowered = text.lower()
    chosen: tuple | None = None
    for kw, val in keyword_map.items():
        if kw in lowered:
            chosen = val
            break
    if chosen is None:
        # default: equal-weight top-3 non-benchmark assets vs SPY
        syms = [a["symbol"] for a in enabled if a["symbol"] != "SPY"][:3]
        chosen = (syms, [10_000 // len(syms)] * len(syms), "SPY")

    syms, weights, benchmark = chosen
    basket = [
        {"symbol": s, "feed": by_symbol[s]["feed"], "weight_bps": w} for s, w in zip(syms, weights)
    ]
    # fix rounding so weights always sum to 10000
    basket[-1]["weight_bps"] += 10_000 - sum(w["weight_bps"] for w in basket)

    hurdle_bps = 1000
    condition = (
        f"{'/'.join(syms)} must outperform {benchmark} by at least "
        f"{hurdle_bps / 100:.0f}% over {duration} days."
    )
    return ThesisSpec(
        version=1,
        narrative=text[:280],
        basket=basket,
        benchmark={"symbol": benchmark, "feed": by_symbol[benchmark]["feed"]},
        hurdle_bps=hurdle_bps,
        duration_days=duration,
        human_condition=condition,
        risk={"level": "HIGH", "warnings": ["Mock compilation: verify weights before launch."]},
    )
