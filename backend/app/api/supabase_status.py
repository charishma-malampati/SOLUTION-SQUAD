import os
from datetime import datetime
import httpx
from fastapi import APIRouter

router = APIRouter(prefix="/api/supabase", tags=["Supabase Cloud Integration"])

SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://byccnjctijsbhyxyojpa.supabase.co").strip().rstrip("/")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY", "sb_publishable_U-_zsCeuZKuHWsh82ZBwig_1LQHi2ih").strip()


@router.get("/status")
async def get_supabase_status():
    """
    Validates Supabase cloud connectivity and returns health status.
    Never exposes full private/secret keys.
    """
    clean_url = SUPABASE_URL.replace("/rest/v1", "").rstrip("/")
    masked_key = f"{SUPABASE_KEY[:8]}...{SUPABASE_KEY[-4:]}" if len(SUPABASE_KEY) > 12 else "***"
    project_ref = clean_url.replace("https://", "").replace("http://", "").split(".")[0]

    try:
        async with httpx.AsyncClient(timeout=6.0) as client:
            resp = await client.get(
                f"{clean_url}/auth/v1/health",
                headers={"apikey": SUPABASE_KEY},
            )

        if resp.status_code == 200:
            data = resp.json()
            return {
                "connected": True,
                "status": "CONNECTED",
                "project_ref": project_ref,
                "supabase_url": clean_url,
                "api_key_masked": masked_key,
                "service_version": data.get("version", "v2.0"),
                "service_name": data.get("name", "GoTrue"),
                "checked_at": datetime.utcnow().isoformat(),
            }
        else:
            return {
                "connected": False,
                "status": "ERROR",
                "project_ref": project_ref,
                "supabase_url": clean_url,
                "api_key_masked": masked_key,
                "error": f"Supabase responded with HTTP {resp.status_code}",
                "checked_at": datetime.utcnow().isoformat(),
            }
    except Exception as e:
        return {
            "connected": False,
            "status": "OFFLINE",
            "project_ref": project_ref,
            "supabase_url": clean_url,
            "api_key_masked": masked_key,
            "error": str(e),
            "checked_at": datetime.utcnow().isoformat(),
        }
