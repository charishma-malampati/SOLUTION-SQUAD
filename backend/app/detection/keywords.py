import re
from typing import List, Dict, Any, Set
from app.detection.normalizer import normalize_text, tokenize

# High-risk modifier keywords commonly appended/prepended in brand impersonation attacks
SUSPICIOUS_MODIFIERS: Set[str] = {
    "official",
    "support",
    "help",
    "desk",
    "service",
    "services",
    "care",
    "customercare",
    "security",
    "verify",
    "verification",
    "verified",
    "hotline",
    "agent",
    "agents",
    "team",
    "global",
    "direct",
    "chat",
    "bot",
    "live",
    "assist",
    "assistant",
    "billing",
    "login",
    "portal",
    "secure",
    "recovery",
    "admin",
    "app",
    "wallet",
    "loan",
    "pay",
    "fastloan",
}

# High-threat phrases in bios, profile descriptions, and app listings indicating phishing or scams
SCAM_INDICATORS: List[Dict[str, Any]] = [
    {"pattern": r"\b(send|share|provide)\s+(otp|pin|password|passcode)\b", "label": "credential_solicitation", "weight": 25},
    {"pattern": r"\b(account\s+(blocked|suspended|locked|restricted|disabled))\b", "label": "urgency_account_threat", "weight": 20},
    {"pattern": r"\b(dm\s+(to|for)\s+(resolve|help|unblock|assist|support))\b", "label": "social_engineering_redirection", "weight": 18},
    {"pattern": r"\b(instant|fast|quick|easy)\s+(loan|credit|cash)\b", "label": "predatory_loan_lure", "weight": 18},
    {"pattern": r"\b(claim|free|bonus|airdrop|giveaway|cashback|reward)\b", "label": "financial_lure_giveaway", "weight": 15},
    {"pattern": r"\b(whatsapp|telegram|wa\.me|t\.me)\b", "label": "out_of_band_contact_redirect", "weight": 15},
    {"pattern": r"\b(24/7|24x7)\s+(customer\s+care|support\s+desk|helpline)\b", "label": "fake_customer_support_claim", "weight": 15},
    {"pattern": r"\b(deposit|invest|guaranteed\s+return|double\s+money)\b", "label": "investment_scam_pattern", "weight": 20},
    {"pattern": r"\b(verify\s+your\s+account|update\s+kyc|kyc\s+update)\b", "label": "fake_kyc_verification_lure", "weight": 22},
]


def detect_added_modifiers(candidate_text: str, brand_name: str) -> List[str]:
    """
    Identifies modifier keywords appended or prepended to the brand name.
    Example: 'NovaPay Support' -> ['support']
             'Official_NovaPay_Help' -> ['official', 'help']
    """
    candidate_tokens = set(tokenize(candidate_text))
    brand_tokens = set(tokenize(brand_name))

    # Candidate tokens that are NOT part of the brand itself
    additional_tokens = candidate_tokens - brand_tokens

    matched = []
    for token in additional_tokens:
        if token in SUSPICIOUS_MODIFIERS:
            matched.append(token)
    return matched


def analyze_description_scam_signals(description: str) -> Dict[str, Any]:
    """
    Scans a profile bio or app listing description for high-threat phishing and scam phrases.
    """
    if not description:
        return {"detected_signals": [], "total_scam_score": 0, "matched_patterns": []}

    cleaned_desc = normalize_text(description)
    detected = []
    matched_patterns = []
    total_score = 0

    for item in SCAM_INDICATORS:
        match = re.search(item["pattern"], cleaned_desc)
        if match:
            detected.append(item["label"])
            matched_patterns.append(match.group(0))
            total_score += item["weight"]

    # Cap raw scam score at 30
    capped_score = min(total_score, 30)

    return {
        "detected_signals": detected,
        "total_scam_score": capped_score,
        "matched_patterns": matched_patterns,
    }


def check_brand_keyword_presence(text: str, brand_name: str, brand_keywords: List[str]) -> bool:
    """
    Checks if brand name or specified brand keywords are mentioned in text.
    """
    if not text:
        return False
    cleaned = normalize_text(text)
    brand_clean = normalize_text(brand_name)
    if brand_clean in cleaned:
        return True

    for kw in brand_keywords:
        kw_clean = normalize_text(kw)
        if kw_clean and kw_clean in cleaned:
            return True
    return False
