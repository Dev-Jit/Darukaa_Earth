from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.api import api_router
from app.api.v1.endpoints.auth import router as auth_router
from app.api.v1.endpoints.health import health_check
from app.api.v1.endpoints.projects import router as projects_router
from app.api.v1.endpoints.sites import router as sites_router
from app.core.config import settings

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description=(
        "Geospatial backend for managing carbon offset and biodiversity conservation projects"
    ),
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
)

# Configure Cross-Origin Resource Sharing (CORS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API v1 router
app.include_router(api_router, prefix=settings.API_V1_STR)

# Authentication (JWT register / login)
app.include_router(auth_router, prefix="/auth", tags=["Authentication"])

# Projects & sites (JWT protected)
app.include_router(projects_router, prefix="/projects", tags=["Projects"])
app.include_router(sites_router, prefix="/sites", tags=["Sites"])

# Direct root-level /health route for simple container/orchestrator health checking
app.add_api_route(
    "/health", health_check, methods=["GET"], tags=["Health"], summary="Root Health Check"
)


@app.get("/", tags=["Root"])
def root():
    """Root endpoint welcoming developers and linking to API documentation."""
    return {
        "message": f"Welcome to {settings.PROJECT_NAME}",
        "version": settings.VERSION,
        "docs_url": f"{settings.API_V1_STR}/docs",
        "health_url": "/health",
    }
