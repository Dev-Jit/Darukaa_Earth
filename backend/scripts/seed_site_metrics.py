"""
Generate mock monthly site_metrics for demo analytics (hackathon / local dev).

Usage (from backend/):
  python scripts/seed_site_metrics.py --all
  python scripts/seed_site_metrics.py --site-id <UUID>
  python scripts/seed_site_metrics.py --all --replace
"""

from __future__ import annotations

import argparse
import random
import sys
from datetime import UTC, datetime
from pathlib import Path
from uuid import UUID

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.db.session import SessionLocal
from app.models.site import Site
from app.models.site_metric import SiteMetric
from sqlalchemy.orm import Session

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
) -> int:
    rng = random.Random(seed if seed is not None else hash(site.id) % (2**32))

    if replace:
        db.query(SiteMetric).filter(SiteMetric.site_id == site.id).delete()
        db.commit()

    existing = db.query(SiteMetric.id).filter(SiteMetric.site_id == site.id).limit(1).first()
    if existing and not replace:
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
    print(f"Seeded {created} metrics for site {site.id} ({site.name})")
    return created


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Seed mock site_metrics time series")
    parser.add_argument("--all", action="store_true", help="Seed every site in the database")
    parser.add_argument("--site-id", type=UUID, help="Seed a single site by UUID")
    parser.add_argument(
        "--replace",
        action="store_true",
        help="Delete existing metrics for targeted site(s) before seeding",
    )
    parser.add_argument("--seed", type=int, default=None, help="Optional RNG seed override")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    if not args.all and args.site_id is None:
        print("Provide --all or --site-id", file=sys.stderr)
        return 1

    db = SessionLocal()
    try:
        if args.site_id:
            site = db.query(Site).filter(Site.id == args.site_id).first()
            if site is None:
                print(f"Site not found: {args.site_id}", file=sys.stderr)
                return 1
            sites = [site]
        else:
            sites = db.query(Site).order_by(Site.created_at.asc()).all()
            if not sites:
                print("No sites found to seed.", file=sys.stderr)
                return 1

        total = 0
        for site in sites:
            total += seed_site_metrics(db, site, replace=args.replace, seed=args.seed)
        print(f"Done. {total} metric rows written.")
        return 0
    finally:
        db.close()


if __name__ == "__main__":
    raise SystemExit(main())
