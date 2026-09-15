import pytest
from api.assets import load_assets, symbol_to_feed
from api.services.llm import mock_compile
from api.validator import ValidationError, validate_spec


def test_mock_compiler_is_deterministic_and_valid() -> None:
    universe = load_assets()
    first = mock_compile("AI is rotating into nuclear energy.", 30, universe)
    second = mock_compile("AI is rotating into nuclear energy.", 30, universe)
    assert first == second
    assert validate_spec(first, symbol_to_feed()).model_dump() == first.model_dump()


def test_validator_fails_closed_on_wrong_weight_total() -> None:
    universe = load_assets()
    spec = mock_compile("AI is rotating into nuclear energy.", 30, universe)
    spec.basket[0].weight_bps += 1
    with pytest.raises(ValidationError) as error:
        validate_spec(spec, symbol_to_feed())
    assert error.value.code == "THESIS_INVALID"
