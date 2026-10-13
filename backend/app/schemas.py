from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, HttpUrl, ConfigDict


# Brand Profile Schemas
class BrandProfileBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    industry: Optional[str] = None
    website: Optional[str] = None
    description: Optional[str] = None
    keywords: Optional[str] = None  # comma-separated string
    aliases: Optional[str] = None   # comma-separated string
    logo_url: Optional[str] = None


class BrandProfileCreate(BrandProfileBase):
    pass


class BrandProfileUpdate(BaseModel):
    name: Optional[str] = None
    industry: Optional[str] = None
    website: Optional[str] = None
    description: Optional[str] = None
    keywords: Optional[str] = None
    aliases: Optional[str] = None
    logo_url: Optional[str] = None


class OfficialSocialAssetCreate(BaseModel):
    platform: str
    handle: str
    url: Optional[str] = None
    verified_badge: bool = True
    notes: Optional[str] = None


class OfficialSocialAssetResponse(OfficialSocialAssetCreate):
    id: int
    brand_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class OfficialApplicationCreate(BaseModel):
    app_name: str
    package_id: str
    store: str
    store_url: Optional[str] = None
    publisher_name: str


class OfficialApplicationResponse(OfficialApplicationCreate):
    id: int
    brand_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class BrandProfileResponse(BrandProfileBase):
    id: int
    created_at: datetime
    updated_at: datetime
    official_social_assets: List[OfficialSocialAssetResponse] = []
    official_applications: List[OfficialApplicationResponse] = []

    model_config = ConfigDict(from_attributes=True)


# Social Profile Record Schemas
class SocialProfileRecordCreate(BaseModel):
    platform: str
    username: str
    display_name: Optional[str] = None
    profile_url: Optional[str] = None
    bio: Optional[str] = None
    follower_count: Optional[int] = 0
    account_created_at: Optional[str] = None
    data_source: Optional[str] = "manual_entry"


class SocialProfileRecordResponse(SocialProfileRecordCreate):
    id: int
    brand_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# App Listing Record Schemas
class AppListingRecordCreate(BaseModel):
    app_name: str
    package_id: str
    developer_name: str
    store_name: str
    store_url: Optional[str] = None
    description: Optional[str] = None
    icon_url: Optional[str] = None
    permissions: Optional[str] = None
    data_source: Optional[str] = "manual_entry"


class AppListingRecordResponse(AppListingRecordCreate):
    id: int
    brand_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Finding Schemas
class FindingReviewUpdate(BaseModel):
    review_status: str  # 'reviewed', 'false_positive', 'escalated', 'unreviewed'
    reviewer_notes: Optional[str] = None


class FindingResponse(BaseModel):
    id: int
    brand_id: int
    asset_type: str
    record_id: Optional[int] = None
    asset_name: str
    platform_or_store: str
    source_url: Optional[str] = None
    risk_score: float
    risk_category: str
    detection_reasons: List[str] = []
    evidence_snippets: Dict[str, Any] = {}
    matched_official_asset: Dict[str, Any] = {}
    similarity_details: Dict[str, Any] = {}
    review_status: str
    reviewer_notes: Optional[str] = None
    recommended_action: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Scan Schemas
class ScanTriggerRequest(BaseModel):
    brand_id: int
    scan_type: str = "full"  # 'social', 'app', or 'full'


class ScanHistoryResponse(BaseModel):
    id: int
    brand_id: int
    scan_type: str
    started_at: datetime
    completed_at: Optional[datetime] = None
    status: str
    records_processed: int
    alerts_generated: int
    excluded_assets_count: int
    notes: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


# Audit Log & Feedback Schemas
class AuditLogResponse(BaseModel):
    id: int
    brand_id: Optional[int] = None
    event_type: str
    details: Optional[str] = None
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)


class ReviewFeedbackResponse(BaseModel):
    id: int
    finding_id: int
    user_action: str
    is_false_positive: bool
    notes: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Dashboard Statistics Schema
class DashboardStatsResponse(BaseModel):
    total_brands: int
    total_monitored_social: int
    total_monitored_apps: int
    suspicious_social: int
    suspicious_apps: int
    high_critical_findings: int
    official_assets_excluded: int
    total_scans_completed: int
    risk_distribution: Dict[str, int]
    platform_distribution: Dict[str, int]
    social_vs_app: Dict[str, int]
    recent_scans: List[ScanHistoryResponse] = []
    recent_findings: List[FindingResponse] = []


# Configurable Settings Schema
class DetectionSettings(BaseModel):
    name_similarity_weight: float = 30.0
    substitution_weight: float = 20.0
    keyword_weight: float = 20.0
    description_weight: float = 15.0
    publisher_mismatch_weight: float = 15.0
    low_threshold: float = 30.0
    high_threshold: float = 60.0
    critical_threshold: float = 80.0
