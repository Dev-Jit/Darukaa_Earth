from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.site import SiteResponse


class ProjectBase(BaseModel):
    name: str = Field(min_length=2, max_length=255)
    description: str | None = Field(default=None, max_length=5000)


class ProjectCreate(ProjectBase):
    pass


class ProjectResponse(ProjectBase):
    id: UUID
    owner_id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ProjectListItem(ProjectResponse):
    site_count: int = Field(default=0, ge=0)


class ProjectDetailResponse(ProjectResponse):
    sites: list[SiteResponse] = Field(default_factory=list)
