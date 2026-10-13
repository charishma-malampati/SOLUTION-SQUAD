from typing import Dict, Any, List, Optional
from app.detection.normalizer import normalize_text, strip_separators, tokenize
from app.detection.similarity import (
    levenshtein_distance,
    similarity_ratio,
    jaccard_similarity,
    token_containment_ratio,
)
from app.detection.homoglyph import (
    detect_character_substitutions,
    detect_transposition,
    dehomoglyph,
)
from app.detection.keywords import (
    detect_added_modifiers,
    analyze_description_scam_signals,
    check_brand_keyword_presence,
)
from app.detection.exclusion import (
    check_social_official_exclusion,
    check_app_official_exclusion,
)


def classify_risk_category(score: float) -> str:
    """Categorizes risk score into standard cybersecurity severity tiers."""
    if score >= 80.0:
        return "Critical"
    elif score >= 60.0:
        return "High"
    elif score >= 30.0:
        return "Medium"
    else:
        return "Low"


def get_recommended_action(
    risk_category: str,
    asset_type: str,
    detection_reasons: List[str],
    conflict_detected: bool = False,
) -> str:
    """Generates human-in-the-loop operational security recommendations."""
    if conflict_detected:
        return "URGENT TRIAGE: Identity conflict detected. Verify store listing and package signing keys with developer team."

    if risk_category == "Critical":
        if asset_type == "social":
            return "IMMEDIATE ESCALATION: Submit takedown request to platform trust & safety; issue customer warning."
        else:
            return "IMMEDIATE TAKEDOWN: Submit trademark & copyright infringement notice to app store developer abuse team."

    elif risk_category == "High":
        if asset_type == "social":
            return "ACTIVE THREAT: Monitor profile activity for phishing campaigns; prepare takedown evidence package."
        else:
            return "HIGH RISK: Request APK inspection; monitor package distribution outside official stores."

    elif risk_category == "Medium":
        return "WATCHLIST: Add to automated daily scan watchlist; investigate user engagement metrics."

    else:
        return "INFORMATIONAL: Benign similarity detected; no defensive action required at this time."


def analyze_social_profile(
    candidate: Dict[str, Any],
    brand_name: str,
    brand_aliases: List[str],
    brand_keywords: List[str],
    official_assets: List[Any],
) -> Dict[str, Any]:
    """
    Evaluates a candidate social profile using deterministic multi-factor threat detection.
    """
    platform = candidate.get("platform", "Social")
    username = candidate.get("username", "")
    display_name = candidate.get("display_name", "")
    profile_url = candidate.get("profile_url", "")
    bio = candidate.get("bio", "")

    # 1. Official Asset Exclusion Check
    exclusion = check_social_official_exclusion(
        candidate_platform=platform,
        candidate_username=username,
        candidate_url=profile_url,
        official_assets=official_assets,
    )

    if exclusion["is_excluded"]:
        return {
            "is_excluded": True,
            "exclusion_reason": exclusion["exclusion_reason"],
            "risk_score": 0.0,
            "risk_category": "Low",
            "detection_reasons": ["Confirmed official brand account (Excluded from threats)"],
            "evidence_snippets": {
                "matched_asset": exclusion.get("matched_handle") or exclusion.get("matched_url"),
                "audit_note": "Record exactly matches verified registered corporate handle.",
            },
            "similarity_details": {"brand_match_ratio": 1.0, "edit_distance": 0},
            "recommended_action": "VERIFIED ASSET: Retained in official asset registry.",
            "conflict_detected": False,
        }

    # Target brand names to match against
    targets = [brand_name] + [a for a in brand_aliases if a]

    best_name_score = 0.0
    best_sim_details: Dict[str, Any] = {}
    matched_target = brand_name
    reasons: List[str] = []
    evidence: Dict[str, Any] = {"score_breakdown": {}}

    norm_username = strip_separators(username)
    norm_display = strip_separators(display_name)
    dehomo_username = dehomoglyph(norm_username)

    # 2. Name & Handle Similarity Evaluation
    for target in targets:
        norm_target = strip_separators(target)
        if not norm_target:
            continue

        # Check exact brand handle squatting by unverified account
        if norm_username == norm_target or norm_display == norm_target:
            score = 30.0
            reasons.append(f"Exact brand name match ('{target}') on unverified account")
            evidence["score_breakdown"]["exact_name_match"] = 30.0
            best_name_score = max(best_name_score, score)
            matched_target = target
            best_sim_details = {
                "original_name": username,
                "normalized_name": norm_username,
                "target_matched": target,
                "similarity_ratio": 1.0,
                "edit_distance": 0,
            }
            break

        # Levenshtein similarity on username
        ratio = similarity_ratio(norm_username, norm_target)
        dist = levenshtein_distance(norm_username, norm_target)

        # Check Levenshtein ratio on dehomoglyph form
        dehomo_ratio = similarity_ratio(dehomo_username, norm_target)

        chosen_ratio = max(ratio, dehomo_ratio)
        calc_name_score = chosen_ratio * 30.0

        # If brand name is fully embedded as a substring in the candidate username or dehomoglyphed username
        if norm_target in norm_username or norm_target in dehomo_username:
            calc_name_score = max(calc_name_score, 25.0)
            chosen_ratio = max(chosen_ratio, 0.85)

        if calc_name_score > best_name_score:
            best_name_score = calc_name_score
            matched_target = target
            best_sim_details = {
                "original_name": username,
                "normalized_name": norm_username,
                "target_matched": target,
                "similarity_ratio": chosen_ratio,
                "edit_distance": dist,
            }

    # Record name similarity points
    name_score_rounded = round(best_name_score, 1)
    evidence["score_breakdown"]["name_similarity"] = name_score_rounded
    if name_score_rounded >= 18.0 and not any("Exact" in r for r in reasons):
        reasons.append(f"High name resemblance to brand '{matched_target}' ({best_sim_details.get('similarity_ratio', 0) * 100:.0f}%)")

    # 3. Homoglyph, Character Substitution & Transposition Analysis
    norm_target_clean = strip_separators(matched_target)
    substitutions = detect_character_substitutions(norm_username, norm_target_clean)
    transposition = detect_transposition(norm_username, norm_target_clean)

    homoglyph_score = 0.0
    if substitutions:
        # Detected deliberate character substitutions like 0 for O, 1 for I, @ for a
        known_homos = [s for s in substitutions if s["type"] == "known_homoglyph_substitution"]
        if known_homos:
            homoglyph_score += 20.0
            sub_strs = [f"'{s['candidate_char']}' for '{s['target_char']}'" for s in known_homos]
            reasons.append(f"Deceptive character substitution (leetspeak/homoglyph): {', '.join(sub_strs)}")
            evidence["detected_homoglyphs"] = known_homos
        else:
            homoglyph_score += 10.0
            reasons.append("Single character variation from official brand name")

    # If dehomoglyph reveals the brand name inside the handle when it wasn't there before
    if norm_target_clean in dehomo_username and norm_target_clean not in norm_username and homoglyph_score == 0:
        homoglyph_score += 20.0
        reasons.append("Deceptive character substitution (leetspeak/homoglyph numbers or symbols)")
        evidence["detected_homoglyphs"] = [{"type": "embedded_homoglyph_substitution", "dehomoglyphed": dehomo_username}]

    if transposition:
        homoglyph_score = max(homoglyph_score, 18.0)
        reasons.append(transposition["message"])
        evidence["transposition"] = transposition

    evidence["score_breakdown"]["homoglyph_transposition"] = homoglyph_score

    # 4. Suspicious Added Modifier Keywords (Official, Support, Care, Hotline)
    added_modifiers = detect_added_modifiers(f"{username} {display_name}", matched_target)
    modifier_score = 0.0
    if added_modifiers:
        # Give 15 points for first high-risk modifier, up to 20 for multiple
        modifier_score = min(15.0 + (len(added_modifiers) - 1) * 5.0, 20.0)
        reasons.append(f"Impersonation keyword(s) detected: {', '.join(added_modifiers)}")
        evidence["added_modifiers"] = added_modifiers

    evidence["score_breakdown"]["added_modifiers"] = modifier_score

    # 5. Bio Description & Phishing / Scam Language Analysis
    scam_analysis = analyze_description_scam_signals(bio)
    description_score = 0.0

    # Check if brand is referenced in bio
    brand_in_bio = check_brand_keyword_presence(bio, brand_name, brand_keywords)
    if brand_in_bio:
        description_score += 8.0
        reasons.append(f"Profile bio references protected brand '{brand_name}'")

    if scam_analysis["detected_signals"]:
        scam_pts = min(scam_analysis["total_scam_score"], 20.0)
        description_score += scam_pts
        reasons.append(f"Suspicious bio language: {', '.join(scam_analysis['detected_signals'])}")
        evidence["scam_indicators"] = scam_analysis["matched_patterns"]

    evidence["score_breakdown"]["bio_scam_analysis"] = description_score

    # 6. Aggregate Total Risk Score
    total_score = name_score_rounded + homoglyph_score + modifier_score + description_score
    # Avoid excessive false positives: if name similarity is very low and no scam signals, cap at low
    if best_sim_details.get("similarity_ratio", 0) < 0.4 and not added_modifiers and not scam_analysis["detected_signals"]:
        total_score = min(total_score, 15.0)

    total_score = max(0.0, min(100.0, round(total_score, 1)))
    risk_category = classify_risk_category(total_score)
    rec_action = get_recommended_action(risk_category, "social", reasons)

    if not reasons:
        reasons.append("No active impersonation vectors or high-risk signals detected")

    return {
        "is_excluded": False,
        "exclusion_reason": None,
        "risk_score": total_score,
        "risk_category": risk_category,
        "detection_reasons": reasons,
        "evidence_snippets": evidence,
        "similarity_details": best_sim_details,
        "recommended_action": rec_action,
        "conflict_detected": False,
    }


def analyze_app_listing(
    candidate: Dict[str, Any],
    brand_name: str,
    brand_aliases: List[str],
    brand_keywords: List[str],
    official_apps: List[Any],
) -> Dict[str, Any]:
    """
    Evaluates a candidate mobile application listing against brand profile and official apps.
    """
    app_name = candidate.get("app_name", "")
    package_id = candidate.get("package_id", "")
    developer = candidate.get("developer_name", "")
    store = candidate.get("store_name", "App Store")
    store_url = candidate.get("store_url", "")
    description = candidate.get("description", "")

    # 1. Check Official App Exclusion & Conflict
    exclusion = check_app_official_exclusion(
        candidate_app_name=app_name,
        candidate_package_id=package_id,
        candidate_developer=developer,
        candidate_store=store,
        candidate_url=store_url,
        official_apps=official_apps,
    )

    if exclusion["is_excluded"]:
        return {
            "is_excluded": True,
            "exclusion_reason": exclusion["exclusion_reason"],
            "risk_score": 0.0,
            "risk_category": "Low",
            "detection_reasons": ["Confirmed official corporate application (Excluded from threats)"],
            "evidence_snippets": {
                "matched_app_id": exclusion.get("matched_app_id"),
                "audit_note": "Package ID and publisher match verified corporate registry.",
            },
            "similarity_details": {"app_name": app_name, "package_id": package_id},
            "recommended_action": "VERIFIED ASSET: Verified official app store deployment.",
            "conflict_detected": False,
        }

    reasons: List[str] = []
    evidence: Dict[str, Any] = {"score_breakdown": {}}
    conflict = exclusion.get("conflict_detected", False)

    # 2. Handle Identity Conflict (e.g. Package ID matches official app but publisher is mismatched!)
    conflict_score = 0.0
    if conflict:
        conflict_score = 50.0
        reasons.append(exclusion.get("conflict_reason", "Official Package ID claimed by unauthorized publisher!"))
        evidence["score_breakdown"]["package_id_conflict"] = conflict_score

    # 3. App Name Similarity to Brand
    norm_app_name = strip_separators(app_name)
    targets = [brand_name] + [a for a in brand_aliases if a]
    best_name_score = 0.0
    matched_target = brand_name
    best_sim_details: Dict[str, Any] = {}

    for target in targets:
        norm_target = strip_separators(target)
        if not norm_target:
            continue

        ratio = similarity_ratio(norm_app_name, norm_target)
        # Token overlap check (e.g. "NovaPay Quick Loan" contains "NovaPay")
        cand_tokens = tokenize(app_name)
        target_tokens = tokenize(target)
        overlap = token_containment_ratio(target_tokens, cand_tokens)

        chosen_ratio = max(ratio, overlap)
        cand_score = chosen_ratio * 30.0

        if cand_score > best_name_score:
            best_name_score = cand_score
            matched_target = target
            best_sim_details = {
                "app_name": app_name,
                "normalized_name": norm_app_name,
                "target_matched": target,
                "similarity_ratio": chosen_ratio,
                "edit_distance": levenshtein_distance(norm_app_name, norm_target),
            }

    name_score_rounded = round(best_name_score, 1)
    evidence["score_breakdown"]["name_similarity"] = name_score_rounded
    if name_score_rounded >= 18.0:
        reasons.append(f"Application name leverages protected brand '{matched_target}' ({best_sim_details.get('similarity_ratio', 0) * 100:.0f}%)")

    # 4. Added App Modifiers (e.g. 'Quick Loan', 'Fast Cash', 'Wallet Pro', 'Direct')
    added_modifiers = detect_added_modifiers(app_name, matched_target)
    modifier_score = 0.0
    if added_modifiers:
        modifier_score = min(len(added_modifiers) * 10.0, 20.0)
        reasons.append(f"Suspicious financial / utility modifiers: {', '.join(added_modifiers)}")
        evidence["added_modifiers"] = added_modifiers

    evidence["score_breakdown"]["added_modifiers"] = modifier_score

    # 5. Publisher Mismatch & Package Spoofing
    publisher_score = 0.0
    # Check if publisher name is different from official publishers
    official_publishers = [
        normalize_text(getattr(a, "publisher_name", "") or a.get("publisher_name", ""))
        for a in official_apps
        if getattr(a, "publisher_name", None) or a.get("publisher_name")
    ]
    norm_dev = normalize_text(developer)
    if official_publishers and norm_dev not in official_publishers and best_name_score > 15.0:
        publisher_score = 15.0
        reasons.append(f"Unrecognized developer '{developer}' distributing brand-titled app")
        evidence["publisher_mismatch"] = {"candidate_developer": developer, "official_publishers": official_publishers}

    # Check look-alike package ID (e.g. com.novapay.loan.fast)
    norm_pkg = normalize_text(package_id)
    if normalize_text(brand_name) in norm_pkg and not conflict:
        # Look-alike package ID
        publisher_score += 10.0
        reasons.append(f"Look-alike application package ID: '{package_id}'")

    evidence["score_breakdown"]["publisher_and_package_spoofing"] = publisher_score

    # 6. Description Scam & Predatory Language Analysis
    scam_analysis = analyze_description_scam_signals(description)
    desc_score = 0.0
    if scam_analysis["detected_signals"]:
        desc_score = min(scam_analysis["total_scam_score"], 20.0)
        reasons.append(f"High-risk app description keywords: {', '.join(scam_analysis['detected_signals'])}")
        evidence["scam_indicators"] = scam_analysis["matched_patterns"]

    evidence["score_breakdown"]["description_analysis"] = desc_score

    # 7. Aggregate Total Score
    total_score = conflict_score + name_score_rounded + modifier_score + publisher_score + desc_score

    # Avoid false positives: unrelated applications
    if best_sim_details.get("similarity_ratio", 0) < 0.35 and not conflict and not scam_analysis["detected_signals"]:
        total_score = min(total_score, 10.0)

    total_score = max(0.0, min(100.0, round(total_score, 1)))
    risk_category = classify_risk_category(total_score)
    rec_action = get_recommended_action(risk_category, "app", reasons, conflict_detected=conflict)

    if not reasons:
        reasons.append("Legitimate non-infringing third-party application")

    return {
        "is_excluded": False,
        "exclusion_reason": None,
        "risk_score": total_score,
        "risk_category": risk_category,
        "detection_reasons": reasons,
        "evidence_snippets": evidence,
        "similarity_details": best_sim_details,
        "recommended_action": rec_action,
        "conflict_detected": conflict,
    }
