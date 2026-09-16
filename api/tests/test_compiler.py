from fastapi.testclient import TestClient

from api.main import app


def test_compile_returns_validated_thesis_spec() -> None:
    with TestClient(app) as client:
        response = client.post(
            "/v1/thesis/compile", json={"text": "AI is rotating into nuclear energy."}
        )
    assert response.status_code == 200
    body = response.json()
    assert sum(asset["weight_bps"] for asset in body["basket"]) == 10_000
    assert body["benchmark"]["symbol"] not in {
        asset["symbol"] for asset in body["basket"]
    }


def test_compile_rejects_empty_text_with_stable_error() -> None:
    with TestClient(app) as client:
        response = client.post("/v1/thesis/compile", json={"text": ""})
    assert response.status_code == 422
    assert response.json()["error"]["code"] == "INVALID_REQUEST"
    assert "text" in response.json()["error"]["message"]
