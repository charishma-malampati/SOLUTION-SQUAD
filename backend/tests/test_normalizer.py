import pytest
from app.detection.normalizer import normalize_text, strip_separators, tokenize


def test_normalize_text_casing_and_whitespace():
    raw = "  NovaPay   Official  "
    assert normalize_text(raw) == "novapay official"


def test_normalize_unicode_diacritics():
    accented = "NóvàPáy"
    assert normalize_text(accented) == "novapay"


def test_strip_separators():
    assert strip_separators("@Nova_Pay.Support-2026") == "novapaysupport2026"
    assert strip_separators("Nova Pay") == "novapay"


def test_tokenize_camel_case_and_punctuation():
    tokens = tokenize("NovaPay Support-Desk")
    assert "nova" in tokens
    assert "pay" in tokens
    assert "support" in tokens
    assert "desk" in tokens
