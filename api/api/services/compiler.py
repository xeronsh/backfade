import httpx

from api.core.config import Settings
from api.models import ThesisSpecV2
from api.services.llm import compile_thesis as compile_with_model
from api.validator import validate_spec


async def compile_narrative(
    text: str,
    universe: list[dict],
    feed_map: dict[str, str],
    client: httpx.AsyncClient | None,
    settings: Settings,
) -> ThesisSpecV2:
    raw = await compile_with_model(text, universe, client, settings)
    return validate_spec(raw, feed_map)
