"""
Generate mock monthly site_metrics for demo analytics (hackathon / local dev).

Usage (from backend/):
  python scripts/seed_site_metrics.py --all
  python scripts/seed_site_metrics.py --site-id <UUID>
  python scripts/seed_site_metrics.py --all --replace
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path
from uuid import UUID

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.db.session import SessionLocal
from app.models.site import Site
from app.services.site_metrics_seed import seed_site_metrics


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
            total += seed_site_metrics(db, site, replace=args.replace, seed=args.seed, verbose=True)
        print(f"Done. {total} metric rows written.")
        return 0
    finally:
        db.close()


if __name__ == "__main__":
    raise SystemExit(main())
