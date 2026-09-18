import uuid

from sqlalchemy import Column, DateTime, Float, ForeignKey, Index, String, func, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.base_class import Base


class SiteMetric(Base):
    """Time-series observation for ecological and carbon metrics per site."""

    __tablename__ = "site_metrics"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=text("gen_random_uuid()"),
    )
    site_id = Column(
        UUID(as_uuid=True), ForeignKey("sites.id", ondelete="CASCADE"), nullable=False, index=True
    )
    metric_type = Column(String(64), nullable=False, index=True)
    value = Column(Float, nullable=False)
    recorded_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    site = relationship("Site", back_populates="metrics")

    # Composite indexes for high-performance time-series querying
    __table_args__ = (
        Index(
            "idx_site_metrics_site_metric_recorded",
            "site_id",
            "metric_type",
            text("recorded_at DESC"),
        ),
        Index("idx_site_metrics_site_recorded", "site_id", text("recorded_at DESC")),
    )
