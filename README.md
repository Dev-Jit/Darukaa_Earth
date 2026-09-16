# Darukaa.Earth 🌍

Darukaa.Earth is a full-stack geospatial dashboard engineered for managing, analyzing, and visualizing carbon offset and biodiversity conservation projects across the globe.

## Monorepo Architecture

```
Daruka_Earth/
├── backend/          # Python FastAPI service, PostGIS models, spatial analytics, auth
├── frontend/         # React application (Mapbox GL JS, analytics charts, dashboard UI)
├── .gitignore        # Unified git ignore rules for Python & Node environments
├── PROGRESS.md       # Running log of architecture decisions, progress, and run guides
└── README.md         # Project documentation and quickstart guide
```

## Core Tech Stack

- **Frontend**: React, Mapbox GL JS, Highcharts / Chart.js
- **Backend**: FastAPI (Python 3.11+)
- **Database & Spatial Engine**: PostgreSQL + PostGIS
- **Authentication**: JWT (JSON Web Tokens)
- **Code Quality & CI/CD**: Pre-commit hooks (Husky, lint-staged, Prettier, Ruff/Black), GitHub Actions CI/CD

## Getting Started

Please see [`PROGRESS.md`](./PROGRESS.md) for detailed local development setup, progress logs, architectural decisions, and current project status.
