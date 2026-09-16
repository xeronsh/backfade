from fastapi.testclient import TestClient

from api.main import app


def test_compile_returns_validated_v2_thesis_spec() -> None:
    with TestClient(app) as client:
        response = client.post(
            "/v1/thesis/compile", json={"text": "AI is rotating into nuclear energy."}
        )
    assert response.status_code == 200
    body = response.json()
    assert body["version"] == 2
    assert sum(asset["weight_bps"] for asset in body["basket"]) == 10_000
    assert body["reference"]["symbol"] not in {
        asset["symbol"] for asset in body["basket"]
    }
    assert body["reference_origin"] == "suggested"


def test_explicit_reference_is_marked_for_user_confirmation() -> None:
    with TestClient(app) as client:
        response = client.post(
            "/v1/thesis/compile", json={"text": "AMD will outperform TSLA."}
        )
    assert response.status_code == 200
    body = response.json()
    assert body["reference"]["symbol"] == "TSLA"
    assert body["reference_origin"] == "explicit"


def test_compile_rejects_empty_text_with_stable_error() -> None:
    with TestClient(app) as client:
        response = client.post("/v1/thesis/compile", json={"text": ""})
    assert response.status_code == 422
    assert response.json()["error"]["code"] == "INVALID_REQUEST"
    assert "text" in response.json()["error"]["message"]
