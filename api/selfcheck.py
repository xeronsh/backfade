"""Self-check for the compiler API: validator + mock compile + live endpoint."""

import subprocess
import sys
import time

import httpx
from api.assets import load_assets, symbol_to_feed
from api.llm import mock_compile
from api.validator import ValidationError, validate_spec


def test_mock_compile_valid():
    universe = load_assets()
    spec = mock_compile("AI is rotating into nuclear energy.", 30, universe)
    validated = validate_spec(spec, symbol_to_feed())
    assert sum(a.weight_bps for a in validated.basket) == 10_000
    assert 1 <= len(validated.basket) <= 5
    assert validated.basket[0].symbol == "AMD"
    assert validated.benchmark.symbol == "TSLA"
    # feeds must come from the mapping, not from anywhere else
    mapping = symbol_to_feed()
    assert all(a.feed == mapping[a.symbol] for a in validated.basket)
    print("mock compile + validate: OK")


def test_validator_rejects_bad_weights():
    universe = load_assets()
    spec = mock_compile("AI is rotating into nuclear energy.", 30, universe)
    spec = spec.model_copy(update={"basket": spec.basket[:3]})
    broken = spec.basket[0].model_copy(update={"weight_bps": 5000})
    spec.basket[0] = broken
    try:
        validate_spec(spec, symbol_to_feed())
        raise AssertionError("expected ValidationError")
    except ValidationError as e:
        assert e.code == "THESIS_INVALID"
    print("validator rejects bad weights: OK")


def test_validator_rejects_benchmark_in_basket():
    universe = load_assets()
    spec = mock_compile("crypto exchange flows", 30, universe)
    spec.basket[0] = spec.basket[0].model_copy(update={"symbol": spec.benchmark.symbol})
    spec.basket[0] = spec.basket[0].model_copy(update={"symbol": "SPY"})
    try:
        validate_spec(spec, symbol_to_feed())
        raise AssertionError("expected ValidationError")
    except ValidationError:
        pass
    print("validator rejects benchmark in basket: OK")


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
        r = httpx.post(
            f"{base}/v1/thesis/compile",
            json={
                "text": "AI is rotating into nuclear energy.",
                "preferred_duration_days": 30,
            },
            timeout=10,
        )
        assert r.status_code == 200, r.text
        body = r.json()
        assert sum(a["weight_bps"] for a in body["basket"]) == 10_000
        assert body["hurdle_bps"] == 1000

        r2 = httpx.get(f"{base}/v1/assets", timeout=10)
        assert r2.status_code == 200 and len(r2.json()["assets"]) >= 5
        print("live endpoint: OK")
    finally:
        proc.terminate()


if __name__ == "__main__":
    test_mock_compile_valid()
    test_validator_rejects_bad_weights()
    test_validator_rejects_benchmark_in_basket()
    test_live_endpoint()
    print("ALL BACKEND CHECKS PASSED")
