"""Asset universe loaded from checked-in config. Feeds come from here, never from the LLM."""

import json
from functools import lru_cache
from pathlib import Path

DATA_PATH = Path(__file__).resolve().parent.parent / "data" / "assets.json"


@lru_cache
def load_assets() -> list[dict]:
    with open(DATA_PATH) as f:
        return json.load(f)["assets"]


def symbol_to_feed() -> dict[str, str]:
    return {a["symbol"]: a["feed"] for a in load_assets() if a.get("enabled")}
