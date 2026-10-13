from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app import models
from app.api.social import run_social_scan
from app.api.apps import run_app_scan

router = APIRouter(prefix="/api/demo", tags=["Demo Data & Sandbox"])


@router.post("/load")
def load_demo_data(db: Session = Depends(get_db)):
    """
    Idempotently seeds the database with the fictional 'NovaPay' brand,
    verified official assets, and realistic test datasets demonstrating:
    - Confirmed official asset exclusion
    - Impersonation modifiers ('Support', 'Official')
    - Homoglyph leetspeak ('0' for 'o' in N0vaPay)
    - Transposition swap ('NovaPya')
    - Malicious spoofed loan apps
    - Identity conflict warning (spoofed package ID with unauthorized developer)
    - Harmless homographs and unrelated businesses
    """
    # 1. Seed or Get Brand Profile
    brand = db.query(models.BrandProfile).filter(models.BrandProfile.name == "NovaPay").first()
    if not brand:
        brand = models.BrandProfile(
            name="NovaPay",
            industry="Financial Technology & Digital Banking",
            website="https://www.novapay.io",
            description="Fictional next-generation digital payments, instant transfers, and digital banking platform. (DEMO FICTIONAL BRAND)",
            keywords="novapay, nova pay, novawallet, novacard, instant pay",
            aliases="Nova Pay, NovaPay App, NovaPay Global",
            logo_url="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80",
        )
        db.add(brand)
        db.commit()
        db.refresh(brand)

    # 2. Seed Official Social Assets (Idempotent)
    official_socials = [
        {
            "platform": "X",
            "handle": "NovaPayOfficial",
            "url": "https://x.com/NovaPayOfficial",
            "verified_badge": True,
            "notes": "Verified primary corporate account on X (Twitter).",
        },
        {
            "platform": "Instagram",
            "handle": "novapay_bank",
            "url": "https://instagram.com/novapay_bank",
            "verified_badge": True,
            "notes": "Verified official brand account on Instagram.",
        },
        {
            "platform": "LinkedIn",
            "handle": "novapay-technologies",
            "url": "https://linkedin.com/company/novapay-technologies",
            "verified_badge": True,
            "notes": "Official corporate LinkedIn company page.",
        },
    ]

    for item in official_socials:
        exists = db.query(models.OfficialSocialAsset).filter(
            models.OfficialSocialAsset.brand_id == brand.id,
            models.OfficialSocialAsset.platform == item["platform"],
            models.OfficialSocialAsset.handle == item["handle"],
        ).first()
        if not exists:
            asset = models.OfficialSocialAsset(brand_id=brand.id, **item)
            db.add(asset)

    # 3. Seed Official Mobile Applications (Idempotent)
    official_apps = [
        {
            "app_name": "NovaPay: Mobile Banking & Pay",
            "package_id": "com.novapay.app",
            "store": "Google Play",
            "store_url": "https://play.google.com/store/apps/details?id=com.novapay.app",
            "publisher_name": "NovaPay Technologies Ltd",
        },
        {
            "app_name": "NovaPay iOS Wallet",
            "package_id": "com.novapay.ios.wallet",
            "store": "Apple App Store",
            "store_url": "https://apps.apple.com/app/novapay-wallet/id198273645",
            "publisher_name": "NovaPay Technologies Ltd",
        },
    ]

    for item in official_apps:
        exists = db.query(models.OfficialApplication).filter(
            models.OfficialApplication.brand_id == brand.id,
            models.OfficialApplication.package_id == item["package_id"],
        ).first()
        if not exists:
            app = models.OfficialApplication(brand_id=brand.id, **item)
            db.add(app)

    db.commit()

    # 4. Seed Candidate Social Profiles (Fictional demo cases)
    demo_social_records = [
        # Exactly matches official account -> Should be EXCLUDED
        {
            "platform": "X",
            "username": "NovaPayOfficial",
            "display_name": "NovaPay Official",
            "profile_url": "https://x.com/NovaPayOfficial",
            "bio": "The official verified X account for NovaPay Technologies Ltd.",
            "follower_count": 142000,
            "account_created_at": "2021-03-15",
            "data_source": "synthetic_demo",
        },
        # High Risk: Impersonation keywords & credential solicitation
        {
            "platform": "Instagram",
            "username": "NovaPay_Support_Care",
            "display_name": "NovaPay Support Helpdesk",
            "profile_url": "https://instagram.com/novapay_support_care",
            "bio": "24/7 Official Customer Care Desk. Account blocked or suspended? DM to resolve immediately. Send OTP to unlock.",
            "follower_count": 420,
            "account_created_at": "2026-09-01",
            "data_source": "synthetic_demo",
        },
        # High Risk: Homoglyph substitution ('0' for 'o') + 'Official' modifier
        {
            "platform": "X",
            "username": "N0vaPay_Official",
            "display_name": "N0vaPay Customer Care",
            "profile_url": "https://x.com/N0vaPay_Official",
            "bio": "Fast verification department for NovaPay users. Urgent: update KYC now via WhatsApp at +1-800-FAKE.",
            "follower_count": 125,
            "account_created_at": "2026-10-02",
            "data_source": "synthetic_demo",
        },
        # Medium Risk: Adjacent character transposition ('NovaPya')
        {
            "platform": "Facebook",
            "username": "NovaPya_Global",
            "display_name": "NovaPya Payments",
            "profile_url": "https://facebook.com/novapya_global",
            "bio": "Easy online money transfers and checkout solutions for international merchants.",
            "follower_count": 1890,
            "account_created_at": "2025-11-20",
            "data_source": "synthetic_demo",
        },
        # Low Risk / Benign: Fan community
        {
            "platform": "Instagram",
            "username": "NovaPayersFan",
            "display_name": "NovaPay Enthusiasts Club",
            "profile_url": "https://instagram.com/novapayersfan",
            "bio": "Unofficial fan community sharing tips and fintech news about NovaPay app features.",
            "follower_count": 850,
            "account_created_at": "2024-06-12",
            "data_source": "synthetic_demo",
        },
        # Low Risk / Unrelated Business: Completely different bakery
        {
            "platform": "Instagram",
            "username": "NovakBakery",
            "display_name": "Novak Artisan Bakery",
            "profile_url": "https://instagram.com/novakbakery",
            "bio": "Fresh sourdough, croissants, and espresso in downtown Zagreb since 1998.",
            "follower_count": 5200,
            "account_created_at": "2019-04-10",
            "data_source": "synthetic_demo",
        },
    ]

    for item in demo_social_records:
        exists = db.query(models.SocialProfileRecord).filter(
            models.SocialProfileRecord.brand_id == brand.id,
            models.SocialProfileRecord.platform == item["platform"],
            models.SocialProfileRecord.username == item["username"],
        ).first()
        if not exists:
            rec = models.SocialProfileRecord(brand_id=brand.id, **item)
            db.add(rec)

    # 5. Seed Candidate App Store Listings (Fictional demo cases)
    demo_app_records = [
        # Exactly matches official app -> Should be EXCLUDED
        {
            "app_name": "NovaPay: Mobile Banking & Pay",
            "package_id": "com.novapay.app",
            "developer_name": "NovaPay Technologies Ltd",
            "store_name": "Google Play",
            "store_url": "https://play.google.com/store/apps/details?id=com.novapay.app",
            "description": "The official NovaPay mobile application for seamless banking, peer-to-peer transfers, and virtual debit cards.",
            "icon_url": "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=128&auto=format&fit=crop&q=80",
            "permissions": "INTERNET, ACCESS_NETWORK_STATE, BIOMETRIC",
            "data_source": "synthetic_demo",
        },
        # High Risk: Predatory loan scam using brand name & spoofed package ID
        {
            "app_name": "NovaPay Quick Loan - Instant Cash",
            "package_id": "com.novapay.loan.fast",
            "developer_name": "Apex Microfinance LLC",
            "store_name": "Google Play",
            "store_url": "https://play.google.com/store/apps/details?id=com.novapay.loan.fast",
            "description": "Instant loan approval in 5 minutes! Claim cashback reward and instant cash credit. Requires contacts and SMS read permissions.",
            "icon_url": "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=128&auto=format&fit=crop&q=80",
            "permissions": "READ_CONTACTS, READ_SMS, ACCESS_FINE_LOCATION, CAMERA",
            "data_source": "synthetic_demo",
        },
        # Critical Conflict: Spoofed official package ID with unrecognized rogue developer!
        {
            "app_name": "NovaPay Wallet Pro - Unlimited Transfer",
            "package_id": "com.novapay.app",
            "developer_name": "ShadowNet Mobile Devs",
            "store_name": "Third-Party APK Mirror",
            "store_url": "https://apk-free-download-mirror.xyz/novapay-mod.apk",
            "description": "Modded NovaPay app with unlimited limits. Share OTP to unlock unlimited rewards.",
            "icon_url": "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=128&auto=format&fit=crop&q=80",
            "permissions": "SYSTEM_ALERT_WINDOW, READ_EXTERNAL_STORAGE, RECORD_AUDIO",
            "data_source": "synthetic_demo",
        },
        # Medium Risk: Guide/utility app with brand keyword
        {
            "app_name": "Guide for NovaPay Transfers",
            "package_id": "com.techguide.novapaytips",
            "developer_name": "Fintech Tutorials Inc",
            "store_name": "Google Play",
            "store_url": "https://play.google.com/store/apps/details?id=com.techguide.novapaytips",
            "description": "Unofficial user manual and walkthrough for configuring NovaPay debit cards.",
            "icon_url": "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=128&auto=format&fit=crop&q=80",
            "permissions": "INTERNET",
            "data_source": "synthetic_demo",
        },
        # Low Risk / Unrelated: Sci-Fi mobile game
        {
            "app_name": "SuperNova Galaxy Armada 3D",
            "package_id": "com.stellargames.supernova.armada",
            "developer_name": "Stellar Arcade Studios",
            "store_name": "Google Play",
            "store_url": "https://play.google.com/store/apps/details?id=com.stellargames.supernova.armada",
            "description": "Command your starship fleet across alien sectors in this interstellar action game.",
            "icon_url": "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=128&auto=format&fit=crop&q=80",
            "permissions": "WAKE_LOCK, VIBRATE",
            "data_source": "synthetic_demo",
        },
    ]

    for item in demo_app_records:
        exists = db.query(models.AppListingRecord).filter(
            models.AppListingRecord.brand_id == brand.id,
            models.AppListingRecord.package_id == item["package_id"],
            models.AppListingRecord.store_name == item["store_name"],
        ).first()
        if not exists:
            rec = models.AppListingRecord(brand_id=brand.id, **item)
            db.add(rec)

    db.commit()

    return {
        "message": "Fictional demo data for 'NovaPay' successfully loaded.",
        "brand_id": brand.id,
        "brand_name": brand.name,
        "official_social_count": len(official_socials),
        "official_apps_count": len(official_apps),
        "social_records_count": len(demo_social_records),
        "app_records_count": len(demo_app_records),
    }


@router.post("/run-full-scan")
def run_full_demo_scan(db: Session = Depends(get_db)):
    """
    One-click demo runner:
    1. Ensures NovaPay demo data exists.
    2. Runs full social and app store scans.
    3. Populates findings, exclusion audit trails, and dashboard statistics.
    """
    load_demo_data(db)
    brand = db.query(models.BrandProfile).filter(models.BrandProfile.name == "NovaPay").first()
    social_res = run_social_scan(brand_id=brand.id, db=db)
    app_res = run_app_scan(brand_id=brand.id, db=db)

    return {
        "message": "Full demo scan executed successfully.",
        "brand_name": brand.name,
        "social_scan": social_res,
        "app_scan": app_res,
    }


@router.post("/reset")
def reset_demo_data(db: Session = Depends(get_db)):
    """Wipes all records and restores clean database state."""
    db.query(models.Finding).delete()
    db.query(models.ScanHistory).delete()
    db.query(models.AuditLog).delete()
    db.query(models.ReviewFeedback).delete()
    db.query(models.SocialProfileRecord).delete()
    db.query(models.AppListingRecord).delete()
    db.query(models.OfficialSocialAsset).delete()
    db.query(models.OfficialApplication).delete()
    db.query(models.BrandProfile).delete()
    db.commit()

    return {"message": "All database records have been reset."}
