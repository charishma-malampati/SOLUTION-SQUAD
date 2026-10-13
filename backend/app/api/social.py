import csv
import io
import json
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from app.detection.engine import analyze_social_profile

router = APIRouter(prefix="/api/social", tags=["Social Media Monitoring"])


@router.get("", response_model=List[schemas.SocialProfileRecordResponse])
def get_social_records(brand_id: Optional[int] = None, db: Session = Depends(get_db)):
    """List monitored social profile candidate records."""
    query = db.query(models.SocialProfileRecord)
    if brand_id:
        query = query.filter(models.SocialProfileRecord.brand_id == brand_id)
    return query.order_by(models.SocialProfileRecord.created_at.desc()).all()


@router.post("", response_model=schemas.SocialProfileRecordResponse, status_code=status.HTTP_201_CREATED)
def add_social_record(
    brand_id: int,
    payload: schemas.SocialProfileRecordCreate,
    db: Session = Depends(get_db),
):
    """Add a single social media candidate profile manually."""
    brand = db.query(models.BrandProfile).filter(models.BrandProfile.id == brand_id).first()
    if not brand:
        raise HTTPException(status_code=404, detail="Brand profile not found.")

    record = models.SocialProfileRecord(
        brand_id=brand_id,
        platform=payload.platform.strip(),
        username=payload.username.strip(),
        display_name=payload.display_name.strip() if payload.display_name else "",
        profile_url=payload.profile_url.strip() if payload.profile_url else "",
        bio=payload.bio.strip() if payload.bio else "",
        follower_count=payload.follower_count or 0,
        account_created_at=payload.account_created_at,
        data_source=payload.data_source or "manual_entry",
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.post("/upload-csv", status_code=status.HTTP_201_CREATED)
async def upload_social_csv(
    brand_id: int = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """
    Upload and parse CSV containing candidate social profile records.
    Required columns: platform, username.
    Optional columns: display_name, profile_url, bio, follower_count, account_created_at.
    """
    brand = db.query(models.BrandProfile).filter(models.BrandProfile.id == brand_id).first()
    if not brand:
        raise HTTPException(status_code=404, detail="Brand profile not found.")

    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file format. Please upload a .csv file."
        )

    content = await file.read()
    try:
        decoded = content.decode("utf-8-sig")
    except UnicodeDecodeError:
        try:
            decoded = content.decode("latin-1")
        except Exception:
            raise HTTPException(status_code=400, detail="Unable to decode CSV file encoding.")

    reader = csv.DictReader(io.StringIO(decoded))
    if not reader.fieldnames:
        raise HTTPException(status_code=400, detail="CSV file appears to be empty or malformed.")

    # Validate header fields
    headers = [h.strip().lower() for h in reader.fieldnames if h]
    if "platform" not in headers or "username" not in headers:
        raise HTTPException(
            status_code=400,
            detail=f"CSV is missing required columns 'platform' or 'username'. Found columns: {reader.fieldnames}"
        )

    imported_count = 0
    errors = []

    for row_idx, row in enumerate(reader, start=2):
        clean_row = {k.strip().lower(): (v.strip() if v else "") for k, v in row.items() if k}
        platform = clean_row.get("platform")
        username = clean_row.get("username")

        if not platform or not username:
            errors.append(f"Row {row_idx}: Missing platform or username.")
            continue

        try:
            followers = int(clean_row.get("follower_count") or 0)
        except ValueError:
            followers = 0

        # Avoid duplicates for same brand, platform, and username
        existing = db.query(models.SocialProfileRecord).filter(
            models.SocialProfileRecord.brand_id == brand_id,
            models.SocialProfileRecord.platform.ilike(platform),
            models.SocialProfileRecord.username.ilike(username),
        ).first()

        if existing:
            # Update fields
            existing.display_name = clean_row.get("display_name") or existing.display_name
            existing.profile_url = clean_row.get("profile_url") or existing.profile_url
            existing.bio = clean_row.get("bio") or existing.bio
            existing.follower_count = followers
        else:
            record = models.SocialProfileRecord(
                brand_id=brand_id,
                platform=platform,
                username=username,
                display_name=clean_row.get("display_name", ""),
                profile_url=clean_row.get("profile_url", ""),
                bio=clean_row.get("bio", ""),
                follower_count=followers,
                account_created_at=clean_row.get("account_created_at", ""),
                data_source="csv_upload",
            )
            db.add(record)
            imported_count += 1

    db.commit()

    return {
        "message": f"Successfully processed CSV. Imported/updated {imported_count} records.",
        "imported_count": imported_count,
        "row_errors": errors,
    }


@router.post("/scan")
def run_social_scan(brand_id: int, db: Session = Depends(get_db)):
    """
    Executes social monitoring scan for the brand.
    1. Fetches candidate records and official assets.
    2. Runs deterministic similarity and threat algorithms.
    3. Excludes confirmed official accounts and logs audit trail.
    4. Records findings and updates ScanHistory.
    """
    brand = db.query(models.BrandProfile).filter(models.BrandProfile.id == brand_id).first()
    if not brand:
        raise HTTPException(status_code=404, detail="Brand profile not found.")

    start_time = datetime.utcnow()
    records = db.query(models.SocialProfileRecord).filter(models.SocialProfileRecord.brand_id == brand_id).all()
    official_assets = brand.official_social_assets

    brand_aliases = [a.strip() for a in (brand.aliases or "").split(",") if a.strip()]
    brand_keywords = [k.strip() for k in (brand.keywords or "").split(",") if k.strip()]

    alerts_generated = 0
    excluded_count = 0

    # Create scan history entry
    scan_log = models.ScanHistory(
        brand_id=brand_id,
        scan_type="social",
        started_at=start_time,
        status="in_progress",
        records_processed=len(records),
    )
    db.add(scan_log)
    db.commit()

    for record in records:
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
            official_assets=official_assets,
        )

        if result["is_excluded"]:
            excluded_count += 1
            # Log exclusion audit
            audit = models.AuditLog(
                brand_id=brand_id,
                event_type="OFFICIAL_ASSET_EXCLUDED",
                details=f"Social handle @{record.username} on {record.platform} excluded: {result['exclusion_reason']}"
            )
            db.add(audit)
            continue

        # If not excluded and risk score > 0, create or update finding
        if result["risk_score"] > 0:
            existing_finding = db.query(models.Finding).filter(
                models.Finding.brand_id == brand_id,
                models.Finding.asset_type == "social",
                models.Finding.asset_name == record.username,
                models.Finding.platform_or_store == record.platform,
            ).first()

            evidence_dict = dict(result.get("evidence_snippets", {}))
            evidence_dict["data_source"] = getattr(record, "data_source", "synthetic_demo")

            if existing_finding:
                existing_finding.risk_score = result["risk_score"]
                existing_finding.risk_category = result["risk_category"]
                existing_finding.detection_reasons_json = json.dumps(result["detection_reasons"])
                existing_finding.evidence_snippets_json = json.dumps(evidence_dict)
                existing_finding.similarity_details_json = json.dumps(result["similarity_details"])
                existing_finding.recommended_action = result["recommended_action"]
                existing_finding.source_url = record.profile_url
                existing_finding.updated_at = datetime.utcnow()
            else:
                finding = models.Finding(
                    brand_id=brand_id,
                    asset_type="social",
                    record_id=record.id,
                    asset_name=record.username,
                    platform_or_store=record.platform,
                    source_url=record.profile_url,
                    risk_score=result["risk_score"],
                    risk_category=result["risk_category"],
                    detection_reasons_json=json.dumps(result["detection_reasons"]),
                    evidence_snippets_json=json.dumps(evidence_dict),
                    similarity_details_json=json.dumps(result["similarity_details"]),
                    matched_official_asset_json=json.dumps({}),
                    recommended_action=result["recommended_action"],
                    review_status="unreviewed",
                )
                db.add(finding)
                alerts_generated += 1

    scan_log.status = "completed"
    scan_log.completed_at = datetime.utcnow()
    scan_log.alerts_generated = alerts_generated
    scan_log.excluded_assets_count = excluded_count
    scan_log.notes = f"Processed {len(records)} social profile candidates. Excluded {excluded_count} verified official handles."

    db.commit()

    return {
        "scan_id": scan_log.id,
        "brand_name": brand.name,
        "records_processed": len(records),
        "alerts_generated": alerts_generated,
        "excluded_assets_count": excluded_count,
        "status": "completed",
    }
