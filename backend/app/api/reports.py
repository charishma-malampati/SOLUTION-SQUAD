import csv
import io
from typing import Optional
from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session
from app.database import get_db
from app import models

router = APIRouter(prefix="/api/reports", tags=["Reports & Exports"])


@router.get("/findings.csv")
def export_findings_csv(
    brand_id: Optional[int] = None,
    risk_category: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """
    Exports filtered threat findings as a downloaded CSV file.
    """
    query = db.query(models.Finding)
    if brand_id:
        query = query.filter(models.Finding.brand_id == brand_id)
    if risk_category:
        query = query.filter(models.Finding.risk_category == risk_category)

    findings = query.order_by(models.Finding.risk_score.desc()).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Finding ID",
        "Brand Name",
        "Asset Type",
        "Asset Name",
        "Platform / Store",
        "Source URL",
        "Risk Score",
        "Risk Category",
        "Detection Reasons",
        "Recommended Action",
        "Review Status",
        "Reviewer Notes",
        "Detected At",
    ])

    for f in findings:
        brand_name = f.brand.name if f.brand else "Unknown"
        reasons_str = " | ".join(f.detection_reasons)
        writer.writerow([
            f.id,
            brand_name,
            f.asset_type,
            f.asset_name,
            f.platform_or_store,
            f.source_url or "",
            f.risk_score,
            f.risk_category,
            reasons_str,
            f.recommended_action or "",
            f.review_status,
            f.reviewer_notes or "",
            f.created_at.strftime("%Y-%m-%d %H:%M:%S"),
        ])

    csv_data = output.getvalue()
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=brandshield_threat_findings.csv"},
    )


@router.get("/scans.csv")
def export_scans_csv(
    brand_id: Optional[int] = None,
    db: Session = Depends(get_db),
):
    """
    Exports scan history log as a downloaded CSV file.
    """
    query = db.query(models.ScanHistory)
    if brand_id:
        query = query.filter(models.ScanHistory.brand_id == brand_id)

    scans = query.order_by(models.ScanHistory.started_at.desc()).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Scan ID",
        "Brand Name",
        "Scan Type",
        "Started At",
        "Completed At",
        "Status",
        "Records Processed",
        "Alerts Generated",
        "Excluded Assets",
        "Notes",
    ])

    for s in scans:
        brand_name = s.brand.name if s.brand else "Unknown"
        writer.writerow([
            s.id,
            brand_name,
            s.scan_type,
            s.started_at.strftime("%Y-%m-%d %H:%M:%S"),
            s.completed_at.strftime("%Y-%m-%d %H:%M:%S") if s.completed_at else "",
            s.status,
            s.records_processed,
            s.alerts_generated,
            s.excluded_assets_count,
            s.notes or "",
        ])

    csv_data = output.getvalue()
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=brandshield_scan_history.csv"},
    )


@router.get("/summary")
def get_report_summary(brand_id: Optional[int] = None, db: Session = Depends(get_db)):
    """
    Provides comprehensive structured executive summary for printable threat report.
    """
    brand = None
    if brand_id:
        brand = db.query(models.BrandProfile).filter(models.BrandProfile.id == brand_id).first()
    else:
        brand = db.query(models.BrandProfile).first()

    if not brand:
        return {"error": "No brand profiles available to summarize."}

    findings = db.query(models.Finding).filter(models.Finding.brand_id == brand.id).all()
    excluded_audits = (
        db.query(models.AuditLog)
        .filter(
            models.AuditLog.brand_id == brand.id,
            models.AuditLog.event_type.in_(["OFFICIAL_ASSET_EXCLUDED", "OFFICIAL_APP_EXCLUDED"]),
        )
        .all()
    )

    return {
        "brand_name": brand.name,
        "industry": brand.industry,
        "official_website": brand.website,
        "total_findings": len(findings),
        "critical_count": sum(1 for f in findings if f.risk_category == "Critical"),
        "high_count": sum(1 for f in findings if f.risk_category == "High"),
        "medium_count": sum(1 for f in findings if f.risk_category == "Medium"),
        "low_count": sum(1 for f in findings if f.risk_category == "Low"),
        "official_social_assets": [
            {"platform": a.platform, "handle": a.handle, "verified": a.verified_badge}
            for a in brand.official_social_assets
        ],
        "official_applications": [
            {"app_name": a.app_name, "package_id": a.package_id, "store": a.store, "publisher": a.publisher_name}
            for a in brand.official_applications
        ],
        "excluded_assets_audit": [
            {"event": a.event_type, "details": a.details, "timestamp": a.timestamp.strftime("%Y-%m-%d %H:%M:%S")}
            for a in excluded_audits
        ],
        "findings_list": [
            {
                "id": f.id,
                "asset_type": f.asset_type,
                "asset_name": f.asset_name,
                "platform_or_store": f.platform_or_store,
                "risk_score": f.risk_score,
                "risk_category": f.risk_category,
                "reasons": f.detection_reasons,
                "recommended_action": f.recommended_action,
                "review_status": f.review_status,
            }
            for f in findings
        ],
    }
