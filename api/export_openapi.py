import json
from pathlib import Path

from api.main import app


def stable_openapi() -> dict:
    """Export a stable schema across FastAPI response-description wording changes."""
    schema = app.openapi()
    for path_item in schema.get("paths", {}).values():
        for operation in path_item.values():
            if not isinstance(operation, dict):
                continue
            responses = operation.get("responses", {})
            if "422" in responses:
                responses["422"]["description"] = "Unprocessable Content"
    return schema


def export_openapi(output: Path | None = None) -> Path:
    target = output or Path(__file__).with_name("openapi.json")
    target.write_text(json.dumps(stable_openapi(), indent=2) + "\n")
    return target


if __name__ == "__main__":
    print(export_openapi())
