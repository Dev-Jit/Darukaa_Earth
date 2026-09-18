from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.geo import GeoJSONPolygon


class SiteCreateBody(BaseModel):
    name: str = Field(min_length=2, max_length=255)
    geometry: GeoJSONPolygon


class SiteResponse(BaseModel):
    id: UUID
    project_id: UUID
    name: str
    geometry: dict[str, Any]
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
