#!/usr/bin/env bash
set -euo pipefail
alembic upgrade head
python scripts/seed_site_metrics.py --all
exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}"
