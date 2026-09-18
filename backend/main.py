"""Darukaa.Earth FastAPI Application Entrypoint.

This module re-exports the main application instance from `app.main`
to ensure compatibility with both `uvicorn app.main:app` and `uvicorn main:app`.
"""

from app.main import app

__all__ = ["app"]
