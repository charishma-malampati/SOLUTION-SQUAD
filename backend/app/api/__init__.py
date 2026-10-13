from fastapi import APIRouter
from app.api.brands import router as brands_router
from app.api.social import router as social_router
from app.api.apps import router as apps_router
from app.api.findings import router as findings_router
from app.api.scans import router as scans_router
from app.api.stats import router as stats_router
from app.api.reports import router as reports_router
from app.api.demo import router as demo_router
from app.api.supabase_status import router as supabase_router

api_router = APIRouter()
api_router.include_router(brands_router)
api_router.include_router(social_router)
api_router.include_router(apps_router)
api_router.include_router(findings_router)
api_router.include_router(scans_router)
api_router.include_router(stats_router)
api_router.include_router(reports_router)
api_router.include_router(demo_router)
api_router.include_router(supabase_router)

__all__ = ["api_router"]
