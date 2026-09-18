from datetime import datetime
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.site_metric import SiteMetric


def list_site_metrics(
    db: Session,
    site_id: UUID,
    *,
    metric_type: str | None = None,
    recorded_from: datetime | None = None,
    recorded_to: datetime | None = None,
) -> list[SiteMetric]:
    query = db.query(SiteMetric).filter(SiteMetric.site_id == site_id)
    if metric_type:
        query = query.filter(SiteMetric.metric_type == metric_type)
    if recorded_from is not None:
        query = query.filter(SiteMetric.recorded_at >= recorded_from)
    if recorded_to is not None:
        query = query.filter(SiteMetric.recorded_at <= recorded_to)
    return query.order_by(SiteMetric.recorded_at.asc()).all()
