"""Asset universe loaded from checked-in config. Feeds come from here, never from the LLM."""

import json
import os
from functools import lru_cache
from pathlib import Path

DATA_PATH = Path(__file__).resolve().parent.parent / "data" / "assets.json"


@lru_cache
def load_assets() -> list[dict]:
    # The isolated wallet-backed E2E supplies a temporary local-feed registry;
    # production and normal tests always use the checked-in registry.
    path = Path(os.environ.get("BACKFADE_ASSETS_PATH", DATA_PATH))
    with open(path) as f:
        data = json.load(f)
    return data["assets"] if isinstance(data, dict) else data


def symbol_to_feed() -> dict[str, str]:
    return {a["symbol"]: a["feed"] for a in load_assets() if a.get("enabled")}
