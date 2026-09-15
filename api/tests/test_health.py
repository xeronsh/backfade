from api.main import app
from fastapi.testclient import TestClient


def test_health_reports_mock_mode() -> None:
    with TestClient(app) as client:
        response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "llm": "mock"}
    assert response.headers["x-request-id"]
