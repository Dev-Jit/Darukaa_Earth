from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.crud import site as site_crud
from app.crud import site_metric as site_metric_crud
from app.models.user import User
from app.schemas.ai_insights import SiteAiInsightsResponse
from app.schemas.site import SiteResponse
from app.schemas.site_metric import SiteMetricResponse, SiteMetricsListResponse
from app.services.ai_insights import generate_site_insights
from app.services.serialization import site_to_response

router = APIRouter()


@router.get(
    "/{site_id}",
    response_model=SiteResponse,
    summary="Get site detail",
)
def get_site(
    site_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> SiteResponse:
    site = site_crud.get_site_for_owner(db, site_id, current_user.id)
    if site is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Site not found",
        )
    return site_to_response(site)


@router.get(
    "/{site_id}/metrics",
    response_model=SiteMetricsListResponse,
    summary="List time-series metrics for a site",
)
def list_site_metrics(
    site_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    metric_type: str | None = Query(default=None, max_length=64),
    recorded_from: datetime | None = Query(default=None, alias="from"),
    recorded_to: datetime | None = Query(default=None, alias="to"),
) -> SiteMetricsListResponse:
    site = site_crud.get_site_for_owner(db, site_id, current_user.id)
    if site is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Site not found",
        )

    metrics = site_metric_crud.list_site_metrics(
        db,
        site_id,
        metric_type=metric_type,
        recorded_from=recorded_from,
        recorded_to=recorded_to,
    )
    metric_responses = [SiteMetricResponse.model_validate(metric) for metric in metrics]
    return SiteMetricsListResponse(
        site_id=site_id,
        metrics=metric_responses,
        count=len(metric_responses),
    )


@router.get(
    "/{site_id}/ai-insights",
    response_model=SiteAiInsightsResponse,
    summary="Generate AI insights from existing site metrics",
)
def get_site_ai_insights(
    site_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> SiteAiInsightsResponse:
    site = site_crud.get_site_for_owner(db, site_id, current_user.id)
    if site is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Site not found",
        )

    metrics = site_metric_crud.list_site_metrics(db, site_id)
    try:
        return generate_site_insights(site, metrics)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI insights are currently unavailable.",
        ) from exc
