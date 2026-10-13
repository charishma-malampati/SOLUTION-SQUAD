import pytest
from app.detection.engine import (
    analyze_social_profile,
    analyze_app_listing,
    classify_risk_category,
)


def test_classify_risk_category_boundaries():
    assert classify_risk_category(15.0) == "Low"
    assert classify_risk_category(29.9) == "Low"
    assert classify_risk_category(30.0) == "Medium"
    assert classify_risk_category(59.9) == "Medium"
    assert classify_risk_category(60.0) == "High"
    assert classify_risk_category(79.9) == "High"
    assert classify_risk_category(80.0) == "Critical"
    assert classify_risk_category(100.0) == "Critical"


def test_social_high_threat_impersonation():
    brand_name = "NovaPay"
    brand_aliases = ["Nova Pay"]
    brand_keywords = ["banking", "wallet", "payments"]
    official_assets = [
        {"platform": "Instagram", "handle": "novapay_bank", "url": "https://instagram.com/novapay_bank"}
    ]

    candidate = {
        "platform": "Instagram",
        "username": "NovaPay_Support_Care",
        "display_name": "NovaPay Official Helpdesk",
        "profile_url": "https://instagram.com/novapay_support_care",
        "bio": "24/7 Official Customer Support. Account suspended? DM to unlock. Send OTP to resolve.",
    }

    res = analyze_social_profile(
        candidate=candidate,
        brand_name=brand_name,
        brand_aliases=brand_aliases,
        brand_keywords=brand_keywords,
        official_assets=official_assets,
    )

    assert res["is_excluded"] is False
    assert res["risk_score"] >= 60.0  # High or Critical
    assert res["risk_category"] in ["High", "Critical"]
    assert any("Impersonation keyword" in r for r in res["detection_reasons"])
    assert any("Suspicious bio language" in r for r in res["detection_reasons"])


def test_social_homoglyph_attack():
    brand_name = "NovaPay"
    candidate = {
        "platform": "X",
        "username": "N0vaPay_Official",
        "display_name": "N0vaPay Account",
        "profile_url": "https://x.com/N0vaPay_Official",
        "bio": "Fast verification department for NovaPay users.",
    }

    res = analyze_social_profile(
        candidate=candidate,
        brand_name=brand_name,
        brand_aliases=[],
        brand_keywords=[],
        official_assets=[],
    )

    assert res["risk_score"] >= 60.0
    assert any("Deceptive character substitution" in r for r in res["detection_reasons"])


def test_social_unrelated_business_low_risk():
    brand_name = "NovaPay"
    candidate = {
        "platform": "Instagram",
        "username": "NovakBakery",
        "display_name": "Novak Artisan Bakery",
        "profile_url": "https://instagram.com/novakbakery",
        "bio": "Fresh sourdough, croissants, and espresso since 1998.",
    }

    res = analyze_social_profile(
        candidate=candidate,
        brand_name=brand_name,
        brand_aliases=[],
        brand_keywords=[],
        official_assets=[],
    )

    assert res["risk_category"] == "Low"
    assert res["risk_score"] < 30.0


def test_app_predatory_loan_impersonator():
    brand_name = "NovaPay"
    official_apps = [
        {
            "package_id": "com.novapay.app",
            "publisher_name": "NovaPay Technologies Ltd",
        }
    ]

    candidate = {
        "app_name": "NovaPay Quick Loan - Instant Cash",
        "package_id": "com.novapay.loan.fast",
        "developer_name": "Apex Microfinance LLC",
        "store_name": "Google Play",
        "store_url": "https://play.google.com/store/apps/details?id=com.novapay.loan.fast",
        "description": "Instant loan approval in 5 minutes! Claim cashback reward.",
    }

    res = analyze_app_listing(
        candidate=candidate,
        brand_name=brand_name,
        brand_aliases=[],
        brand_keywords=[],
        official_apps=official_apps,
    )

    assert res["is_excluded"] is False
    assert res["risk_category"] in ["High", "Critical"]
    assert any("Unrecognized developer" in r for r in res["detection_reasons"])
