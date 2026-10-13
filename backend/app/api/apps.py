import csv
import io
import json
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from app.detection.engine import analyze_app_listing

router = APIRouter(prefix="/api/apps", tags=["App Store Monitoring"])


@router.get("", response_model=List[schemas.AppListingRecordResponse])
def get_app_records(brand_id: Optional[int] = None, db: Session = Depends(get_db)):
    """List monitored mobile application listing records."""
    query = db.query(models.AppListingRecord)
    if brand_id:
        query = query.filter(models.AppListingRecord.brand_id == brand_id)
    return query.order_by(models.AppListingRecord.created_at.desc()).all()


@router.post("", response_model=schemas.AppListingRecordResponse, status_code=status.HTTP_201_CREATED)
def add_app_record(
    brand_id: int,
    payload: schemas.AppListingRecordCreate,
    db: Session = Depends(get_db),
):
    """Add a single mobile application listing manually."""
    brand = db.query(models.BrandProfile).filter(models.BrandProfile.id == brand_id).first()
    if not brand:
        raise HTTPException(status_code=404, detail="Brand profile not found.")

    record = models.AppListingRecord(
        brand_id=brand_id,
        app_name=payload.app_name.strip(),
        package_id=payload.package_id.strip(),
        developer_name=payload.developer_name.strip(),
        store_name=payload.store_name.strip(),
        store_url=payload.store_url.strip() if payload.store_url else "",
        description=payload.description.strip() if payload.description else "",
        icon_url=payload.icon_url.strip() if payload.icon_url else "",
        permissions=payload.permissions,
        data_source=payload.data_source or "manual_entry",
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.post("/upload-csv", status_code=status.HTTP_201_CREATED)
async def upload_app_csv(
    brand_id: int = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """
    Upload and parse CSV containing candidate mobile application listings.
    Required columns: app_name, package_id, developer_name, store_name.
    Optional columns: store_url, description, icon_url, permissions.
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

    headers = [h.strip().lower() for h in reader.fieldnames if h]
    required_cols = ["app_name", "package_id", "developer_name", "store_name"]
    missing = [col for col in required_cols if col not in headers]
    if missing:
        raise HTTPException(
            status_code=400,
            detail=f"CSV is missing required columns: {missing}. Found columns: {reader.fieldnames}"
        )

    imported_count = 0
    errors = []

    for row_idx, row in enumerate(reader, start=2):
        clean_row = {k.strip().lower(): (v.strip() if v else "") for k, v in row.items() if k}
        app_name = clean_row.get("app_name")
        package_id = clean_row.get("package_id")
        developer_name = clean_row.get("developer_name")
        store_name = clean_row.get("store_name")

        if not app_name or not package_id or not developer_name:
            errors.append(f"Row {row_idx}: Missing required fields.")
            continue

        existing = db.query(models.AppListingRecord).filter(
            models.AppListingRecord.brand_id == brand_id,
            models.AppListingRecord.package_id == package_id,
            models.AppListingRecord.store_name == store_name,
        ).first()

        if existing:
            existing.app_name = app_name
            existing.developer_name = developer_name
            existing.store_url = clean_row.get("store_url") or existing.store_url
            existing.description = clean_row.get("description") or existing.description
            existing.icon_url = clean_row.get("icon_url") or existing.icon_url
            existing.permissions = clean_row.get("permissions") or existing.permissions
        else:
            record = models.AppListingRecord(
                brand_id=brand_id,
                app_name=app_name,
                package_id=package_id,
                developer_name=developer_name,
                store_name=store_name,
                store_url=clean_row.get("store_url", ""),
                description=clean_row.get("description", ""),
                icon_url=clean_row.get("icon_url", ""),
                permissions=clean_row.get("permissions", ""),
                data_source="csv_upload",
            )
            db.add(record)
            imported_count += 1

    db.commit()

    return {
        "message": f"Successfully processed CSV. Imported/updated {imported_count} app records.",
        "imported_count": imported_count,
        "row_errors": errors,
    }


@router.post("/scan")
def run_app_scan(brand_id: int, db: Session = Depends(get_db)):
    """
    Executes mobile app store monitoring scan for the brand.
    1. Fetches candidate app records and official registered applications.
    2. Runs deterministic similarity, package spoofing, and conflict analysis.
    3. Excludes verified official apps and flags publisher mismatches.
    4. Records findings and updates ScanHistory.
    """
    brand = db.query(models.BrandProfile).filter(models.BrandProfile.id == brand_id).first()
    if not brand:
        raise HTTPException(status_code=404, detail="Brand profile not found.")

    start_time = datetime.utcnow()
    records = db.query(models.AppListingRecord).filter(models.AppListingRecord.brand_id == brand_id).all()
    official_apps = brand.official_applications

    brand_aliases = [a.strip() for a in (brand.aliases or "").split(",") if a.strip()]
    brand_keywords = [k.strip() for k in (brand.keywords or "").split(",") if k.strip()]

    alerts_generated = 0
    excluded_count = 0

    scan_log = models.ScanHistory(
        brand_id=brand_id,
        scan_type="app",
        started_at=start_time,
        status="in_progress",
        records_processed=len(records),
    )
    db.add(scan_log)
    db.commit()

    for record in records:
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
            official_apps=official_apps,
        )

        if result["is_excluded"]:
            excluded_count += 1
            audit = models.AuditLog(
                brand_id=brand_id,
                event_type="OFFICIAL_APP_EXCLUDED",
                details=f"Application '{record.app_name}' ({record.package_id}) excluded: {result['exclusion_reason']}"
            )
            db.add(audit)
            continue

        if result.get("conflict_detected"):
            audit = models.AuditLog(
                brand_id=brand_id,
                event_type="IDENTITY_CONFLICT_DETECTED",
                details=f"CONFLICT: {record.app_name} claims official package {record.package_id} by unrecognized publisher {record.developer_name}"
            )
            db.add(audit)

        if result["risk_score"] > 0:
            existing_finding = db.query(models.Finding).filter(
                models.Finding.brand_id == brand_id,
                models.Finding.asset_type == "app",
                models.Finding.asset_name == record.app_name,
                models.Finding.platform_or_store == record.store_name,
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
                existing_finding.source_url = record.store_url
                existing_finding.updated_at = datetime.utcnow()
            else:
                finding = models.Finding(
                    brand_id=brand_id,
                    asset_type="app",
                    record_id=record.id,
                    asset_name=record.app_name,
                    platform_or_store=record.store_name,
                    source_url=record.store_url,
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
    scan_log.notes = f"Processed {len(records)} mobile application records. Excluded {excluded_count} verified official apps."

    db.commit()

    return {
        "scan_id": scan_log.id,
        "brand_name": brand.name,
        "records_processed": len(records),
        "alerts_generated": alerts_generated,
        "excluded_assets_count": excluded_count,
        "status": "completed",
    }
