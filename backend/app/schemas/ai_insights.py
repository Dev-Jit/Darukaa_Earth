from typing import Literal

from pydantic import BaseModel, Field


class SiteAiInsightsResponse(BaseModel):
    status: Literal["ok", "no_data"]
    summary: str | None = None
    key_findings: list[str] = Field(default_factory=list)
    attention: str | None = None
    suggested_next_step: str | None = None
