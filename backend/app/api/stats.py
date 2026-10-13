from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app import models, schemas

router = APIRouter(prefix="/api/stats", tags=["Dashboard Statistics"])


@router.get("", response_model=schemas.DashboardStatsResponse)
def get_dashboard_stats(brand_id: Optional[int] = None, db: Session = Depends(get_db)):
    """
    Computes live dashboard KPIs and distribution metrics from database tables.
    Never hardcoded; updates dynamically as records and scans are processed.
    """
    # Base queries
    brands_q = db.query(models.BrandProfile)
    social_q = db.query(models.SocialProfileRecord)
    app_q = db.query(models.AppListingRecord)
    findings_q = db.query(models.Finding)
    scans_q = db.query(models.ScanHistory)
    audit_q = db.query(models.AuditLog)

    if brand_id:
        brands_q = brands_q.filter(models.BrandProfile.id == brand_id)
        social_q = social_q.filter(models.SocialProfileRecord.brand_id == brand_id)
        app_q = app_q.filter(models.AppListingRecord.brand_id == brand_id)
        findings_q = findings_q.filter(models.Finding.brand_id == brand_id)
        scans_q = scans_q.filter(models.ScanHistory.brand_id == brand_id)
        audit_q = audit_q.filter(models.AuditLog.brand_id == brand_id)

    total_brands = brands_q.count()
    total_monitored_social = social_q.count()
    total_monitored_apps = app_q.count()

    # Suspicious findings
    suspicious_social = findings_q.filter(models.Finding.asset_type == "social").count()
    suspicious_apps = findings_q.filter(models.Finding.asset_type == "app").count()

    high_critical_findings = findings_q.filter(
        models.Finding.risk_category.in_(["High", "Critical"])
    ).count()

    # Excluded official assets count from audit logs or completed scans
    excluded_count = audit_q.filter(
        models.AuditLog.event_type.in_(["OFFICIAL_ASSET_EXCLUDED", "OFFICIAL_APP_EXCLUDED"])
    ).count()

    total_scans_completed = scans_q.filter(models.ScanHistory.status == "completed").count()

    # Risk Distribution Breakdown
    risk_counts = {"Low": 0, "Medium": 0, "High": 0, "Critical": 0}
    findings_by_risk = (
        findings_q.with_entities(models.Finding.risk_category, func.count(models.Finding.id))
        .group_by(models.Finding.risk_category)
        .all()
    )
    for cat, count in findings_by_risk:
        if cat in risk_counts:
            risk_counts[cat] = count

    # Platform distribution for social findings
    platform_counts: Dict[str, int] = {}
    findings_by_platform = (
        findings_q.filter(models.Finding.asset_type == "social")
        .with_entities(models.Finding.platform_or_store, func.count(models.Finding.id))
        .group_by(models.Finding.platform_or_store)
        .all()
    )
    for plat, count in findings_by_platform:
        platform_counts[plat] = count

    # Social vs App breakdown
    social_vs_app = {
        "Social Media": suspicious_social,
        "Mobile App Stores": suspicious_apps,
    }

    # Recent scans & findings
    recent_scans = scans_q.order_by(models.ScanHistory.started_at.desc()).limit(5).all()
    recent_findings = findings_q.order_by(models.Finding.created_at.desc()).limit(8).all()

    return schemas.DashboardStatsResponse(
        total_brands=total_brands,
        total_monitored_social=total_monitored_social,
        total_monitored_apps=total_monitored_apps,
        suspicious_social=suspicious_social,
        suspicious_apps=suspicious_apps,
        high_critical_findings=high_critical_findings,
        official_assets_excluded=excluded_count,
        total_scans_completed=total_scans_completed,
        risk_distribution=risk_counts,
        platform_distribution=platform_counts,
        social_vs_app=social_vs_app,
        recent_scans=recent_scans,
        recent_findings=recent_findings,
    )
