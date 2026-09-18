from typing import Any

from pydantic import BaseModel


class HealthCheckResponse(BaseModel):
    """Schema for /health status endpoint responses."""

    status: str
    service: str
    version: str
    database: str
    postgis_version: str | None = None
    details: dict[str, Any] | None = None
