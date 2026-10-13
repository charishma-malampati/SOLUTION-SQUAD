import json
from datetime import datetime
from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    Float,
    Boolean,
    DateTime,
    ForeignKey,
    Index,
)
from sqlalchemy.orm import relationship
from app.database import Base


class BrandProfile(Base):
    __tablename__ = "brand_profiles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, unique=True, index=True)
    industry = Column(String(100), nullable=True)
    website = Column(String(255), nullable=True)
    description = Column(Text, nullable=True)
    keywords = Column(Text, nullable=True)  # Comma-separated or JSON array string
    aliases = Column(Text, nullable=True)   # Comma-separated or JSON array string
    logo_url = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    official_social_assets = relationship(
        "OfficialSocialAsset", back_populates="brand", cascade="all, delete-orphan"
    )
    official_applications = relationship(
        "OfficialApplication", back_populates="brand", cascade="all, delete-orphan"
    )
    social_records = relationship(
        "SocialProfileRecord", back_populates="brand", cascade="all, delete-orphan"
    )
    app_records = relationship(
        "AppListingRecord", back_populates="brand", cascade="all, delete-orphan"
    )
    findings = relationship(
        "Finding", back_populates="brand", cascade="all, delete-orphan"
    )
    scans = relationship(
        "ScanHistory", back_populates="brand", cascade="all, delete-orphan"
    )
    audit_logs = relationship(
        "AuditLog", back_populates="brand", cascade="all, delete-orphan"
    )


class OfficialSocialAsset(Base):
    __tablename__ = "official_social_assets"

    id = Column(Integer, primary_key=True, index=True)
    brand_id = Column(Integer, ForeignKey("brand_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    platform = Column(String(50), nullable=False)  # e.g., 'Instagram', 'X', 'Facebook', 'LinkedIn', 'YouTube'
    handle = Column(String(255), nullable=False, index=True)
    url = Column(String(500), nullable=True)
    verified_badge = Column(Boolean, default=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    brand = relationship("BrandProfile", back_populates="official_social_assets")


class OfficialApplication(Base):
    __tablename__ = "official_applications"

    id = Column(Integer, primary_key=True, index=True)
    brand_id = Column(Integer, ForeignKey("brand_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    app_name = Column(String(255), nullable=False)
    package_id = Column(String(255), nullable=False, index=True)  # e.g., com.novapay.app
    store = Column(String(100), nullable=False)  # Google Play, Apple App Store
    store_url = Column(String(500), nullable=True)
    publisher_name = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    brand = relationship("BrandProfile", back_populates="official_applications")


class SocialProfileRecord(Base):
    __tablename__ = "social_profile_records"

    id = Column(Integer, primary_key=True, index=True)
    brand_id = Column(Integer, ForeignKey("brand_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    platform = Column(String(50), nullable=False)
    username = Column(String(255), nullable=False, index=True)
    display_name = Column(String(255), nullable=True)
    profile_url = Column(String(500), nullable=True)
    bio = Column(Text, nullable=True)
    follower_count = Column(Integer, nullable=True)
    account_created_at = Column(String(100), nullable=True)
    data_source = Column(String(100), default="synthetic_demo")  # synthetic_demo, csv_upload, manual_entry, api
    raw_data = Column(Text, nullable=True)  # JSON string
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    brand = relationship("BrandProfile", back_populates="social_records")


class AppListingRecord(Base):
    __tablename__ = "app_listing_records"

    id = Column(Integer, primary_key=True, index=True)
    brand_id = Column(Integer, ForeignKey("brand_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    app_name = Column(String(255), nullable=False, index=True)
    package_id = Column(String(255), nullable=False, index=True)
    developer_name = Column(String(255), nullable=False)
    store_name = Column(String(100), nullable=False)
    store_url = Column(String(500), nullable=True)
    description = Column(Text, nullable=True)
    icon_url = Column(String(500), nullable=True)
    permissions = Column(Text, nullable=True)  # Comma-separated or JSON array string
    data_source = Column(String(100), default="synthetic_demo")
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    brand = relationship("BrandProfile", back_populates="app_records")


class Finding(Base):
    __tablename__ = "findings"

    id = Column(Integer, primary_key=True, index=True)
    brand_id = Column(Integer, ForeignKey("brand_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    asset_type = Column(String(50), nullable=False)  # 'social' or 'app'
    record_id = Column(Integer, nullable=True)
    asset_name = Column(String(255), nullable=False)
    platform_or_store = Column(String(100), nullable=False)
    source_url = Column(String(500), nullable=True)
    risk_score = Column(Float, nullable=False, index=True)  # 0.0 - 100.0
    risk_category = Column(String(50), nullable=False, index=True)  # 'Low', 'Medium', 'High', 'Critical'
    detection_reasons_json = Column(Text, nullable=True)  # JSON array of reasons
    evidence_snippets_json = Column(Text, nullable=True)  # JSON dict with score breakdowns & matched signals
    matched_official_asset_json = Column(Text, nullable=True)  # JSON dict
    similarity_details_json = Column(Text, nullable=True)  # JSON dict with exact metrics
    review_status = Column(String(50), default="unreviewed", nullable=False, index=True)  # unreviewed, reviewed, false_positive, escalated
    reviewer_notes = Column(Text, nullable=True)
    recommended_action = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    brand = relationship("BrandProfile", back_populates="findings")
    feedback = relationship("ReviewFeedback", back_populates="finding", cascade="all, delete-orphan")

    __table_args__ = (
        Index("idx_finding_brand_risk", "brand_id", "risk_category"),
        Index("idx_finding_brand_status", "brand_id", "review_status"),
    )

    @property
    def detection_reasons(self):
        if not self.detection_reasons_json:
            return []
        try:
            return json.loads(self.detection_reasons_json)
        except Exception:
            return []

    @property
    def evidence_snippets(self):
        if not self.evidence_snippets_json:
            return {}
        try:
            return json.loads(self.evidence_snippets_json)
        except Exception:
            return {}

    @property
    def matched_official_asset(self):
        if not self.matched_official_asset_json:
            return {}
        try:
            return json.loads(self.matched_official_asset_json)
        except Exception:
            return {}

    @property
    def similarity_details(self):
        if not self.similarity_details_json:
            return {}
        try:
            return json.loads(self.similarity_details_json)
        except Exception:
            return {}


class ScanHistory(Base):
    __tablename__ = "scan_histories"

    id = Column(Integer, primary_key=True, index=True)
    brand_id = Column(Integer, ForeignKey("brand_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    scan_type = Column(String(50), nullable=False)  # 'social', 'app', 'full'
    started_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    completed_at = Column(DateTime, nullable=True)
    status = Column(String(50), default="completed", nullable=False)  # 'completed', 'in_progress', 'failed'
    records_processed = Column(Integer, default=0)
    alerts_generated = Column(Integer, default=0)
    excluded_assets_count = Column(Integer, default=0)
    notes = Column(Text, nullable=True)

    brand = relationship("BrandProfile", back_populates="scans")


class ReviewFeedback(Base):
    __tablename__ = "review_feedback"

    id = Column(Integer, primary_key=True, index=True)
    finding_id = Column(Integer, ForeignKey("findings.id", ondelete="CASCADE"), nullable=False, index=True)
    user_action = Column(String(50), nullable=False)  # mark_reviewed, mark_false_positive, escalated
    is_false_positive = Column(Boolean, default=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    finding = relationship("Finding", back_populates="feedback")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    brand_id = Column(Integer, ForeignKey("brand_profiles.id", ondelete="CASCADE"), nullable=True, index=True)
    event_type = Column(String(100), nullable=False, index=True)  # ASSET_EXCLUDED, ASSET_ADDED, CONFLICT_DETECTED, SCAN_COMPLETED, FEEDBACK_SUBMITTED
    details = Column(Text, nullable=True)  # JSON or text description
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)

    brand = relationship("BrandProfile", back_populates="audit_logs")
