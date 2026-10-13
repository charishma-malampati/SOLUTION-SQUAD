import pytest
from app.detection.homoglyph import (
    dehomoglyph,
    detect_character_substitutions,
    detect_transposition,
)


def test_dehomoglyph_substitutions():
    assert dehomoglyph("n0vap4y") == "novapay"
    assert dehomoglyph("n0v@pay") == "novapay"


def test_detect_character_substitutions():
    subs = detect_character_substitutions("n0vapay", "novapay")
    assert len(subs) == 1
    assert subs[0]["candidate_char"] == "0"
    assert subs[0]["target_char"] == "o"
    assert subs[0]["type"] == "known_homoglyph_substitution"


def test_detect_adjacent_transposition():
    # 'novapya' is a swap of 'a' and 'y' at the end of 'novapay'
    trans = detect_transposition("novapya", "novapay")
    assert trans is not None
    assert trans["detected"] is True
    assert "Adjacent character transposition" in trans["message"]


def test_non_transposition():
    # Completely different or multi-character differences
    assert detect_transposition("novapay", "novapay") is None
    assert detect_transposition("unrelated", "novapay") is None
