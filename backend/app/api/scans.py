from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from app.api.social import run_social_scan
from app.api.apps import run_app_scan

router = APIRouter(prefix="/api/scans", tags=["Scan Engine & History"])


@router.get("", response_model=List[schemas.ScanHistoryResponse])
def get_scan_history(brand_id: Optional[int] = None, db: Session = Depends(get_db)):
    """Retrieve full history of past detection scans with metrics and excluded assets."""
    query = db.query(models.ScanHistory)
    if brand_id:
        query = query.filter(models.ScanHistory.brand_id == brand_id)
    return query.order_by(models.ScanHistory.started_at.desc()).all()


@router.post("/run")
def trigger_scan(payload: schemas.ScanTriggerRequest, db: Session = Depends(get_db)):
    """Trigger a new scan workflow for social profiles, apps, or full enterprise scope."""
    brand = db.query(models.BrandProfile).filter(models.BrandProfile.id == payload.brand_id).first()
    if not brand:
        raise HTTPException(status_code=404, detail="Brand profile not found.")

    results = {}
    if payload.scan_type in ["social", "full"]:
        results["social_scan"] = run_social_scan(brand_id=payload.brand_id, db=db)
    if payload.scan_type in ["app", "full"]:
        results["app_scan"] = run_app_scan(brand_id=payload.brand_id, db=db)

    return {
        "message": f"Successfully completed {payload.scan_type} scan for {brand.name}.",
        "results": results,
    }
