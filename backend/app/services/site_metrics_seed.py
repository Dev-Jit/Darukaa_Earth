"""Generate mock monthly site_metrics for demo analytics."""

from __future__ import annotations

import random
from datetime import UTC, datetime

from sqlalchemy.orm import Session

from app.models.site import Site
from app.models.site_metric import SiteMetric

METRIC_TYPES = (
    "carbon_sequestration_tco2e",
    "biodiversity_index",
)

MONTHS = 12


def _month_starts(anchor: datetime, months: int) -> list[datetime]:
    year = anchor.year
    month = anchor.month
    points: list[datetime] = []
    for _ in range(months):
        points.append(datetime(year, month, 1, tzinfo=UTC))
        month -= 1
        if month == 0:
            month = 12
            year -= 1
    return list(reversed(points))


def _generate_series(
    metric_type: str,
    months: int,
    rng: random.Random,
) -> list[tuple[datetime, float]]:
    timestamps = _month_starts(datetime.now(UTC), months)
    values: list[tuple[datetime, float]] = []

    if metric_type == "carbon_sequestration_tco2e":
        base = rng.uniform(8.0, 24.0)
        drift = rng.uniform(0.15, 0.45)
        seasonal = rng.uniform(0.5, 1.5)
        for index, recorded_at in enumerate(timestamps):
            season = seasonal * (1.0 + 0.08 * ((index % 12) / 11.0 - 0.5))
            noise = rng.uniform(-0.6, 0.6)
            value = max(0.1, base + drift * index + season + noise)
            values.append((recorded_at, round(value, 3)))
    else:
        base = rng.uniform(0.45, 0.72)
        drift = rng.uniform(-0.008, 0.012)
        for index, recorded_at in enumerate(timestamps):
            noise = rng.uniform(-0.03, 0.03)
            value = min(1.0, max(0.0, base + drift * index + noise))
            values.append((recorded_at, round(value, 4)))

    return values


def seed_site_metrics(
    db: Session,
    site: Site,
    *,
    replace: bool,
    seed: int | None,
    verbose: bool = False,
) -> int:
    rng = random.Random(seed if seed is not None else hash(site.id) % (2**32))

    if replace:
        db.query(SiteMetric).filter(SiteMetric.site_id == site.id).delete()
        db.commit()

    existing = db.query(SiteMetric.id).filter(SiteMetric.site_id == site.id).limit(1).first()
    if existing and not replace:
        if verbose:
            print(f"Skipping site {site.id} ({site.name}): metrics already present")
        return 0

    created = 0
    for metric_type in METRIC_TYPES:
        for recorded_at, value in _generate_series(metric_type, MONTHS, rng):
            db.add(
                SiteMetric(
                    site_id=site.id,
                    metric_type=metric_type,
                    value=value,
                    recorded_at=recorded_at,
                )
            )
            created += 1
    db.commit()
    if verbose:
        print(f"Seeded {created} metrics for site {site.id} ({site.name})")
    return created
