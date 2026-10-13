from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import init_db
from app.api import api_router

app = FastAPI(
    title="BrandShield AI — Digital Risk Protection API",
    description="Deterministic detection, social media monitoring, mobile app store defense, and official asset exclusion platform.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Enable CORS for local frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount all application endpoints
app.include_router(api_router)


@app.on_event("startup")
def on_startup():
    """Initialize database tables on application launch."""
    init_db()


@app.get("/api/health", tags=["Health"])
def health_check():
    """System health check endpoint."""
    return {
        "status": "healthy",
        "service": "BrandShield AI Digital Risk Protection Platform",
        "version": "1.0.0",
        "engine": "Deterministic Multi-factor Threat Engine v1.0",
    }
