from typing import Dict, List, Tuple, Optional, Any
from app.detection.normalizer import strip_separators

# Mapping of visually or phonetically confusable characters (homoglyphs and leetspeak)
HOMOGLYPH_MAP: Dict[str, List[str]] = {
    "0": ["o"],
    "1": ["i", "l"],
    "l": ["1", "i"],
    "i": ["1", "l"],
    "o": ["0"],
    "3": ["e"],
    "e": ["3"],
    "4": ["a"],
    "a": ["4", "@"],
    "@": ["a"],
    "5": ["s"],
    "s": ["5", "$"],
    "$": ["s"],
    "8": ["b"],
    "b": ["8"],
    "v": ["u"],
    "u": ["v"],
}


def dehomoglyph(text: str) -> str:
    """
    Replace common confusable numbers and symbols with canonical letters.
    Example: 'n0vap4y' -> 'novapay', 'n0v@pay' -> 'novapay'
    """
    mapping = {
        "0": "o",
        "1": "i",
        "3": "e",
        "4": "a",
        "@": "a",
        "5": "s",
        "$": "s",
        "8": "b",
    }
    result = []
    for ch in text.lower():
        result.append(mapping.get(ch, ch))
    return strip_separators("".join(result))


def detect_character_substitutions(candidate: str, target: str) -> List[Dict[str, str]]:
    """
    Identifies specific character substitutions between candidate and target if lengths match.
    Example: 'n0vapay' vs 'novapay' -> [{'candidate_char': '0', 'target_char': 'o', 'position': 1}]
    """
    cand_clean = strip_separators(candidate)
    target_clean = strip_separators(target)

    substitutions = []
    if len(cand_clean) == len(target_clean):
        for idx, (c_char, t_char) in enumerate(zip(cand_clean, target_clean)):
            if c_char != t_char:
                # Check if it is a known homoglyph
                confusables = HOMOGLYPH_MAP.get(c_char, [])
                if t_char in confusables:
                    substitutions.append({
                        "position": idx,
                        "candidate_char": c_char,
                        "target_char": t_char,
                        "type": "known_homoglyph_substitution"
                    })
                else:
                    substitutions.append({
                        "position": idx,
                        "candidate_char": c_char,
                        "target_char": t_char,
                        "type": "arbitrary_substitution"
                    })
    return substitutions


def detect_transposition(candidate: str, target: str) -> Optional[Dict[str, Any]]:
    """
    Detects if candidate is an adjacent character transposition (swap) of target.
    Example: 'novapya' vs 'novapay' -> True (swap 'a' and 'y' at index 4 and 5)
    """
    c = strip_separators(candidate)
    t = strip_separators(target)

    if len(c) != len(t) or c == t:
        return None

    # Find differences
    diffs = [i for i in range(len(c)) if c[i] != t[i]]
    if len(diffs) == 2:
        i, j = diffs
        # Adjacent swap check
        if j == i + 1 and c[i] == t[j] and c[j] == t[i]:
            return {
                "detected": True,
                "swapped_indices": [i, j],
                "candidate_chars": f"{c[i]}{c[j]}",
                "target_chars": f"{t[i]}{t[j]}",
                "message": f"Adjacent character transposition detected: '{c[i]}{c[j]}' swapped for '{t[i]}{t[j]}'"
            }

    return None
