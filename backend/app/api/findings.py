import json
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from app.detection.engine import analyze_social_profile, analyze_app_listing

router = APIRouter(prefix="/api/findings", tags=["Threat Intelligence & Findings"])


@router.get("", response_model=List[schemas.FindingResponse])
def get_findings(
    brand_id: Optional[int] = None,
    asset_type: Optional[str] = None,
    platform: Optional[str] = None,
    risk_category: Optional[str] = None,
    review_status: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """
    Search and filter detection findings across brands, risk tiers, and channels.
    """
    query = db.query(models.Finding)

    if brand_id:
        query = query.filter(models.Finding.brand_id == brand_id)
    if asset_type:
        query = query.filter(models.Finding.asset_type == asset_type)
    if platform:
        query = query.filter(models.Finding.platform_or_store.ilike(f"%{platform}%"))
    if risk_category:
        query = query.filter(models.Finding.risk_category == risk_category)
    if review_status:
        query = query.filter(models.Finding.review_status == review_status)
    if search:
        search_term = f"%{search.strip()}%"
        query = query.filter(
            models.Finding.asset_name.ilike(search_term)
            | models.Finding.detection_reasons_json.ilike(search_term)
            | models.Finding.platform_or_store.ilike(search_term)
        )

    return query.order_by(models.Finding.risk_score.desc(), models.Finding.created_at.desc()).all()


@router.get("/{finding_id}", response_model=schemas.FindingResponse)
def get_finding(finding_id: int, db: Session = Depends(get_db)):
    """Retrieve full details, evidence breakdown, and history for a finding."""
    finding = db.query(models.Finding).filter(models.Finding.id == finding_id).first()
    if not finding:
        raise HTTPException(status_code=404, detail="Finding not found.")
    return finding


@router.patch("/{finding_id}/review", response_model=schemas.FindingResponse)
def update_finding_review(
    finding_id: int,
    payload: schemas.FindingReviewUpdate,
    db: Session = Depends(get_db),
):
    """
    Update human reviewer triage status (unreviewed, reviewed, false_positive, escalated)
    and append notes with audit tracking.
    """
    finding = db.query(models.Finding).filter(models.Finding.id == finding_id).first()
    if not finding:
        raise HTTPException(status_code=404, detail="Finding not found.")

    valid_statuses = ["unreviewed", "reviewed", "false_positive", "escalated"]
    if payload.review_status not in valid_statuses:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid review status. Allowed: {valid_statuses}"
        )

    finding.review_status = payload.review_status
    if payload.reviewer_notes is not None:
        finding.reviewer_notes = payload.reviewer_notes
    finding.updated_at = datetime.utcnow()

    # Log reviewer feedback
    feedback = models.ReviewFeedback(
        finding_id=finding.id,
        user_action=f"status_changed_to_{payload.review_status}",
        is_false_positive=(payload.review_status == "false_positive"),
        notes=payload.reviewer_notes,
    )
    db.add(feedback)

    audit = models.AuditLog(
        brand_id=finding.brand_id,
        event_type="FINDING_REVIEWED",
        details=f"Finding #{finding.id} ({finding.asset_name}) updated to '{payload.review_status}'."
    )
    db.add(audit)

    db.commit()
    db.refresh(finding)
    return finding


@router.post("/{finding_id}/rescan", response_model=schemas.FindingResponse)
def rescan_finding(finding_id: int, db: Session = Depends(get_db)):
    """
    Re-evaluates an individual finding against current brand profile and exclusion rules.
    """
    finding = db.query(models.Finding).filter(models.Finding.id == finding_id).first()
    if not finding:
        raise HTTPException(status_code=404, detail="Finding not found.")

    brand = finding.brand
    brand_aliases = [a.strip() for a in (brand.aliases or "").split(",") if a.strip()]
    brand_keywords = [k.strip() for k in (brand.keywords or "").split(",") if k.strip()]

    if finding.asset_type == "social":
        record = db.query(models.SocialProfileRecord).filter(models.SocialProfileRecord.id == finding.record_id).first()
        if record:
            cand_dict = {
                "platform": record.platform,
                "username": record.username,
                "display_name": record.display_name,
                "profile_url": record.profile_url,
                "bio": record.bio,
            }
            result = analyze_social_profile(
                candidate=cand_dict,
                brand_name=brand.name,
                brand_aliases=brand_aliases,
                brand_keywords=brand_keywords,
                official_assets=brand.official_social_assets,
            )
            finding.risk_score = result["risk_score"]
            finding.risk_category = result["risk_category"]
            finding.detection_reasons_json = json.dumps(result["detection_reasons"])
            finding.evidence_snippets_json = json.dumps(result["evidence_snippets"])
            finding.similarity_details_json = json.dumps(result["similarity_details"])
            finding.recommended_action = result["recommended_action"]
            finding.updated_at = datetime.utcnow()
    else:
        record = db.query(models.AppListingRecord).filter(models.AppListingRecord.id == finding.record_id).first()
        if record:
            cand_dict = {
                "app_name": record.app_name,
                "package_id": record.package_id,
                "developer_name": record.developer_name,
                "store_name": record.store_name,
                "store_url": record.store_url,
                "description": record.description,
            }
            result = analyze_app_listing(
                candidate=cand_dict,
                brand_name=brand.name,
                brand_aliases=brand_aliases,
                brand_keywords=brand_keywords,
                official_apps=brand.official_applications,
            )
            finding.risk_score = result["risk_score"]
            finding.risk_category = result["risk_category"]
            finding.detection_reasons_json = json.dumps(result["detection_reasons"])
            finding.evidence_snippets_json = json.dumps(result["evidence_snippets"])
            finding.similarity_details_json = json.dumps(result["similarity_details"])
            finding.recommended_action = result["recommended_action"]
            finding.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(finding)
    return finding
