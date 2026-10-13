from typing import Dict, Any, List, Optional
from urllib.parse import urlparse
from app.detection.normalizer import strip_separators, normalize_text


def normalize_handle(handle: str) -> str:
    """Strips leading '@' and separators for uniform handle matching."""
    if not handle:
        return ""
    clean = handle.strip().lstrip("@")
    return strip_separators(clean)


def normalize_url(url: str) -> str:
    """Normalizes URL for matching: strips trailing slashes, protocol, and www."""
    if not url:
        return ""
    clean = url.strip().lower()
    clean = clean.replace("https://", "").replace("http://", "").replace("www.", "")
    return clean.rstrip("/")


def check_social_official_exclusion(
    candidate_platform: str,
    candidate_username: str,
    candidate_url: Optional[str],
    official_assets: List[Any],  # List of OfficialSocialAsset OR dicts
) -> Dict[str, Any]:
    """
    Checks if a social media candidate matches any registered official social asset.
    Returns exclusion details and audit reason.
    """
    norm_cand_username = normalize_handle(candidate_username)
    norm_cand_url = normalize_url(candidate_url) if candidate_url else ""
    cand_platform = normalize_text(candidate_platform)

    for asset in official_assets:
        # Support both SQLAlchemy model and dict
        asset_platform = normalize_text(getattr(asset, "platform", "") or asset.get("platform", ""))
        asset_handle = normalize_handle(getattr(asset, "handle", "") or asset.get("handle", ""))
        asset_url = normalize_url(getattr(asset, "url", "") or asset.get("url", ""))

        # Platform check (allow loose match if not specified)
        platform_matches = not asset_platform or asset_platform == cand_platform

        if platform_matches:
            # 1. Handle match
            if asset_handle and norm_cand_username == asset_handle:
                return {
                    "is_excluded": True,
                    "exclusion_reason": f"Matches registered official handle '@{getattr(asset, 'handle', None) or asset.get('handle')}' on {asset_platform.title()}",
                    "matched_asset_id": getattr(asset, "id", None) or asset.get("id"),
                    "matched_handle": getattr(asset, "handle", None) or asset.get("handle"),
                    "conflict_detected": False,
                }

            # 2. Exact URL match
            if asset_url and norm_cand_url and asset_url == norm_cand_url:
                return {
                    "is_excluded": True,
                    "exclusion_reason": f"Matches registered official profile URL '{getattr(asset, 'url', None) or asset.get('url')}'",
                    "matched_asset_id": getattr(asset, "id", None) or asset.get("id"),
                    "matched_url": getattr(asset, "url", None) or asset.get("url"),
                    "conflict_detected": False,
                }

    return {"is_excluded": False, "exclusion_reason": None, "conflict_detected": False}


def check_app_official_exclusion(
    candidate_app_name: str,
    candidate_package_id: str,
    candidate_developer: str,
    candidate_store: str,
    candidate_url: Optional[str],
    official_apps: List[Any],  # List of OfficialApplication OR dicts
) -> Dict[str, Any]:
    """
    Checks if a mobile application candidate matches registered official applications.
    Detects official status or identity conflicts (e.g. spoofed package ID with different publisher).
    """
    norm_cand_pkg = normalize_text(candidate_package_id).strip()
    norm_cand_dev = normalize_text(candidate_developer).strip()
    norm_cand_name = normalize_text(candidate_app_name).strip()
    norm_cand_url = normalize_url(candidate_url) if candidate_url else ""

    for app in official_apps:
        app_pkg = normalize_text(getattr(app, "package_id", "") or app.get("package_id", "")).strip()
        app_dev = normalize_text(getattr(app, "publisher_name", "") or app.get("publisher_name", "")).strip()
        app_name = normalize_text(getattr(app, "app_name", "") or app.get("app_name", "")).strip()
        app_url = normalize_url(getattr(app, "store_url", "") or app.get("store_url", ""))

        pkg_matches = bool(app_pkg and norm_cand_pkg == app_pkg)
        dev_matches = bool(app_dev and norm_cand_dev == app_dev)
        url_matches = bool(app_url and norm_cand_url and app_url == norm_cand_url)

        # Full Match: Confirmed Official App
        if pkg_matches and (dev_matches or url_matches):
            return {
                "is_excluded": True,
                "exclusion_reason": f"Confirmed official application matching package ID '{app_pkg}' and publisher '{getattr(app, 'publisher_name', '') or app.get('publisher_name', '')}'",
                "matched_app_id": getattr(app, "id", None) or app.get("id"),
                "conflict_detected": False,
            }

        # Identity Conflict Warning: Package ID is claimed by an unrecognized publisher!
        # This is a critical security signal: potential package ID squatting or unofficial APK repackaging
        if pkg_matches and not dev_matches:
            return {
                "is_excluded": False,
                "exclusion_reason": None,
                "conflict_detected": True,
                "conflict_reason": f"CRITICAL CONFLICT: Package ID '{app_pkg}' matches official asset, but publisher '{candidate_developer}' does not match registered official publisher '{getattr(app, 'publisher_name', '') or app.get('publisher_name', '')}'. Sent for urgent human review.",
                "matched_app_id": getattr(app, "id", None) or app.get("id"),
            }

        # Exact store URL match
        if url_matches:
            return {
                "is_excluded": True,
                "exclusion_reason": f"Matches registered official store URL '{getattr(app, 'store_url', '') or app.get('store_url', '')}'",
                "matched_app_id": getattr(app, "id", None) or app.get("id"),
                "conflict_detected": False,
            }

    return {"is_excluded": False, "exclusion_reason": None, "conflict_detected": False}
