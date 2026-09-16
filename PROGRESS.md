# Darukaa.Earth — Project Progress & Architecture Log

## Project Overview
Darukaa.Earth is a full-stack geospatial dashboard designed to manage, monitor, and visualize ecological data for carbon sequestration and biodiversity conservation projects. The platform couples interactive spatial boundary mapping with rich analytical charts, enabling project developers, auditors, and stakeholders to track ecological metrics, project baselines, and carbon stock calculations within a secure, high-performance web interface.

## Tech Stack
- **Monorepo Layout**: Dual-directory structure (`backend/` and `frontend/`)
- **Backend**: FastAPI (Python) *(to be scaffolded)*
- **Frontend**: React, Mapbox GL JS, Chart.js / Highcharts *(to be scaffolded)*
- **Geospatial Database**: PostgreSQL + PostGIS *(to be scaffolded)*
- **Authentication**: JWT-based authentication *(to be scaffolded)*
- **Code Quality & CI/CD**: Pre-commit hooks (Husky, lint-staged, Prettier, Ruff/Flake8/Black), GitHub Actions CI/CD *(to be scaffolded)*

## Architecture Decisions & Trade-offs
- **2026-09-16 — Monorepo Structure (`backend/` + `frontend/`)**: Chose a clean two-folder monorepo architecture with unified tracking (`PROGRESS.md`, `.gitignore`, root CI/CD hooks). *Rationale*: Keeps geospatial backend models, API contracts, and frontend dashboard components in a single synchronized git history without the overhead of heavy multi-package monorepo tooling (like Nx or Turborepo) until scale demands it.

## Progress Log

### 2026-09-16 — Initial Repository Scaffolding & Setup
- **What was built**: Initialized the project repository with a root monorepo layout containing `backend/` and `frontend/` directories, a comprehensive `.gitignore` targeting Python, Node.js, and geospatial development artifacts, root `README.md`, and structured `PROGRESS.md`.
- **Files touched**:
  - [`.gitignore`](file:///c:/Projects/Daruka_Earth/.gitignore)
  - [`README.md`](file:///c:/Projects/Daruka_Earth/README.md)
  - [`PROGRESS.md`](file:///c:/Projects/Daruka_Earth/PROGRESS.md)
  - [`backend/.gitkeep`](file:///c:/Projects/Daruka_Earth/backend/.gitkeep)
  - [`frontend/.gitkeep`](file:///c:/Projects/Daruka_Earth/frontend/.gitkeep)
- **How to run/test it**:
  - Clone or open repository in terminal.
  - Verify git history using `git log --oneline`.

## How to Run This Project Locally
*Note: Service scaffolding in progress. Local setup steps will be added as backend and frontend services are provisioned.*

### Prerequisites
- Git
- Python 3.11+
- Node.js 18+ / npm
- PostgreSQL with PostGIS extension (or Docker)

## Known Limitations / TODO
- [ ] Initialize frontend application (React + Mapbox GL JS + Charts).
- [ ] Initialize backend application (FastAPI + PostGIS ORM + Pydantic models).
- [ ] Set up database migrations and connection pool (SQLAlchemy / GeoAlchemy2 / Alembic).
- [ ] Implement JWT authentication flow.
- [ ] Configure Git pre-commit hooks (Husky, lint-staged, Prettier, Ruff).
- [ ] Set up GitHub Actions CI/CD pipeline.
