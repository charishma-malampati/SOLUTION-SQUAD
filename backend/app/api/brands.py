from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas

router = APIRouter(prefix="/api/brands", tags=["Brand Profiles"])


@router.get("", response_model=List[schemas.BrandProfileResponse])
def get_brands(db: Session = Depends(get_db)):
    """Retrieve all registered brand profiles."""
    return db.query(models.BrandProfile).order_by(models.BrandProfile.name.asc()).all()


@router.post("", response_model=schemas.BrandProfileResponse, status_code=status.HTTP_201_CREATED)
def create_brand(payload: schemas.BrandProfileCreate, db: Session = Depends(get_db)):
    """Create a new brand profile."""
    existing = db.query(models.BrandProfile).filter(models.BrandProfile.name.ilike(payload.name.strip())).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Brand profile '{payload.name}' already exists."
        )

    brand = models.BrandProfile(
        name=payload.name.strip(),
        industry=payload.industry,
        website=payload.website,
        description=payload.description,
        keywords=payload.keywords,
        aliases=payload.aliases,
        logo_url=payload.logo_url,
    )
    db.add(brand)
    db.commit()
    db.refresh(brand)

    # Log audit event
    audit = models.AuditLog(
        brand_id=brand.id,
        event_type="BRAND_CREATED",
        details=f"Brand profile '{brand.name}' registered."
    )
    db.add(audit)
    db.commit()

    return brand


@router.get("/{brand_id}", response_model=schemas.BrandProfileResponse)
def get_brand(brand_id: int, db: Session = Depends(get_db)):
    """Get single brand profile by ID."""
    brand = db.query(models.BrandProfile).filter(models.BrandProfile.id == brand_id).first()
    if not brand:
        raise HTTPException(status_code=404, detail="Brand profile not found.")
    return brand


@router.put("/{brand_id}", response_model=schemas.BrandProfileResponse)
def update_brand(brand_id: int, payload: schemas.BrandProfileUpdate, db: Session = Depends(get_db)):
    """Update existing brand profile."""
    brand = db.query(models.BrandProfile).filter(models.BrandProfile.id == brand_id).first()
    if not brand:
        raise HTTPException(status_code=404, detail="Brand profile not found.")

    update_data = payload.dict(exclude_unset=True)
    for key, value in update_data.items():
        if value is not None:
            setattr(brand, key, value)

    db.commit()
    db.refresh(brand)
    return brand


@router.delete("/{brand_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_brand(brand_id: int, db: Session = Depends(get_db)):
    """Delete a brand profile and all cascading records."""
    brand = db.query(models.BrandProfile).filter(models.BrandProfile.id == brand_id).first()
    if not brand:
        raise HTTPException(status_code=404, detail="Brand profile not found.")

    db.delete(brand)
    db.commit()
    return None


# Official Social Assets
@router.post("/{brand_id}/official-social", response_model=schemas.OfficialSocialAssetResponse, status_code=status.HTTP_201_CREATED)
def add_official_social(brand_id: int, payload: schemas.OfficialSocialAssetCreate, db: Session = Depends(get_db)):
    """Register a verified official social media handle for exclusion."""
    brand = db.query(models.BrandProfile).filter(models.BrandProfile.id == brand_id).first()
    if not brand:
        raise HTTPException(status_code=404, detail="Brand profile not found.")

    asset = models.OfficialSocialAsset(
        brand_id=brand_id,
        platform=payload.platform,
        handle=payload.handle.strip(),
        url=payload.url,
        verified_badge=payload.verified_badge,
        notes=payload.notes,
    )
    db.add(asset)

    audit = models.AuditLog(
        brand_id=brand_id,
        event_type="OFFICIAL_SOCIAL_REGISTERED",
        details=f"Official {payload.platform} handle '{payload.handle}' registered for exclusion."
    )
    db.add(audit)
    db.commit()
    db.refresh(asset)
    return asset


@router.delete("/{brand_id}/official-social/{asset_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_official_social(brand_id: int, asset_id: int, db: Session = Depends(get_db)):
    """Remove an official social asset."""
    asset = db.query(models.OfficialSocialAsset).filter(
        models.OfficialSocialAsset.id == asset_id,
        models.OfficialSocialAsset.brand_id == brand_id
    ).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Official asset not found.")

    db.delete(asset)
    db.commit()
    return None


# Official Applications
@router.post("/{brand_id}/official-apps", response_model=schemas.OfficialApplicationResponse, status_code=status.HTTP_201_CREATED)
def add_official_app(brand_id: int, payload: schemas.OfficialApplicationCreate, db: Session = Depends(get_db)):
    """Register an official mobile application package ID for exclusion."""
    brand = db.query(models.BrandProfile).filter(models.BrandProfile.id == brand_id).first()
    if not brand:
        raise HTTPException(status_code=404, detail="Brand profile not found.")

    app = models.OfficialApplication(
        brand_id=brand_id,
        app_name=payload.app_name.strip(),
        package_id=payload.package_id.strip(),
        store=payload.store,
        store_url=payload.store_url,
        publisher_name=payload.publisher_name.strip(),
    )
    db.add(app)

    audit = models.AuditLog(
        brand_id=brand_id,
        event_type="OFFICIAL_APP_REGISTERED",
        details=f"Official App '{payload.app_name}' ({payload.package_id}) registered for exclusion."
    )
    db.add(audit)
    db.commit()
    db.refresh(app)
    return app


@router.delete("/{brand_id}/official-apps/{app_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_official_app(brand_id: int, app_id: int, db: Session = Depends(get_db)):
    """Remove an official mobile application."""
    app = db.query(models.OfficialApplication).filter(
        models.OfficialApplication.id == app_id,
        models.OfficialApplication.brand_id == brand_id
    ).first()
    if not app:
        raise HTTPException(status_code=404, detail="Official application not found.")

    db.delete(app)
    db.commit()
    return None
