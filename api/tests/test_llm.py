import re
from pathlib import Path

import pytest

from api.assets import load_assets, symbol_to_feed
from api.services.llm import mock_compile
from api.validator import NARRATIVE_MAX_BYTES, ValidationError, validate_spec

REPO_ROOT = Path(__file__).resolve().parents[2]


def test_mock_compiler_is_deterministic_and_valid() -> None:
    universe = load_assets()
    first = mock_compile("AI is rotating into nuclear energy.", universe)
    second = mock_compile("AI is rotating into nuclear energy.", universe)
    assert first == second
    validated = validate_spec(first, symbol_to_feed())
    assert validated.model_dump() == first.model_dump()
    assert validated.version == 2
    assert validated.reference_origin == "suggested"


def test_keyword_fallback_uses_deployed_feed_allowlist() -> None:
    feed_map = symbol_to_feed()
    for text in ("AI infrastructure is accelerating.", "Electric adoption is rising."):
        validated = validate_spec(mock_compile(text, load_assets()), feed_map)
        assert validated.reference.symbol in feed_map
        assert all(asset.symbol in feed_map for asset in validated.basket)


def test_explicit_reference_survives_compilation() -> None:
    spec = mock_compile("AMD will outperform TSLA.", load_assets())
    assert spec.reference.symbol == "TSLA"
    assert spec.reference_origin == "explicit"
    assert (
        validate_spec(spec, symbol_to_feed()).reference.feed == symbol_to_feed()["TSLA"]
    )


def test_explicit_reference_is_read_from_chinese_connectors() -> None:
    """The interface ships zh/en; a zh opinion naming its benchmark must not
    fall through to the keyword table and seed an unrelated structure."""
    spec = mock_compile("AMD 和 PLTR 本周将跑赢 TSLA。", load_assets())
    assert spec.reference.symbol == "TSLA"
    assert spec.reference_origin == "explicit"


def test_validator_fails_closed_on_wrong_weight_total() -> None:
    universe = load_assets()
    spec = mock_compile("AI is rotating into nuclear energy.", universe)
    spec.basket[0].weight_bps += 1
    with pytest.raises(ValidationError) as error:
        validate_spec(spec, symbol_to_feed())
    assert error.value.code == "THESIS_INVALID"


def test_validator_rejects_unsupported_reference() -> None:
    spec = mock_compile("HYPE will outperform BTC.", load_assets())
    with pytest.raises(ValidationError) as error:
        validate_spec(spec, symbol_to_feed())
    assert error.value.code == "ASSET_UNSUPPORTED"


def test_narrative_limit_matches_the_contract() -> None:
    """The cap belongs to ProtocolLimits.sol. Drift between the two would make the
    API accept or reject narratives the contract treats differently."""
    source = (REPO_ROOT / "contracts/src/ProtocolLimits.sol").read_text()
    match = re.search(r"NARRATIVE_MAX_BYTES\s*=\s*([\d_]+)", source)
    assert match is not None, "NARRATIVE_MAX_BYTES is missing from ProtocolLimits.sol"
    assert int(match.group(1).replace("_", "")) == NARRATIVE_MAX_BYTES


def test_validator_counts_utf8_bytes_not_characters() -> None:
    """Three bytes per CJK character, so the byte cap bites well before the
    character count does."""
    accepted = mock_compile("A valid thesis.", load_assets()).model_copy(
        update={"narrative": "啊" * 666}
    )
    assert len(accepted.narrative.encode("utf-8")) == 1_998
    validate_spec(accepted, symbol_to_feed())

    rejected = accepted.model_copy(update={"narrative": "啊" * 667})
    with pytest.raises(ValidationError, match="UTF-8 bytes"):
        validate_spec(rejected, symbol_to_feed())
