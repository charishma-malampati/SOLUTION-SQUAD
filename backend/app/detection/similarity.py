from typing import List, Set, Dict, Any


def levenshtein_distance(s1: str, s2: str) -> int:
    """
    Standard dynamic programming Levenshtein edit distance.
    Returns minimum edits (insertions, deletions, substitutions) to transform s1 to s2.
    """
    m, n = len(s1), len(s2)
    if m == 0:
        return n
    if n == 0:
        return m

    # Use two rows to optimize memory
    prev_row = list(range(n + 1))
    curr_row = [0] * (n + 1)

    for i in range(1, m + 1):
        curr_row[0] = i
        for j in range(1, n + 1):
            cost = 0 if s1[i - 1] == s2[j - 1] else 1
            curr_row[j] = min(
                curr_row[j - 1] + 1,       # insertion
                prev_row[j] + 1,           # deletion
                prev_row[j - 1] + cost     # substitution
            )
        prev_row = list(curr_row)

    return prev_row[n]


def similarity_ratio(s1: str, s2: str) -> float:
    """
    Normalized Levenshtein similarity ratio between 0.0 and 1.0.
    Formula: 1.0 - (levenshtein_distance / max(len(s1), len(s2)))
    """
    if not s1 and not s2:
        return 1.0
    if not s1 or not s2:
        return 0.0
    if s1 == s2:
        return 1.0

    max_len = max(len(s1), len(s2))
    distance = levenshtein_distance(s1, s2)
    ratio = max(0.0, 1.0 - (distance / max_len))
    return round(ratio, 4)


def jaccard_similarity(tokens1: List[str], tokens2: List[str]) -> float:
    """
    Calculates Jaccard index between two token collections:
    |Intersection| / |Union|
    """
    set1, set2 = set(tokens1), set(tokens2)
    if not set1 and not set2:
        return 1.0
    if not set1 or not set2:
        return 0.0

    intersection = set1.intersection(set2)
    union = set1.union(set2)
    return round(len(intersection) / len(union), 4)


def token_containment_ratio(target_tokens: List[str], candidate_tokens: List[str]) -> float:
    """
    Ratio of target brand tokens present inside candidate tokens.
    """
    if not target_tokens:
        return 0.0
    matched = [t for t in target_tokens if t in candidate_tokens]
    return round(len(matched) / len(target_tokens), 4)
