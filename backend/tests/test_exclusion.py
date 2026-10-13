import pytest
from app.detection.exclusion import (
    check_social_official_exclusion,
    check_app_official_exclusion,
)


def test_official_social_handle_exclusion():
    official_assets = [
        {"platform": "X", "handle": "NovaPayOfficial", "url": "https://x.com/NovaPayOfficial"},
        {"platform": "Instagram", "handle": "novapay_bank", "url": "https://instagram.com/novapay_bank"},
    ]

    # Candidate with '@NovaPayOfficial' on X should be excluded
    res = check_social_official_exclusion(
        candidate_platform="X",
        candidate_username="@NovaPayOfficial",
        candidate_url="https://x.com/NovaPayOfficial",
        official_assets=official_assets,
    )
    assert res["is_excluded"] is True
    assert "Matches registered official handle" in res["exclusion_reason"]


def test_unofficial_social_not_excluded():
    official_assets = [
        {"platform": "X", "handle": "NovaPayOfficial", "url": "https://x.com/NovaPayOfficial"},
    ]

    res = check_social_official_exclusion(
        candidate_platform="X",
        candidate_username="NovaPay_Support",
        candidate_url="https://x.com/NovaPay_Support",
        official_assets=official_assets,
    )
    assert res["is_excluded"] is False


def test_official_app_exclusion():
    official_apps = [
        {
            "package_id": "com.novapay.app",
            "publisher_name": "NovaPay Technologies Ltd",
            "store_url": "https://play.google.com/store/apps/details?id=com.novapay.app",
        }
    ]

    res = check_app_official_exclusion(
        candidate_app_name="NovaPay: Mobile Banking",
        candidate_package_id="com.novapay.app",
        candidate_developer="NovaPay Technologies Ltd",
        candidate_store="Google Play",
        candidate_url="https://play.google.com/store/apps/details?id=com.novapay.app",
        official_apps=official_apps,
    )
    assert res["is_excluded"] is True
    assert res["conflict_detected"] is False


def test_app_identity_conflict_not_excluded():
    # Package ID matches official app, but publisher is an unrecognized hacker studio!
    official_apps = [
        {
            "package_id": "com.novapay.app",
            "publisher_name": "NovaPay Technologies Ltd",
            "store_url": "https://play.google.com/store/apps/details?id=com.novapay.app",
        }
    ]

    res = check_app_official_exclusion(
        candidate_app_name="NovaPay Modded APK",
        candidate_package_id="com.novapay.app",
        candidate_developer="Rogue Dev Studio",
        candidate_store="Third-Party Mirror",
        candidate_url="https://mirror.com/app.apk",
        official_apps=official_apps,
    )
    # Must NOT be silently excluded!
    assert res["is_excluded"] is False
    assert res["conflict_detected"] is True
    assert "CRITICAL CONFLICT" in res["conflict_reason"]
