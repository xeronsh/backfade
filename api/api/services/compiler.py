import httpx

from api.core.config import Settings
from api.models import ThesisSpec
from api.services.llm import compile_thesis as compile_with_model
from api.validator import validate_spec


async def compile_narrative(
    text: str,
    preferred_duration_days: int | None,
    universe: list[dict],
    feed_map: dict[str, str],
    client: httpx.AsyncClient | None,
    settings: Settings,
) -> ThesisSpec:
    raw = await compile_with_model(
        text, preferred_duration_days, universe, client, settings
    )
    return validate_spec(raw, feed_map)
