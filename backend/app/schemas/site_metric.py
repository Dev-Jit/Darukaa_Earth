from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class SiteMetricResponse(BaseModel):
    id: UUID
    site_id: UUID
    metric_type: str
    value: float
    recorded_at: datetime
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SiteMetricsListResponse(BaseModel):
    site_id: UUID
    metrics: list[SiteMetricResponse] = Field(default_factory=list)
    count: int
