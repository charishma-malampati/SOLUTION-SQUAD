import re
import unicodedata
from typing import List


def normalize_text(text: str) -> str:
    """
    Standard normalization:
    1. Unicode NFKD decomposition (strips accents and special accents).
    2. Lowercasing.
    3. Stripping leading/trailing spaces.
    4. Collapsing consecutive whitespaces.
    """
    if not text:
        return ""
    # Unicode decomposition
    normalized = unicodedata.normalize("NFKD", text)
    # Strip diacritics
    stripped = "".join(c for c in normalized if not unicodedata.combining(c))
    # Lowercase
    lowered = stripped.lower().strip()
    # Collapse multiple whitespaces
    return re.sub(r"\s+", " ", lowered)


def strip_separators(text: str) -> str:
    """
    Remove all separators: punctuation, underscores, hyphens, periods, spaces.
    Example: 'Nova_Pay.Official' -> 'novapayofficial'
    """
    cleaned = normalize_text(text)
    # Remove @, #, _, -, ., spaces, and standard punctuation
    return re.sub(r"[^a-z0-9]", "", cleaned)


def tokenize(text: str) -> List[str]:
    """
    Extract alphanumeric tokens from text.
    Handles camelCase / PascalCase splitting as well as separator splitting.
    """
    if not text:
        return []
    
    # Split camelCase before normalizing: e.g. 'NovaPay' -> 'Nova Pay'
    spaced = re.sub(r"([a-z0-9])([A-Z])", r"\1 \2", text)
    cleaned = normalize_text(spaced)
    tokens = re.findall(r"[a-z0-9]+", cleaned)
    return [t for t in tokens if len(t) > 0]
