"""Self-check for the compiler API: validator + mock compile + live endpoint."""

import subprocess
import sys
import time

import httpx

from api.assets import load_assets, symbol_to_feed
from api.services.llm import mock_compile
from api.validator import ValidationError, validate_spec


def test_mock_compile_valid():
    universe = load_assets()
    spec = mock_compile("AI is rotating into nuclear energy.", universe)
    validated = validate_spec(spec, symbol_to_feed())
    assert validated.version == 2
    assert sum(a.weight_bps for a in validated.basket) == 10_000
    assert 1 <= len(validated.basket) <= 5
    assert validated.basket[0].symbol == "AMD"
    assert validated.reference.symbol == "TSLA"
    mapping = symbol_to_feed()
    assert all(a.feed == mapping[a.symbol] for a in validated.basket)
    assert validated.reference.feed == mapping[validated.reference.symbol]
    print("mock compile + validate: OK")


def test_validator_rejects_bad_weights():
    universe = load_assets()
    spec = mock_compile("AI is rotating into nuclear energy.", universe)
    spec = spec.model_copy(update={"basket": spec.basket[:3]})
    broken = spec.basket[0].model_copy(update={"weight_bps": 5000})
    spec.basket[0] = broken
    try:
        validate_spec(spec, symbol_to_feed())
        raise AssertionError("expected ValidationError")
    except ValidationError as e:
        assert e.code == "THESIS_INVALID"
    print("validator rejects bad weights: OK")


def test_validator_rejects_unsupported_reference():
    spec = mock_compile("HYPE will outperform BTC.", load_assets())
    try:
        validate_spec(spec, symbol_to_feed())
        raise AssertionError("expected ValidationError")
    except ValidationError as e:
        assert e.code == "ASSET_UNSUPPORTED"
    print("validator rejects unsupported reference: OK")


def test_live_endpoint():
    proc = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "api.main:app", "--port", "8899"],
        cwd=".",
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    try:
        base = "http://127.0.0.1:8899"
        for _ in range(50):
            try:
                if httpx.get(f"{base}/health", timeout=1).status_code == 200:
                    break
            except httpx.HTTPError:
                time.sleep(0.2)
        response = httpx.post(
            f"{base}/v1/thesis/compile",
            json={"text": "AI is rotating into nuclear energy."},
            timeout=10,
        )
        assert response.status_code == 200, response.text
        body = response.json()
        assert body["version"] == 2
        assert sum(a["weight_bps"] for a in body["basket"]) == 10_000
        assert body["reference_origin"] == "suggested"

        assets = httpx.get(f"{base}/v1/assets", timeout=10)
        assert assets.status_code == 200 and len(assets.json()["assets"]) >= 5
        print("live endpoint: OK")
    finally:
        proc.terminate()


if __name__ == "__main__":
    test_mock_compile_valid()
    test_validator_rejects_bad_weights()
    test_validator_rejects_unsupported_reference()
    test_live_endpoint()
    print("ALL BACKEND CHECKS PASSED")
