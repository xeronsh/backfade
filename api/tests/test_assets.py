from fastapi.testclient import TestClient

from api.main import app


def test_assets_only_returns_enabled_registry_entries() -> None:
    with TestClient(app) as client:
        response = client.get("/v1/assets")
    assert response.status_code == 200
    assets = response.json()["assets"]
    assert len(assets) >= 5
    assert all(asset["enabled"] for asset in assets)
