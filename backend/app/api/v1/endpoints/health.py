import logging

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.core.config import settings
from app.schemas.health import HealthCheckResponse

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get(
    "/health", response_model=HealthCheckResponse, summary="Service & Database Health Check"
)
def health_check(response: Response, db: Session = Depends(get_db)):
    """Health check endpoint that verifies API uptime and database/PostGIS connectivity."""
    db_status = "disconnected"
    postgis_version = None
    details = {}

    try:
        # Check basic database connectivity
        db.execute(text("SELECT 1"))
        db_status = "connected"

        # Check PostGIS extension and version
        try:
            pg_res = db.execute(text("SELECT PostGIS_Full_Version()")).scalar()
            postgis_version = pg_res
            details["postgis"] = "enabled"
        except Exception as pg_exc:
            details["postgis"] = f"PostGIS extension query error: {str(pg_exc)}"

    except Exception as exc:
        logger.warning(f"Database health check failed: {exc}")
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
        db_status = f"unreachable ({type(exc).__name__})"
        details["error"] = str(exc)

    overall_status = "healthy" if db_status == "connected" else "unhealthy"

    return HealthCheckResponse(
        status=overall_status,
        service=settings.PROJECT_NAME,
        version=settings.VERSION,
        database=db_status,
        postgis_version=postgis_version,
        details=details,
    )
